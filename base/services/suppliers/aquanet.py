from datetime import datetime
import urllib3
import pyotp
from ..decorators import supplier_log, logger
from ..class_services import FetchSupplier, SyncSupplier


__all__ = ['SyncAquanet']
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class SyncAquanet(FetchSupplier, SyncSupplier):

    supplier_name = 'Aquanet'
    AQUANET_BASE_URL = 'https://ebok.aquanet.pl'
    AQUANET_LOGIN_URL = f'{AQUANET_BASE_URL}/api/login'
    AQUANET_GRAPHQL_URL = f'{AQUANET_BASE_URL}/api/graphql'

    @supplier_log(supplier_name)
    def login(self, session):
        payload = {
            'email': self.account.login,
            'password': self.account.password,
        }
        response = session.post(self.AQUANET_LOGIN_URL, json=payload, verify=False)
        data = response.json()

        # Handle login error (bad credentials).
        if data.get('status') == 400:
            error_login_msg = data.get('error')
            logger.warning('[AQUANET] error msg: %s', error_login_msg)
            raise ValueError(error_login_msg)

        # The portal requires two-factor authentication. The initial /api/login
        # only sets the session cookie and tells us which 2FA method is needed;
        # the session is not fully authenticated until 2FA is confirmed.
        if data.get('2fa_path'):
            self.pass_2fa(session, data)

    @supplier_log(supplier_name)
    def pass_2fa(self, session, login_data):
        """
        Confirm two-factor authentication.

        Aquanet confirms 2FA with a form POST (field ``_auth_code``) to the path
        returned by /api/login (``2fa_path``). For the TOTP_APPLICATION method we
        can generate the 6-digit code ourselves from the account's TOTP secret -
        the same shared secret an authenticator app uses. SMS/email methods cannot
        be automated and are reported so the user can act on them.
        """
        method = login_data.get('2fa_method')

        if method != 'TOTP_APPLICATION':
            raise ValueError(
                f'Konto Aquanet wymaga 2FA metodą "{method}", której nie można '
                'obsłużyć automatycznie. Automatyczny kod działa tylko dla '
                'aplikacji authenticator (TOTP).'
            )

        if not self.account.totp_secret:
            raise ValueError(
                'Konto Aquanet ma włączone 2FA (aplikacja authenticator). '
                'Uzupełnij "Sekret TOTP" w ustawieniach konta, aby umożliwić '
                'automatyczne pobieranie faktur.'
            )

        try:
            code = self._totp_code(self.account.totp_secret)
        except Exception as exc:
            raise ValueError(f'Nieprawidłowy sekret TOTP dla konta Aquanet: {exc}') from exc

        verify_url = self.AQUANET_BASE_URL + login_data['2fa_path']
        session.post(
            verify_url,
            data={'_auth_code': code, '_is_trusted_device': '0'},
            verify=False,
            allow_redirects=True,
        )

        # The 2FA form does not return a reliable JSON status, so confirm success
        # by checking that the authenticated GraphQL API no longer rejects us.
        if not self._is_authenticated(session):
            raise ValueError(
                'Weryfikacja 2FA Aquanet nie powiodła się. Sprawdź, czy "Sekret '
                'TOTP" jest poprawny (zegar urządzenia zsynchronizowany).'
            )

    @staticmethod
    def _totp_code(secret):
        """
        Return the current 6-digit TOTP code.

        Accepts either a raw base32 secret or a full ``otpauth://`` provisioning
        URI (what the authenticator QR code encodes), so the user can paste
        whichever one the portal exposes.
        """
        secret = (secret or '').strip()
        if secret.lower().startswith('otpauth://'):
            return pyotp.parse_uri(secret).now()
        return pyotp.TOTP(secret.replace(' ', '')).now()

    def _is_authenticated(self, session):
        """Return True if the session can query the authenticated GraphQL API."""
        probe = session.post(
            self.AQUANET_GRAPHQL_URL,
            json={'query': '{ __typename }'},
            verify=False,
        )
        try:
            errors = probe.json().get('errors') or []
        except ValueError:
            return False
        return not any(
            'two_factor_authentication_required' in (e.get('message') or '')
            for e in errors
        )

    PAGE_SIZE = 100

    @supplier_log(supplier_name)
    def get_invoices(self, session):
        query = '''
        query GetInvoices(
            $filter: InvoicesQueryFilterInput!
            $limit:  Int!
            $offset: Int!
            ) {
            invoices(filter: $filter, limit: $limit, offset: $offset) {
                id
                number
                type
                groupType
                status
                value
                issuedAt
                paymentDeadlineAt
                fileUrl
            }
        }
        '''
        # The API returns exactly `limit` rows (limit=0 yields nothing), so page
        # through the history until a short page signals the end.
        all_invoices = []
        offset = 0
        while True:
            variables = {
                "filter": {
                    "statuses": [],
                    "groupTypes": [],
                    "issuedAtFrom": None,
                    "issuedAtTo": None,
                    "number": ""
                },
                "limit": self.PAGE_SIZE,
                "offset": offset
            }
            response = session.post(self.AQUANET_GRAPHQL_URL, json={'query': query, 'variables': variables})
            data = response.json()

            if data.get('errors'):
                messages = '; '.join(e.get('message', '') for e in data['errors'])
                logger.error(f"[AQUANET] GraphQL errors: {messages}")
                raise ValueError(f'Aquanet zwrócił błąd: {messages}')

            page = data['data']['invoices']
            all_invoices.extend(page)
            if len(page) < self.PAGE_SIZE:
                break
            offset += self.PAGE_SIZE

        return {'invoices': all_invoices}

    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        invoice_objects = []
        for invoice in invoices.get('invoices'):
            is_paid = invoice['status'] == 'PAID'
            value = float(invoice['value'])
            invoice_objects.append({
                'number':             invoice['number'],
                'date':               datetime.fromtimestamp(int(invoice['issuedAt'])),
                'amount':             value,
                'pay_deadline':       datetime.fromtimestamp(int(invoice['paymentDeadlineAt'])),
                'amount_to_pay':      0.0 if is_paid else value,
                'user':               self.user,
                'is_paid':            is_paid,
                'account':            self.account,
                'category':           self.account.category,
                'bank_account_number': invoices.get('bank_account_number'),
                'transfer_title':     invoice['number'],
            })

        return invoice_objects
