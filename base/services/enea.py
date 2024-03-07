from datetime import datetime
from bs4 import BeautifulSoup
from .decorators import supplier_log, logger
from .class_services import SyncSupplier, FetchSupplier
from requests.exceptions import RequestException


ENEA_LOGIN_URL = 'https://ebok.enea.pl/logowanie'
ENEA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    'Host': 'ebok.enea.pl',
    'Origin': 'https://ebok.enea.pl',
    'Referer': 'https://ebok.enea.pl/',
    'Content-Type': 'application/x-www-form-urlencoded',
}

@supplier_log('ENEA')
def login_to_enea(account, session):
    payload = {
        'email': account.login,
        'password': account.password,
    }

    # Get the login page
    login_page = session.get(ENEA_LOGIN_URL, verify=False)

    # Add hidden token to the payload.
    token = BeautifulSoup(login_page._content, 'html.parser')
    payload['token'] = token.find('input', type='hidden')['value']

    # LOG IN
    sign_in = session.post(ENEA_LOGIN_URL, data=payload, headers=ENEA_HEADERS)

    # Handle Login error
    if sign_in.url == ENEA_LOGIN_URL:
        soup = BeautifulSoup(sign_in.content, 'html.parser')
        login_msg = soup.find('div', class_='alert alert-danger alert-dismissible fade show alert-form')
        logger.error('[get_enea] error msg: %s', login_msg.text.strip())
        raise ValueError(login_msg.text.strip())
    

@supplier_log('ENEA')
def get_enea_invoices(session):
    invoice_payload = {
        'limit':200,
        'page':1,
        'direction':'DESC',
        'sort':'issueDate',
    }

    invoices_page = session.post('https://ebok.enea.pl/invoices/invoice-history', data=invoice_payload)
    soup = BeautifulSoup(invoices_page.content, 'html.parser')

    # Find div with all invoices.
    invoices = soup.find_all('div', class_='datagrid-row-content')

    # Find transfer title and account number.
    drop_down = soup.find('div', class_='dropdown-menu dropdown-menu-clear dropdown-content-account-details')
    user_data = drop_down.find_all('p')

    for p in user_data:
        if 'Tytuł przelewu' in p.find('strong', class_='display-block').text:
            transfer_title =  p.text.replace('Tytuł przelewu:', '').strip()
        if 'Numer konta' in p.find('strong', class_='display-block').text:
            account_number = p.text.replace('Numer konta:', '').strip()

    return {'invoices': invoices,
            'bank_account_number': account_number,
            'transfer_title': transfer_title}


@supplier_log('ENEA')
def parse_enea_invoices(invoices: dict, user: object, account: object) -> list:
    invoice_objects = []
    bank_account_number = invoices.get('bank_account_number')
    transfer_title = invoices.get('transfer_title')

    for invoice in invoices.get('invoices'):
        
        date = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-date')
        name = invoice.find('span', class_='font-semibold document-download-link link-dark-blue')
        address = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-address')
        payment_date = invoice.find('div',class_='datagrid-col datagrid-col-invoice-real-with-address-payment-date')
        amount = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-value')
        amount_to_pay = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-payment')
        status = invoice.find('div', class_='datagrid-col datagrid-col-invoice-with-address-status')
        
        invoice_objects.append({
            'number':             name.text.strip(),
            'date':               datetime.strptime(date.text.strip(), "%d.%m.%Y"),
            'amount':             float(amount.text.strip().rstrip('\xa0 zł').replace(',', '.')),
            'pay_deadline':       datetime.strptime(payment_date.text.strip().split()[0], "%d.%m.%Y"),
            'amount_to_pay':      float(amount_to_pay.text.strip().rstrip('\xa0 zł').replace(',', '.')),
            'user':               user,
            'is_paid':            True if 'Zapłacona' in status.text.strip() else False,
            'consumption_point':  address.text.strip(),
            'account':            account,
            'category':           account.category,
            'bank_account_number':bank_account_number,
            'transfer_title':     transfer_title.replace('XX/XXX/XXXX', name.text.strip())
        })

    return invoice_objects


class SyncEnea(FetchSupplier, SyncSupplier):

    ENEA_LOGIN_URL = 'https://ebok.enea.pl/logowanie'
    ENEA_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
        'Host': 'ebok.enea.pl',
        'Origin': 'https://ebok.enea.pl',
        'Referer': 'https://ebok.enea.pl/',
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    @supplier_log('ENEA')
    def login(self, session):
        payload = {
                   'email': self.account.login,
                   'password': self.account.password,
                  }
        try:
            # Get the login page
            login_page = session.get(ENEA_LOGIN_URL, verify=False)

            # Add hidden token to the payload.
            soup = BeautifulSoup(login_page._content, 'html.parser')
            payload['token'] = soup.find('input', type='hidden')['value']

            # LOG IN
            sign_in = session.post(ENEA_LOGIN_URL, data=payload, headers=ENEA_HEADERS)

            # Handle Login error
            if sign_in.url == ENEA_LOGIN_URL:
                soup = BeautifulSoup(sign_in.content, 'html.parser')
                login_msg = soup.find('div', class_='alert alert-danger alert-dismissible fade show alert-form')
                logger.error('[get_enea] error msg: %s', login_msg.text.strip())
                raise ValueError(login_msg.text.strip())
        except Exception as e:
            raise e
    
    @supplier_log('ENEA')
    def get_invoices(self, session):
        invoice_payload = {
            'limit':200,
            'page':1,
            'direction':'DESC',
            'sort':'issueDate',
        }
        try:
            invoices_page = session.post('https://ebok.enea.pl/invoices/invoice-history', data=invoice_payload)
            soup = BeautifulSoup(invoices_page.content, 'html.parser')

            # Find div with all invoices.
            invoices = soup.find_all('div', class_='datagrid-row-content')

            # Find transfer title and account number.
            drop_down = soup.find('div', class_='dropdown-menu dropdown-menu-clear dropdown-content-account-details')
            user_data = drop_down.find_all('p')

            for p in user_data:
                if 'Tytuł przelewu' in p.find('strong', class_='display-block').text:
                    transfer_title =  p.text.replace('Tytuł przelewu:', '').strip()
                if 'Numer konta' in p.find('strong', class_='display-block').text:
                    account_number = p.text.replace('Numer konta:', '').strip()

            return {'invoices': invoices,
                    'bank_account_number': account_number,
                    'transfer_title': transfer_title}
        except (RequestException, ValueError) as e:
            logger.error(f"Error occurred while fetching invoices: {e}")
            raise  # Re-raise the exception to propagate it up the call stack


    @supplier_log('ENEA')
    def parse_invoices(self, invoices):
        invoice_objects = []
        bank_account_number = invoices.get('bank_account_number')
        transfer_title = invoices.get('transfer_title')

        for invoice in invoices.get('invoices'):
            try:
                date = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-date')
                name = invoice.find('span', class_='font-semibold document-download-link link-dark-blue')
                address = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-address')
                payment_date = invoice.find('div',class_='datagrid-col datagrid-col-invoice-real-with-address-payment-date')
                amount = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-value')
                amount_to_pay = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-payment')
                status = invoice.find('div', class_='datagrid-col datagrid-col-invoice-with-address-status')
                
                invoice_objects.append({
                    'number':             name.text.strip(),
                    'date':               datetime.strptime(date.text.strip(), "%d.%m.%Y"),
                    'amount':             float(amount.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                    'pay_deadline':       datetime.strptime(payment_date.text.strip().split()[0], "%d.%m.%Y"),
                    'amount_to_pay':      float(amount_to_pay.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                    'user':               self.user,
                    'is_paid':            True if 'Zapłacona' in status.text.strip() else False,
                    'consumption_point':  address.text.strip(),
                    'account':            self.account,
                    'category':           self.account.category,
                    'bank_account_number':bank_account_number,
                    'transfer_title':     transfer_title.replace('XX/XXX/XXXX', name.text.strip())
                })

            except ValueError as e:
                logger.error(f"Error parsing invoice: {e}")
                continue  # Skip this invoice and proceed to the next one

        return invoice_objects