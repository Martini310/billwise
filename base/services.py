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


PGNIG_LOGIN_URL = "https://ebok.pgnig.pl/auth/login"
PGNIG_INVOICES_URL = "https://ebok.pgnig.pl/crm/get-invoices-v2"
PGNIG_API_VERSION = "3.0"
ENEA_LOGIN_URL = 'https://ebok.enea.pl/logowanie'
ENEA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    'Host': 'ebok.enea.pl',
    'Origin': 'https://ebok.enea.pl',
    'Referer': 'https://ebok.enea.pl/',
    'Content-Type': 'application/x-www-form-urlencoded',
}
AQUANET_LOGIN_URL = 'https://ebok.aquanet.pl/user/login'

def setup_logging():
    logging.basicConfig(
        level=logging.DEBUG,
        filename='services.log',
        filemode='a',
        encoding='utf-8',
        format='%(asctime)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    logger = logging.getLogger(__name__)

    return logger


logger = setup_logging()


def update_invoices_in_db(invoices: list, user: object, supplier: str):
    # Update existing invoices if status or amount change
    for invoice in invoices:
        db = Invoice.objects.filter(number=invoice.number, user=user).get()
        if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
            logger.info(f'[get_{supplier}] {invoice.number} - Updating')
            Invoice.objects.filter(number=invoice.number, user=user).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)


def login_to_pgnig(account):
    logger.info("Starting login_to_pgnig()")
    response = requests.post(
        url=PGNIG_LOGIN_URL,
        data={
            'identificator': account.login,
            'accessPin': account.password,
            'DeviceId': '824e02bc5b8ac6100b807f6fc6184abf',
            'DeviceType': 'Web'
        },
        params={'api-version': PGNIG_API_VERSION},
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

    response.raise_for_status()
    logger.info("Fetched token")
    return response.json().get('Token')


def get_invoices(token):
    logger.info("Staring get_invoices()")
    # GET invoices on account - amount declared in 'pageSize'
    get_invoices = requests.get(url=PGNIG_INVOICES_URL,
                                params={'pageNumber': 1,
                                        'api-version': 3.0,
                                        'pageSize': 100,
                                },
                                headers={'AuthToken': token},
                                verify=False,
                                timeout=5000
                                )
    logger.info("Finished get_invoices()")
    return get_invoices.json()['InvoicesList']


def create_invoice_objects(invoices, user, account):
    logger.info("Staring create_invoice_objects()")
    return [Invoice( number=invoice.get('Number'),
                    date=datetime.fromisoformat(invoice.get('Date')[:-1]),
                    amount=invoice.get('GrossAmount'),
                    pay_deadline=datetime.fromisoformat(invoice.get('PayingDeadlineDate')[:-1]),
                    start_date=datetime.fromisoformat(invoice.get('StartDate')[:-1]),
                    end_date=datetime.fromisoformat(invoice.get('EndDate')[:-1]),
                    amount_to_pay=invoice.get('AmountToPay'),
                    wear=invoice.get('WearKWH'),
                    user=user,
                    is_paid=invoice.get('IsPaid'),
                    consumption_point='test',
                    account=account,
                    category=account.category)
        for invoice in invoices if
        not Invoice.objects.filter(user=user, number=invoice.get('Number')).exists()]


def update_invoice_objects(invoices, user):
    logger.info("Staring update_invoice_objects()")
    for invoice in invoices:
        try:
            db_invoice = Invoice.objects.filter(number=invoice.get('Number'), user=user).get() # get the invoice from the database
            # check if the status or amount changed
            if invoice.get('IsPaid') != db_invoice.is_paid or invoice.get('AmountToPay') != db_invoice.amount_to_pay or invoice.get('GrossAmount') != db_invoice.amount:
                # if changes detected, update the invoice in the database
                Invoice.objects.filter(number=invoice.get("Number"), user=user).update(is_paid=invoice.get('IsPaid'), amount_to_pay=invoice.get('AmountToPay'), amount=invoice.get('GrossAmount'))
                logger.info(f"{invoice.get('Number')} - Updated")
                print(f"{invoice.get('Number')} - Updated")
            else:
                print(f"{invoice.get('Number')} - No changes detected")
        except Invoice.DoesNotExist:
            logger.warning(f"Invoice {invoice.get('Number')} does not exist in the database.")
            print(f"Invoice {invoice.get('Number')} does not exist in the database.")
        except Exception as e:
            logger.warning(f"An unexpected error occurred: {e}")
            print(f"An unexpected error occurred: {e}")


def get_pgnig(pk, account_pk):

    user = NewUser.objects.get(pk=pk)
    account = Account.objects.get(pk=account_pk)
    
    logger.info("Rozpoczynam pobieranie danych z PGNiG użytkownika %s", user.user_name)

    try:
        token = login_to_pgnig(account)
        invoices = get_invoices(token)
        invoice_instances = create_invoice_objects(invoices, user, account)
        Invoice.objects.bulk_create(invoice_instances)
        update_invoice_objects(invoice_instances, user)

        logger.info("Zakończyłem pobieranie danych z PGNiG użytkownika %s", user.user_name)
        print("Pobrałem PGNiG i zapisałem w DB..")

    except Timeout as e:
        logger.debug("Timeout: %s", e)
    except ConnectionError as e:
        logger.debug("ConnectionError: %s", e)
    except RequestException as e:
        logger.debug("RequestException: %s", e)
    except Exception as e:
        logger.debug("An unexpected error occurred: %s", e)


# get_pgnig(2, 9)









def login_to_enea(account, session, ):
    logger.info("Starting login_to_enea()")

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
    
    logger.info(f'[get_enea] Succesfull login to Enea')


def create_enea_invoice_objects(invoices: list, user: object, account: object) -> list:
    invoice_objects = []

    for invoice in invoices:
        date = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-date')
        name = invoice.find('span', class_='font-semibold document-download-link link-dark-blue')
        address = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-address')
        payment_date = invoice.find('div',class_='datagrid-col datagrid-col-invoice-real-with-address-payment-date')
        amount = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-value')
        amount_to_pay = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-payment')
        status = invoice.find('div', class_='datagrid-col datagrid-col-invoice-with-address-status')

        invoice_objects.append(Invoice(
                        number=name.text.strip(),
                        date=datetime.strptime(date.text.strip(), "%d.%m.%Y"),
                        amount=float(amount.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                        pay_deadline=datetime.strptime(payment_date.text.strip().split()[0], "%d.%m.%Y"),
                        amount_to_pay=float(amount_to_pay.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                        user=user,
                        is_paid=True if 'Zapłacona' in status.text.strip() else False,
                        consumption_point='test',
                        account=account,
                        category=account.category))
        
    return invoice_objects


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

    # Find username and account number.
    # user_data = soup.find('span', class_='navbar-user-info-name')
    return invoices


def get_enea(user_pk, account_pk):
    try:
        user = NewUser.objects.get(pk=user_pk)
        account = Account.objects.get(pk=account_pk)

        logger.info("[get_enea] Rozpoczynam pobieranie danych z Enea użytkownika %s", user.user_name)
        with requests.Session() as s:
            login_to_enea(account, s)
            invoices = get_enea_invoices(s)
            invoice_objects = create_enea_invoice_objects(invoices, user, account)

        Invoice.objects.bulk_create(
            [invoice for invoice
            in invoice_objects
            if not Invoice.objects.filter(number=invoice.number).exists()
            ],
        )

        update_invoices_in_db(invoice_objects, user, 'enea')

        logger.info("[get_enea] Zakończyłem pobieranie danych z Enea użytkownika %s", user.user_name)

    except Timeout as e:
        logger.debug("[get_enea] Timeout: %s", e)
    except ConnectionError as e:
        logger.debug("[get_enea] ConnectionError: %s", e)
    except RequestException as e:
        logger.debug("[get_enea] RequestException: %s", e)
    except Exception as e:
        logger.debug("[get_enea] An unexpected error occurred: %s", e)


#         # Get entry points
#         data = {'guid': '4218f3de-e608-e911-80de-005056b326a5', 'view': 'invoice'}
        
#         points = s.post('https://ebok.enea.pl/meter/readingHistoryPoints', data=data, headers=headers)
        
#         points_soup = BeautifulSoup(points.content, 'html.parser')
#         all = points_soup.find_all('div', class_='datagrid-col datagrid-col-inovice-filter-points-addres')
#         for point in all:
#             a = point.find('span')
#             print(a.text)

# get_enea(2, 13) # nieistniejące konto
# get_enea(2, 10) # zły login





def login_to_aquanet(account, session):
    payload = {
        'user-login-email[email]': account.login,
        'user-login-email[password]': account.password,
        'user-login-email[submit]':	"Zaloguj"
        }
    
    login_page = session.get(AQUANET_LOGIN_URL, verify=False)
    login_soup = BeautifulSoup(login_page._content, 'html.parser')
    token = login_soup.find('input', type='hidden')['value']

    payload['csrfp_token'] = token
    cookies = session.cookies.items()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
        'Referer': AQUANET_LOGIN_URL,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://ebok.aquanet.pl',
        'Connection': 'keep-alive',
        'Cookie': f'{cookies[0][0]}={cookies[0][1]}; {cookies[1][0]}={cookies[1][1]}; cookielaw=true',
    }

    session.headers.update(headers)
    session.post(AQUANET_LOGIN_URL, data=payload)


def get_aquanet_invoices(session):
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

    # Find all unpaid invoices
    paid_invoices = []
    # Number of table pages
    table_pages = soup.find('li', class_='last').find('a')
    table_pages = table_pages['href'].lstrip('?page=')
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

    return [*paid_invoices, *unpaid_invoices]


def create_aquanet_invoice_objects(invoices: list, user: object, account: object) -> list:
    invoice_objects = []
    for invoice in invoices:
        if len(invoice) > 1:
            date_pattern = re.compile(r'(\d{2}\.\d{2}\.\d{4}|\d{2}/\d{2}/\d{4})')

            dates = date_pattern.findall(invoice[2])
            if len(dates) == 2:
                start_date = dates[0].replace('/', '.')
                end_date = dates[1].replace('/', '.')

            number = invoice[1]
            date = invoice[3]
            pay_deadline = invoice[4]
            amount = invoice[5].rstrip(' zł')
            to_pay = float(invoice[6].rstrip(' zł').replace(',', '.')) if len(invoice) >= 7 else 0

            invoice_objects.append(Invoice(
                                    number=number,
                                    date=datetime.strptime(date, "%d.%m.%Y"),
                                    amount=float(amount.replace(',', '.')),
                                    pay_deadline=datetime.strptime(pay_deadline, "%d.%m.%Y"),
                                    start_date=datetime.strptime(start_date, "%d.%m.%Y") or '',
                                    end_date=datetime.strptime(end_date, "%d.%m.%Y") or '',
                                    amount_to_pay=to_pay,
                                    user=user,
                                    is_paid=len(invoice) == 6,
                                    consumption_point='Brak informacji',
                                    account=account,
                                    category=account.category
                                    ))
            
    return invoice_objects



def get_aquanet(user_pk: int, account_pk: int):
    try:
        user = NewUser.objects.get(pk=user_pk)
        account = Account.objects.get(pk=account_pk)

        with requests.Session() as s:

            login_to_aquanet(account, s)
            invoices = get_aquanet_invoices(s)

        invoice_objects = create_aquanet_invoice_objects(invoices, user, account)

        logger.info("Successfully fetched data from Aquanet")

        Invoice.objects.bulk_create(
            [invoice for invoice
                in invoice_objects
                if not Invoice.objects.filter(number=invoice.number).exists()
            ],
        )
        logger.info("Succesfully saved new data in Database")

        update_invoices_in_db(invoice_objects, user, 'aquanet')

    except Timeout as e:
        logger.debug("Timeout: %s", e)
    except ConnectionError as e:
        logger.debug("ConnectionError: %s", e)
    except RequestException as e:
        logger.debug("RequestException: %s", e)
    except Exception as e:
        logger.debug("An unexpected error occurred: %s", e, stack_info=True, stacklevel=True)



get_aquanet(2, 11)
# get_aquanet(2, 15)

def fetch_data(user_pk, account_pk, login_func, get_invoices_func, create_invoice_func, supplier):
    try:
        user = NewUser.objects.get(pk=user_pk)
        account = Account.objects.get(pk=account_pk)

        logger.info(f"Starting to fetch data from {supplier} for user {user.user_name}")

        with requests.Session() as s:
            login_func(account, s)
            invoices = get_invoices_func(s)
            invoice_objects = create_invoice_func(invoices, user, account)

        Invoice.objects.bulk_create(
            [invoice for invoice
                in invoice_objects
                if not Invoice.objects.filter(number=invoice.number).exists()
            ],
        )

        update_invoices_in_db(invoice_objects, user, supplier)

        logger.info(f"Finished fetching data from {supplier} for user {user.user_name}")

    except requests.exceptions.Timeout as e:
        logger.debug(f"Timeout: {e}")
    except requests.exceptions.ConnectionError as e:
        logger.debug(f"ConnectionError: {e}")
    except requests.exceptions.RequestException as e:
        logger.debug(f"RequestException: {e}")
    except Exception as e:
        logger.debug(f"An unexpected error occurred: {e}")
