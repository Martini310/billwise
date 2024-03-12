from datetime import datetime
from bs4 import BeautifulSoup
import re
from ..decorators import supplier_log, logger
from ..class_services import FetchSupplier, SyncSupplier


__all__ = ['SyncAquanet']


class SyncAquanet(FetchSupplier, SyncSupplier):
    
    supplier_name = 'Aquanet'
    AQUANET_LOGIN_URL = 'https://ebok.aquanet.pl/user/login'
    
    @supplier_log(supplier_name)
    def login(self, session):
        payload = {
            'user-login-email[email]': self.account.login,
            'user-login-email[password]': self.account.password,
            'user-login-email[submit]':	"Zaloguj"
            }
        
        login_page = session.get(self.AQUANET_LOGIN_URL, verify=False)
        login_soup = BeautifulSoup(login_page._content, 'html.parser')
        token = login_soup.find('input', type='hidden')['value']

        payload['csrfp_token'] = token
        cookies = session.cookies.items()
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
            'Referer': self.AQUANET_LOGIN_URL,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://ebok.aquanet.pl',
            'Connection': 'keep-alive',
            'Cookie': f'{cookies[0][0]}={cookies[0][1]}; {cookies[1][0]}={cookies[1][1]}; cookielaw=true',
        }

        session.headers.update(headers)
        sign_in = session.post(self.AQUANET_LOGIN_URL, data=payload)
        # Handle Login error
        if sign_in.url == self.AQUANET_LOGIN_URL:
            soup = BeautifulSoup(sign_in.content, 'html.parser')
            error_msg_div = soup.find('div', class_='alert alert-danger') or soup.find('div', class_='form-error-container')
            error_login_msg = error_msg_div.text.strip()
            logger.warning('[AQUANET] error msg: %s', error_login_msg)
            raise ValueError(error_login_msg)
        
        
    @supplier_log(supplier_name)
    def get_invoices(self, session):
        page = session.get('https://ebok.aquanet.pl/faktury', verify=False)
        soup = BeautifulSoup(page.content, 'html.parser')

        # Find all unpaid invoices
        tables = soup.find_all('table', class_='table')

        unpaid_table = [table.find_all('tr') for table in tables if table.find('caption').find('h3').text == 'Niezapłacone'][0]

        unpaid_invoices = []
        for row in unpaid_table:
            invoice = [td.text for td in row.find_all('td') if td.text]
            if invoice and invoice[0].strip() != 'Brak danych':
                unpaid_invoices.append(invoice)

        # Find all paid invoices
        paid_invoices = []
        
        table_pages = soup.find('li', class_='last').find('a')
        table_pages = table_pages['href'].lstrip('?page=') # Number of table pages

        # For every table page find all rows with invoices and append to list
        for table_page in range(int(table_pages) + 1):

            table_payload = {
                "state[_id]": "09534ea9a0668ab4b3f0c011e6c84c11",
                "state[_page]": table_page,
                "state[_count]": "-1",
            }

            invoice_table = session.post('https://ebok.aquanet.pl/such/table/view', data=table_payload, verify=False)

            table_soup = BeautifulSoup(invoice_table.content, 'html.parser')

            for tr in table_soup.find_all('tr')[1:11]:
                paid_invoices.append([td.text for td in tr.find_all('td') if td.text])

        # Find bank account number
        divs = soup.find_all('div', class_='form-field col-xs-6')
        for div in divs:
            if 'Numer konta' in div.find('span', class_='form-label').text:
                account_number = div.find('strong').text.strip()
                break

        return {'invoices': [*paid_invoices, *unpaid_invoices], 'bank_account_number': account_number}


    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        invoice_objects = []
        for invoice in invoices.get('invoices'):
            if len(invoice) > 1: # skip empty rows
                date_pattern = re.compile(r'(\d{2}\.\d{2}\.\d{4}|\d{2}/\d{2}/\d{4})')

                dates = date_pattern.findall(invoice[2])
                if len(dates) == 2:
                    start_date = dates[0].replace('/', '.')
                    end_date = dates[1].replace('/', '.')

                invoice_objects.append({
                    'number':             invoice[1],
                    'date':               datetime.strptime(invoice[3], "%d.%m.%Y"),
                    'amount':             float(invoice[5].rstrip(' zł').replace(',', '.')),
                    'pay_deadline':       datetime.strptime(invoice[4], "%d.%m.%Y"),
                    'start_date':         datetime.strptime(start_date, "%d.%m.%Y") or '',
                    'end_date':           datetime.strptime(end_date, "%d.%m.%Y") or '',
                    'amount_to_pay':      float(invoice[6].rstrip(' zł').replace(',', '.')) if len(invoice)>= 7 else 0,
                    'user':               self.user,
                    'is_paid':            len(invoice) == 6,
                    'account':            self.account,
                    'category':           self.account.category,
                    'bank_account_number':invoices.get('bank_account_number'),
                    'transfer_title':     invoice[1]
                    })
                
        return invoice_objects
