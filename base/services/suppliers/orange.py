import re
from datetime import datetime, timedelta
import urllib3
from bs4 import BeautifulSoup
from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncOrange']
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

_PL_MONTHS = {
    'stycznia': 1, 'lutego': 2, 'marca': 3, 'kwietnia': 4, 'maja': 5, 'czerwca': 6,
    'lipca': 7, 'sierpnia': 8, 'września': 9, 'wrzesnia': 9, 'października': 10,
    'pazdziernika': 10, 'listopada': 11, 'grudnia': 12,
}
_PL_MONTHS_NOM = {
    'styczeń': 1, 'luty': 2, 'marzec': 3, 'kwiecień': 4, 'maj': 5, 'czerwiec': 6,
    'lipiec': 7, 'sierpień': 8, 'wrzesień': 9, 'październik': 10, 'listopad': 11, 'grudzień': 12,
}


class SyncOrange(FetchSupplier, SyncSupplier):
    """
    Fetches invoices from Mój Orange (www.orange.pl).

    Login goes through Orange's custom SSO (init -> password -> SMS). The SMS step
    is skipped on subsequent logins once a trusted device is registered: the
    one-time setup (see setup_device below) stores the AUTH_DEVICE_TOKEN on the
    account, and presenting it lets the password step complete without an SMS.

    Invoices are read from the legacy Mój Orange AJAX fragments, which (unlike the
    WAF-protected /occ/api billing API) are reachable server-side.
    """

    supplier_name = 'Orange'
    ORIGIN = 'https://www.orange.pl'
    LOGIN_BASE = f'{ORIGIN}/twojekonto'
    PAID_URL = f'{ORIGIN}/moj-orange/ajax/paidInvoicesLight/init'
    UNPAID_URL = f'{ORIGIN}/moj-orange/ajax/unpaidInvoicesDetails/init'
    USER_AGENT = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36')

    @supplier_log(supplier_name)
    def login(self, session):
        if not self.account.device_token:
            raise ValueError(
                'Konto Orange nie ma zapisanego tokenu zaufanego urządzenia. '
                'Uruchom jednorazową konfigurację (logowanie z kodem SMS), aby go pobrać.'
            )

        session.headers.update({'User-Agent': self.USER_AGENT})
        session.cookies.set('AUTH_DEVICE_TOKEN', self.account.device_token,
                            domain='www.orange.pl', path='/')

        hdr = {'Origin': self.ORIGIN, 'Referer': f'{self.LOGIN_BASE}/zaloguj'}
        session.get(f'{self.LOGIN_BASE}/zaloguj', verify=False, timeout=30)
        session.get(f'{self.LOGIN_BASE}/session/check', verify=False, timeout=30)

        init = session.post(f'{self.LOGIN_BASE}/login/init',
                            json={'login': self.account.login}, headers=hdr,
                            verify=False, timeout=30).json()
        if not init.get('executionId'):
            raise ValueError('Nie udało się rozpocząć logowania Orange (sesja/CSRF).')

        resp = session.post(f'{self.LOGIN_BASE}/login/action',
                            json={'action': 'LOGIN_2FA_PASSWORD',
                                  'executionId': init['executionId'],
                                  'state': init['state'],
                                  'login': self.account.login,
                                  'password': self.account.password},
                            headers=hdr, verify=False, timeout=30).json()
        action = resp.get('requireAction')
        if action == 'COMPLETED':
            logger.info('[ORANGE] Logged in without SMS (trusted device)')
            return
        if action in ('LOGIN_2FA_SMS', 'LOGIN_2FA_SMS_RETRY'):
            raise ValueError(
                'Token zaufanego urządzenia Orange wygasł — wymagany ponowny SMS. '
                'Uruchom jednorazową konfigurację.'
            )
        raise ValueError(f'Nieoczekiwany wynik logowania Orange: {action or resp.get("message")}')

    @supplier_log(supplier_name)
    def get_invoices(self, session):
        # Warm up the Mój Orange (ecare) session first, otherwise the invoice
        # fragments come back as the empty page shell instead of the data.
        session.get(f'{self.ORIGIN}/moj-orange', verify=False, timeout=30)
        hdr = {'X-Requested-With': 'XMLHttpRequest', 'Referer': f'{self.ORIGIN}/moj-orange'}
        paid = session.get(self.PAID_URL, headers=hdr, verify=False, timeout=30).text
        unpaid = session.get(self.UNPAID_URL, headers=hdr, verify=False, timeout=30).text
        return {'paid_html': paid, 'unpaid_html': unpaid}

    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        invoice_objects = []
        invoice_objects.extend(self._parse_paid(invoices.get('paid_html', '')))
        invoice_objects.extend(self._parse_unpaid(invoices.get('unpaid_html', '')))
        return invoice_objects

    def _parse_paid(self, html):
        objects = []
        soup = BeautifulSoup(html, 'html.parser')
        for section in soup.select('div.opl-section--expander'):
            text = re.sub(r'\s+', ' ', section.get_text(' ', strip=True))
            number = re.search(r'F\d{6,}/\d{3}/\d{2}', text)
            amount = re.search(r'(\d{1,4},\d{2})\s*zł', text)
            if not number or not amount:
                continue
            issued = self._pl_date(re.search(r'wystawiona\s+(\d{1,2}\s+\w+\s+\d{4})', text))
            paid_on = self._pl_date(re.search(r'(\d{1,2}\s+\w+\s+\d{4})\s*(?:Zobacz|Pobierz|$)', text))
            date = issued or paid_on
            if not date:
                continue
            objects.append(self._invoice(number.group(), amount.group(1), date,
                                         paid_on or date, is_paid=True))
        return objects

    def _parse_unpaid(self, html):
        objects = []
        soup = BeautifulSoup(html, 'html.parser')
        text = re.sub(r'\s+', ' ', soup.get_text(' ', strip=True))
        number = re.search(r'F\d{6,}/\d{3}/\d{2}', text)
        amount = re.search(r'(\d{1,4},\d{2})\s*zł', text)
        if not number or not amount:
            return objects
        month = re.search(r'(' + '|'.join(_PL_MONTHS_NOM) + r')\s+(\d{4})', text, re.I)
        if month:
            date = datetime(int(month.group(2)), _PL_MONTHS_NOM[month.group(1).lower()], 1)
        else:
            date = datetime.today().replace(day=1)
        # Due date is not exposed in this fragment; approximate from the period.
        deadline = date + timedelta(days=40)
        objects.append(self._invoice(number.group(), amount.group(1), date, deadline, is_paid=False))
        return objects

    def _invoice(self, number, amount_str, date, deadline, is_paid):
        amount = float(amount_str.replace(',', '.'))
        return {
            'number':             number,
            'date':               date,
            'amount':             amount,
            'pay_deadline':       deadline,
            'amount_to_pay':      0.0 if is_paid else amount,
            'user':               self.user,
            'is_paid':            is_paid,
            'account':            self.account,
            'category':           self.account.category,
            'transfer_title':     number,
        }

    @staticmethod
    def _pl_date(match):
        if not match:
            return None
        m = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})', match.group(1))
        month = _PL_MONTHS.get(m.group(2).lower()) if m else None
        if not m or not month:
            return None
        return datetime(int(m.group(3)), month, int(m.group(1)))
