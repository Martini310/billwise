import os
import json
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
import urllib3
from requests.exceptions import RequestException
from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncPlus']
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

_WARSAW = ZoneInfo('Europe/Warsaw')


class SyncPlus(FetchSupplier, SyncSupplier):
    """
    Fetches invoices from Plus (Polkomtel) via the iPlus mobile API (mapi.plus.pl).

    The web portal is behind a Polsat/Nelsson bot wall, but the mobile app talks to
    a plain REST API over HTTPS. Login reuses the OAuth refresh token captured from
    the app (scope ``offline``): each sync exchanges it for a short-lived access
    token (``grant_type=refresh_token``), exactly like the Orange trusted-device
    flow. The session blob (refresh token, device id, billing account) is stored on
    ``Account.device_token`` as JSON — populate it once with ``manage.py setup_plus``.

    Invoices come from the billing-account balance endpoint, which returns up to a
    year of bills with amounts, periods, due dates and the outstanding (overdue)
    amount that tells us whether a bill is still unpaid.
    """

    supplier_name = 'Plus'
    BASE_URL = 'https://mapi.plus.pl'
    TOKEN_URL = f'{BASE_URL}/oauth/v1/token'
    # Fixed Basic client credential of the iPlus mobile app (client_id:client_secret).
    # It is embedded in the app binary and identical for every user; the token
    # endpoint rejects the refresh grant without it. Kept out of version control:
    # set PLUS_CLIENT_AUTHORIZATION in .env to the exact `Authorization: Basic ...`
    # header value from the app's POST /oauth/v1/token request.
    CLIENT_AUTHORIZATION = os.environ.get('PLUS_CLIENT_AUTHORIZATION', '')
    # API danych Plusa potrafi odrzucać IP spoza PL / z datacenter (401 na /balance).
    # Ustaw PLUS_PROXY (np. http://user:pass@host:port) by przepuścić CAŁY ruch Plusa
    # — OAuth i API — przez to samo polskie IP (token wystawiany i używany z 1 IP).
    PROXY = os.environ.get('PLUS_PROXY', '')
    USER_AGENT = 'IOS/27.0.1/Apple'
    APP_VERSION = '2.875.2690'
    APP_BUILD = '28752690'

    def _config(self):
        """Read the stored Plus session blob from Account.device_token."""
        raw = (self.account.device_token or '').strip()
        if not raw:
            raise ValueError(
                'Konto Plus nie ma zapisanej sesji. Uruchom jednorazową konfigurację: '
                'manage.py setup_plus <id_konta>.'
            )
        try:
            cfg = json.loads(raw)
        except ValueError:
            # Backwards-compatible: a bare string is treated as the refresh token.
            cfg = {'refresh_token': raw}
        if not cfg.get('refresh_token'):
            raise ValueError('Brak refresh_token w sesji Plus. Uruchom ponownie setup_plus.')
        if not cfg.get('bill_account') and (self.account.login or '').strip().isdigit():
            cfg['bill_account'] = self.account.login.strip()
        return cfg

    def _save_config(self, cfg):
        self.account.device_token = json.dumps(cfg)
        self.account.save(update_fields=['device_token'])

    @supplier_log(supplier_name)
    def login(self, session):
        if not self.CLIENT_AUTHORIZATION:
            raise ValueError(
                'Brak sekretu klienta iPlus — ustaw PLUS_CLIENT_AUTHORIZATION w .env '
                '(nagłówek Authorization: Basic z żądania POST /oauth/v1/token).'
            )

        if self.PROXY:
            session.proxies.update({'http': self.PROXY, 'https': self.PROXY})
            logger.info('[PLUS] Ruch przez PLUS_PROXY')

        cfg = self._config()
        self._cfg = cfg
        device_id = cfg.get('device_id') or str(uuid.uuid4())
        session.headers.update({
            'User-Agent': self.USER_AGENT,
            'Accept': '*/*',
            'Accept-Language': 'pl-PL,pl;q=0.9',
            'device-id': device_id,
            'x-app-version': self.APP_VERSION,
            'x-app-build': self.APP_BUILD,
        })

        resp = session.post(
            self.TOKEN_URL,
            data={'grant_type': 'refresh_token', 'refresh_token': cfg['refresh_token']},
            headers={'Authorization': self.CLIENT_AUTHORIZATION,
                     'Content-Type': 'application/x-www-form-urlencoded'},
            verify=False, timeout=30,
        )
        if resp.status_code != 200:
            raise ValueError(
                'Logowanie Plus nie powiodło się (refresh_token wygasł lub został '
                'unieważniony przez aplikację). Przechwyć nowy token i uruchom setup_plus.'
            )

        data = resp.json()
        token = data.get('access_token')
        if not token:
            raise ValueError('Brak access_token w odpowiedzi logowania Plus.')

        # Ory rotates the refresh token on use — persist the new one so the next
        # sync keeps working, otherwise the stored token becomes invalid.
        new_refresh = data.get('refresh_token')
        if new_refresh and new_refresh != cfg['refresh_token']:
            cfg['refresh_token'] = new_refresh
            self._cfg = cfg
            self._save_config(cfg)

        session.headers.update({'Authorization': f'Bearer {token}',
                                'Content-Type': 'application/json'})
        logger.info('[PLUS] Logged in via refresh token')

    @supplier_log(supplier_name)
    def get_invoices(self, session):
        bill_account = self._cfg.get('bill_account') or self._discover_bill_account(session)
        if not bill_account:
            raise ValueError(
                'Nie znam numeru konta rozliczeniowego Plus (billAccountCode). '
                'Ustaw go w setup_plus albo w polu login konta.'
            )
        resp = session.get(
            f'{self.BASE_URL}/api/v1/account/billing-account/{bill_account}/balance',
            params={'billsLimit': 12}, verify=False, timeout=30,
        )
        if resp.status_code != 200:
            # Pokaż treść odpowiedzi API — mówi WPROST czemu odmawia (token,
            # lokalizacja, sesja). ValueError zamiast raise_for_status: nie ponawiamy
            # 3× na błędzie autoryzacji (każde ponowienie rotowałoby token Plusa).
            body = (resp.text or '').strip()[:400]
            logger.error(f'[PLUS] /balance HTTP {resp.status_code}: {body}')
            raise ValueError(f'Plus /balance HTTP {resp.status_code}: {body or "(pusta odpowiedź)"}')
        return {'bills': resp.json().get('bills', [])}

    def _discover_bill_account(self, session):
        """Best-effort fallback: find a billing-account code in the SSO accounts list."""
        try:
            data = session.get(f'{self.BASE_URL}/api/v1/sso/authorized-accounts',
                               verify=False, timeout=30).json()
        except (RequestException, ValueError):
            return None
        found = []

        def walk(node):
            if isinstance(node, dict):
                for key, value in node.items():
                    if key.lower() in ('billaccountcode', 'billingaccountid', 'billaccount') \
                            and isinstance(value, (str, int)):
                        found.append(str(value))
                    else:
                        walk(value)
            elif isinstance(node, list):
                for item in node:
                    walk(item)

        walk(data)
        return found[0] if found else None

    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        invoice_objects = []
        for bill in invoices.get('bills', []):
            try:
                period = bill.get('billingPeriod') or {}
                date = self._pl_date(period.get('to'))
                deadline = self._pl_date(bill.get('paymentDate')) or date
                total = float(bill.get('totalAmount') or 0)
                overdue = float(bill.get('overdueAmount') or 0)
                is_paid = overdue == 0
                number = f'Plus {date:%Y-%m}' if date else f"Plus {bill.get('id')}"
                invoice_objects.append({
                    'number':         number,
                    'date':           date,
                    'amount':         total,
                    'pay_deadline':   deadline,
                    'start_date':     self._pl_date(period.get('from')),
                    'end_date':       date,
                    'amount_to_pay':  0.0 if is_paid else overdue,
                    'user':           self.user,
                    'is_paid':        is_paid,
                    'account':        self.account,
                    'category':       self.account.category,
                    'transfer_title': number,
                })
            except (ValueError, TypeError) as e:
                logger.error(f'[PLUS] Error parsing bill: {e}')
                continue
        return invoice_objects

    @staticmethod
    def _pl_date(iso):
        """Parse an ISO-8601 UTC timestamp to the intended local (Warsaw) date.

        Plus stores local midnight as UTC (e.g. ``2026-11-04T23:00:00Z`` == 5 Nov
        00:00 CET), so a naive ``[:10]`` would be a day early — convert first.
        """
        if not iso:
            return None
        try:
            dt = datetime.fromisoformat(iso.replace('Z', '+00:00'))
            return dt.astimezone(_WARSAW).date()
        except (ValueError, AttributeError):
            return None
