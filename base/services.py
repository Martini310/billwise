from datetime import datetime
import requests
import urllib3
from bs4 import BeautifulSoup
from users.models import NewUser
from .models import Account, Invoice
import re
from requests.exceptions import RequestException, Timeout, ConnectionError
from django.db import transaction
import logging

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def get_pgnig(pk, login=None, password=None, account_pk=None):
    # Log in into PGNiG ebok
    token_post = requests.post( url="https://ebok.pgnig.pl/auth/login",
                                data={'identificator': login,
                                        'accessPin': password,
                                        'rememberLogin': 'false',
                                        'DeviceId': '824e02bc5b8ac6100b807f6fc6184abf',
                                        'DeviceName': 'Firefox wersja: 102.0',
                                        'DeviceType': 'Web'
                                        },
                                params={'api-version': 3.0},
                                headers={'Accept': 'application/json',
                                            'Accept-Encoding': 'gzip, deflate, br',
                                            'Host': 'ebok.pgnig.pl',
                                            'Origin': 'https://ebok.pgnig.pl',
                                            'Referer': 'https://ebok.pgnig.pl/',
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                            },
                                verify=False,
                                timeout=5000,
                                )

    # Get the token to authorize requests
    response_json = token_post.json()
    token = response_json.get('Token')

    # GET all invoices on account (actually amount declared in 'pageSize' value
    get_invoices = requests.get(url='https://ebok.pgnig.pl/crm/get-invoices-v2',
                                params={'pageNumber': 1,
                                        'api-version': 3.0,
                                        'pageSize': 30,
                                        },
                                headers={'AuthToken': token},
                                verify=False,
                                timeout=5000
                                )
    print(get_invoices.status_code)
    # Dict with all information about invoices.
    invoices_json = get_invoices.json()
    # List of all invoices as dicts.
    faktury = invoices_json['InvoicesList']

    us = NewUser.objects.get(pk=pk)
    account = Account.objects.get(pk=account_pk)

    Invoice.objects.bulk_create(
        [Invoice(number=invoice.get('Number'),
                date=datetime.fromisoformat(invoice.get('Date')[:-1]),
                amount=invoice.get('GrossAmount'),
                pay_deadline=datetime.fromisoformat(invoice.get('PayingDeadlineDate')[:-1]),
                start_date=datetime.fromisoformat(invoice.get('StartDate')[:-1]),
                end_date=datetime.fromisoformat(invoice.get('EndDate')[:-1]),
                amount_to_pay=invoice.get('AmountToPay'),
                wear=invoice.get('WearKWH'),
                user=us,
                is_paid=invoice.get('IsPaid'),
                consumption_point='test',
                account=account,
                category=account.category)
        for invoice in faktury if
        not Invoice.objects.filter(user=us, number=invoice.get('Number')).exists()])
    
    for invoice in faktury:
        db = Invoice.objects.filter(number=invoice.get('Number')).get()
        if invoice.get('IsPaid') != db.is_paid or invoice.get('AmountToPay') != db.amount_to_pay or invoice.get('GrossAmount') != db.amount:
            Invoice.objects.filter(number=invoice.get("Number")).update(is_paid=invoice.get('IsPaid'), amount_to_pay=invoice.get('AmountToPay'), amount=invoice.get('GrossAmount'))
    print("Pobrałem pgnig i zapisałem w db")





















def get_enea(user_pk, login=None, password=None, account_pk=None):

    user = NewUser.objects.get(pk=user_pk)
    account = Account.objects.get(pk=account_pk)

    payload = {
        'email': account.login,
        'password': account.password,
    }

    # Use 'with' to ensure the session context is closed after use.
    with requests.Session() as s:

        # Get the login page to get a hidden token.
        login_page = s.get('https://ebok.enea.pl/logowanie', verify=False)
        token = BeautifulSoup(login_page._content, 'html.parser')

        # Add token to the payload.
        payload['token'] = token.find('input', type='hidden')['value']

        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
            'Host': 'ebok.enea.pl',
            'Origin': 'https://ebok.enea.pl',
            'Referer': 'https://ebok.enea.pl/',
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        # LOG IN
        sign_in = s.post('https://ebok.enea.pl/logowanie', data=payload, headers=headers)
        print('Logowanie:', sign_in.status_code)

        # Handle Login error
        if sign_in.url == 'https://ebok.enea.pl/logowanie':
            soup = BeautifulSoup(sign_in.content, 'html.parser')
            login_msg = soup.find('div', class_='alert alert-danger alert-dismissible fade show alert-form')
            return print('error msg:', login_msg.text.strip())

        # An authorised request.
        # page = s.get('https://ebok.enea.pl/invoices/invoice-history')
        # print('Faktury:', page.status_code)
        # soup = BeautifulSoup(page.content, 'html.parser')

        invoice_payload = {
            'limit':200,
            'page':1,
            'direction':'DESC',
            'sort':'issueDate',
        }

        invoices_page = s.post('https://ebok.enea.pl/invoices/invoice-history', data=invoice_payload)
        soup = BeautifulSoup(invoices_page.content, 'html.parser')

        # Find username and account number.
        user_data = soup.find('span', class_='navbar-user-info-name')

        # Find div with all invoices.
        invoices = soup.find_all('div', class_='datagrid-row-content')

        all_invoices = []


        for invoice in invoices:
            date = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-date')
            name = invoice.find('span', class_='font-semibold document-download-link link-dark-blue')
            address = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-address')
            payment_date = invoice.find('div',class_='datagrid-col datagrid-col-invoice-real-with-address-payment-date')
            amount = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-value')
            amount_to_pay = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-payment')
            status = invoice.find('div', class_='datagrid-col datagrid-col-invoice-with-address-status')

            all_invoices.append(Invoice(number=name.text.strip(),
                                        date=datetime.strptime(date.text.strip(), "%d.%m.%Y"),
                                        amount=float(amount.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                                        pay_deadline=datetime.strptime(payment_date.text.strip().split()[0], "%d.%m.%Y"),
                                        start_date=None,
                                        end_date=None,
                                        amount_to_pay=float(amount_to_pay.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                                        wear=None,
                                        user=user,
                                        is_paid=True if 'Zapłacona' in status.text.strip() else False,
                                        consumption_point='test',
                                        account=account,
                                        category=account.category))

        # print(all_invoices)
        Invoice.objects.bulk_create(
            [invoice for invoice in all_invoices if not Invoice.objects.filter(number=invoice.number).exists()],
        )

        # Update existing invoices is status or amount change
        for invoice in all_invoices:
            db = Invoice.objects.filter(number=invoice.number).get()
            if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
                print(f'{invoice.number} - Aktualizuję')
                Invoice.objects.filter(number=invoice.number).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)

        # Get entry points
        # data = {'guid': '4218f3de-e608-e911-80de-005056b326a5', 'view': 'invoice'}
        #
        # points = s.post('https://ebok.enea.pl/meter/readingHistoryPoints', data=data, headers=headers)
        #
        # points_soup = BeautifulSoup(points.content, 'html.parser')
        # all = points_soup.find_all('div', class_='datagrid-col datagrid-col-inovice-filter-points-addres')
        # for point in all:
        #     a = point.find('span')
        #     print(a.text)
# get_enea(2, 'paulajak@wp.pl', 'zaq12WSX', 10)


















def get_aquanet(user_pk, login=None, password=None, account_pk=None):
    # Configure logging settings
    logging.basicConfig(
        level=logging.DEBUG,  # You can adjust the log level as needed (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        filename='get_aquanet.log',  # Log file name
        filemode='a',  # Append to the log file
        encoding='utf-8'
    )

    # Create a logger
    logger = logging.getLogger(__name__)

    try:
        user = NewUser.objects.get(pk=user_pk)
        account = Account.objects.get(pk=account_pk)

        payload = {
        'user-login-email[email]': login,
        'user-login-email[password]': password,
        'user-login-email[submit]':	"Zaloguj"
        }

        all_invoices = []


        with requests.Session() as s:

            login_page = s.get('https://ebok.aquanet.pl/user/login', verify=False)
            login_soup = BeautifulSoup(login_page._content, 'html.parser')
            token = login_soup.find('input', type='hidden')['value']

            payload['csrfp_token'] = token
            cookies = s.cookies.items()
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://ebok.aquanet.pl/user/login',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://ebok.aquanet.pl',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Cookie': f'{cookies[0][0]}={cookies[0][1]}; {cookies[1][0]}={cookies[1][1]}; cookielaw=true',
            }

            s.post('https://ebok.aquanet.pl/user/login', headers=headers, data=payload)

            page = s.get('https://ebok.aquanet.pl/faktury', headers=headers, verify=False)
            soup = BeautifulSoup(page.content, 'html.parser')

            # Number of table pages
            table_pages = soup.find('li', class_='last').find('a')
            table_pages = table_pages['href'].lstrip('?page=')

            # Find all unpaid invoices
            tables = soup.find_all('table', class_='table')

            unpaid_table = [table.find_all('tr') for table in tables if table.find('caption').find('h3').text == 'Niezapłacone'][0]

            unpaid_invoices = []
            for row in unpaid_table:
                invoice = [td.text for td in row.find_all('td') if td.text]
                if invoice and invoice[0].strip() != 'Brak danych':
                    unpaid_invoices.append(invoice)

            for unpaid in unpaid_invoices:
                date_pattern = re.compile(r'(\d{2}\.\d{2}\.\d{4}|\d{2}/\d{2}/\d{4})')

                # start_date = ''
                # end_date = ''
                dates = date_pattern.findall(unpaid[2])
                if len(dates) == 2:
                    start_date = dates[0].replace('/', '.')
                    end_date = dates[1].replace('/', '.')

                date = unpaid[3]
                number = unpaid[1]
                pay_deadline = unpaid[4]
                amount = unpaid[5].rstrip(' zł')
                to_pay = unpaid[6].rstrip(' zł')

                all_invoices.append(Invoice(number=number,
                                date=datetime.strptime(date, "%d.%m.%Y"),
                                amount=float(amount.replace(',', '.')),
                                pay_deadline=datetime.strptime(pay_deadline, "%d.%m.%Y"),
                                start_date=datetime.strptime(start_date, "%d.%m.%Y"),
                                end_date=datetime.strptime(end_date, "%d.%m.%Y"),
                                amount_to_pay=float(to_pay.replace(',', '.')),
                                user=user,
                                is_paid=False,
                                consumption_point='Brak informacji',
                                account=account,
                                category=account.category))

            paid_invoices = []
            # For every table page find all rows with invoices and append to list
            for table_page in range(int(table_pages) + 1):

                table_payload = {
                "state[_id]": "09534ea9a0668ab4b3f0c011e6c84c11",
                "state[_page]": table_page,
                "state[_count]": "-1",
                "sort[0][0]": "issuedAt",
                "sort[0][1]": "-1",
                "sort[1][0]": "id",
                "sort[1][1]": "-1"
                }

                invoice_table = s.post('https://ebok.aquanet.pl/such/table/view', headers=headers, data=table_payload, verify=False)

                table_soup = BeautifulSoup(invoice_table.content, 'html.parser')

                for tr in table_soup.find_all('tr')[1:11]:
                    paid_invoices.append([td.text for td in tr.find_all('td') if td.text])


            for row in paid_invoices[:-1:]:

                date_pattern = re.compile(r'(\d{2}\.\d{2}\.\d{4}|\d{2}/\d{2}/\d{4})')

                # start_date = ''
                # end_date = ''
                dates = date_pattern.findall(row[2])
                if len(dates) == 2:
                    start_date = dates[0].replace('/', '.')
                    end_date = dates[1].replace('/', '.')

                date = row[3]
                number = row[1]
                pay_deadline = row[4]
                amount = row[5].rstrip(' zł')

                all_invoices.append(Invoice(number=number,
                                            date=datetime.strptime(date, "%d.%m.%Y"),
                                            amount=float(amount.replace(',', '.')),
                                            pay_deadline=datetime.strptime(pay_deadline, "%d.%m.%Y"),
                                            start_date=datetime.strptime(start_date, "%d.%m.%Y"),
                                            end_date=datetime.strptime(end_date, "%d.%m.%Y"),
                                            amount_to_pay=0,
                                            wear=None,
                                            user=user,
                                            is_paid=True,
                                            consumption_point='Brak informacji',
                                            account=account,
                                            category=account.category))
        logger.info("Successfully fetched data from Aquanet")
        logger.debug("Some debug information")
                
        with transaction.atomic():

            Invoice.objects.bulk_create(
                [invoice for invoice in all_invoices if not Invoice.objects.filter(number=invoice.number).exists()],
            )

            for invoice in all_invoices:
                db = Invoice.objects.filter(number=invoice.number).get()
                if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
                    logger.info(f'{invoice.number} - Update')
                    Invoice.objects.filter(number=invoice.number).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)
                else:
                    logger.debug(f'{invoice.number} - Już jest')

    except Timeout as e:
        print(f"Timeout: {e}")
    except ConnectionError as e:
        print(f"ConnectionError: {e}")
    except RequestException as e:
        print(f"RequestException: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        
    



# get_aquanet(2, 'paulajak@wp.pl', 'zaq12WSX', 11)

# funcs = {'Enea': get_enea, 'PGNiG': get_pgnig, 'Aquanet': get_aquanet}

# def sync_accounts(user_pk):
#     accounts = Account.objects.filter(user__pk=user_pk)
#     print('działam')
#     print(accounts)
#     for account in accounts:
#         fetch = funcs.get(account.supplier.name)
#         fetch(user_pk, account.login, account.password, account.pk)
#         print(fetch.__name__)
#         print('pobrałem')