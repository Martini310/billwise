import re
import html
import json
from datetime import datetime
import urllib3
from bs4 import BeautifulSoup
from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncInea']
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class SyncInea(FetchSupplier, SyncSupplier):
    """
    Fetches invoices from the Moja INEA portal (moja.inea.pl).

    The portal is a Laravel/Livewire app. Login is a plain form POST; the invoice
    list is rendered by a lazy Livewire component, so after logging in we replay
    the component's ``__lazyLoad`` call against /livewire/update to get the data.
    """

    supplier_name = 'Inea'
    BASE_URL = 'https://moja.inea.pl'
    LOGIN_PAGE_URL = f'{BASE_URL}/logowanie'
    LOGIN_URL = f'{BASE_URL}/login'
    INVOICES_PAGE_URL = f'{BASE_URL}/platnosci/e-rachunek'
    LIVEWIRE_UPDATE_URL = f'{BASE_URL}/livewire/update'
    USER_AGENT = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36')

    @supplier_log(supplier_name)
    def login(self, session):
        session.headers.update({'User-Agent': self.USER_AGENT})

        # Fetch the login form to get the CSRF token and session cookies.
        page = session.get(self.LOGIN_PAGE_URL, verify=False, timeout=30)
        token_input = BeautifulSoup(page.text, 'html.parser').find('input', {'name': '_token'})
        if not token_input:
            raise ValueError('Nie udało się pobrać formularza logowania Inea.')

        response = session.post(
            self.LOGIN_URL,
            data={'_token': token_input.get('value'),
                  'login': self.account.login,
                  'password': self.account.password},
            headers={'Referer': self.LOGIN_PAGE_URL, 'Origin': self.BASE_URL},
            verify=False, timeout=30, allow_redirects=True,
        )

        # A failed login is re-rendered on the login page with an error alert.
        if response.url.rstrip('/').endswith('/logowanie'):
            soup = BeautifulSoup(response.text, 'html.parser')
            alert = soup.find(class_=re.compile(r'(error|alert|invalid|danger)', re.I))
            message = alert.get_text(' ', strip=True) if alert else 'Błędne dane logowania.'
            logger.warning('[INEA] login failed: %s', message)
            raise ValueError(message)

        logger.info('[INEA] Logged in')

    @supplier_log(supplier_name)
    def get_invoices(self, session):
        page = session.get(self.INVOICES_PAGE_URL, verify=False, timeout=30)
        soup = BeautifulSoup(page.text, 'html.parser')

        csrf_meta = soup.find('meta', {'name': 'csrf-token'})
        if not csrf_meta:
            raise ValueError('Brak tokenu CSRF na stronie faktur Inea (sesja wygasła?).')
        csrf = csrf_meta.get('content')

        # Locate the lazy "invoices" Livewire component and its initial snapshot.
        component = None
        for candidate in soup.find_all(attrs={'wire:snapshot': True}):
            try:
                snap = json.loads(html.unescape(candidate.get('wire:snapshot')))
            except (ValueError, TypeError):
                continue
            if snap.get('memo', {}).get('name') == 'invoices':
                component = candidate
                break
        if component is None:
            raise ValueError('Nie znaleziono komponentu faktur Inea.')

        snapshot = html.unescape(component.get('wire:snapshot'))
        payload_match = re.search(r"__lazyLoad\((?:&#039;|')([A-Za-z0-9+/=_-]+)", str(component)) \
            or re.search(r"__lazyLoad\('([A-Za-z0-9+/=_-]+)", html.unescape(str(component)))
        if not payload_match:
            raise ValueError('Nie udało się odczytać parametru ładowania faktur Inea.')

        body = {
            '_token': csrf,
            'components': [{
                'snapshot': snapshot,
                'updates': {},
                'calls': [{'path': '', 'method': '__lazyLoad', 'params': [payload_match.group(1)]}],
            }],
        }
        response = session.post(
            self.LIVEWIRE_UPDATE_URL, json=body,
            headers={'X-Livewire': '', 'X-CSRF-TOKEN': csrf,
                     'Referer': self.INVOICES_PAGE_URL, 'X-Requested-With': 'XMLHttpRequest'},
            verify=False, timeout=30,
        )
        data = response.json()
        updated_snapshot = json.loads(data['components'][0]['snapshot'])
        invoices = self._unwrap(updated_snapshot['data']['invoices'])
        return {'invoices': [self._unwrap(item) for item in invoices]}

    @staticmethod
    def _unwrap(value):
        """Unwrap Livewire's array serialization: [payload, {"s": "arr"}] -> payload."""
        if isinstance(value, list) and len(value) == 2 and isinstance(value[1], dict) and 's' in value[1]:
            return value[0]
        return value

    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        invoice_objects = []
        for invoice in invoices.get('invoices'):
            try:
                is_paid = invoice.get('invoicePaymentStatus') == 'settled'
                amount = invoice.get('amountInGrosze', 0) / 100
                deadline = datetime.strptime(invoice['paymentDate'], '%Y-%m-%d')
                invoice_objects.append({
                    'number':             invoice['invoiceNumber'],
                    # The list view only exposes the payment date; use it for both
                    # the invoice date and the deadline until a detail source is added.
                    'date':               deadline,
                    'amount':             amount,
                    'pay_deadline':       deadline,
                    'amount_to_pay':      0.0 if is_paid else amount,
                    'user':               self.user,
                    'is_paid':            is_paid,
                    'account':            self.account,
                    'category':           self.account.category,
                    'transfer_title':     invoice['invoiceNumber'],
                })
            except (KeyError, ValueError, TypeError) as e:
                logger.error(f"[INEA] Error parsing invoice: {e}")
                continue

        return invoice_objects
