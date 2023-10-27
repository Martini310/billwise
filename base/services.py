from datetime import datetime
import requests
import urllib3
from bs4 import BeautifulSoup
from users.models import NewUser
from .models import Account, Invoice

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


def get_enea(pk, login=None, password=None, account_pk=None):
    # Fill in your details here to be posted to the login form.
    payload = {
        'email': login,
        'password': password,
    }

    # Use 'with' to ensure the session context is closed after use.
    with requests.Session() as s:
        # Get the login page to get a hidden token.
        login_page = s.get('https://ebok.enea.pl/logowanie', verify=False)
        signin = BeautifulSoup(login_page._content, 'html.parser')

        # Add token to the payload.
        payload['token'] = signin.find('input', type='hidden')['value']

        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Host': 'ebok.enea.pl',
            'Origin': 'https://ebok.enea.pl',
            'Referer': 'https://ebok.enea.pl/',
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        # LOG IN
        p = s.post('https://ebok.enea.pl/logowanie', data=payload, headers=headers)
        print(p.status_code)
        # An authorised request.
        page = s.get('https://ebok.enea.pl/invoices/invoice-history')
        print(page.status_code)
        soup = BeautifulSoup(page.content, 'html.parser')

        # Find username and account number.
        user = soup.find('span', class_='navbar-user-info-name')

        # Find div with all invoices.
        invoices = soup.find_all('div', class_='datagrid-row-content')

        all_invoices = []
        for invoice in invoices:
            date = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-date')
            name = invoice.find('span', class_='font-semibold document-download-link link-dark-blue')
            address = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-address')
            payment_date = invoice.find('div',class_='datagrid-col datagrid-col-invoice-real-with-address-payment-date')
            value = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-value')
            payment = invoice.find('div', class_='datagrid-col datagrid-col-invoice-real-with-address-payment')
            status = invoice.find('div', class_='datagrid-col datagrid-col-invoice-with-address-status')
            user = NewUser.objects.get(pk=pk)
            account = Account.objects.get(pk=account_pk)

            all_invoices.append(Invoice(number=name.text.strip(),
                                        date=datetime.strptime(date.text.strip(), "%d.%m.%Y"),
                                        amount=float(value.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                                        pay_deadline=datetime.strptime(payment_date.text.strip().split()[0], "%d.%m.%Y"),
                                        start_date=None,
                                        end_date=None,
                                        amount_to_pay=float(payment.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                                        wear=None,
                                        user=user,
                                        is_paid=True if 'Zapłacona' in status.text.strip() else False,
                                        consumption_point='test',
                                        account=account,
                                        category=account.category))

                
        Invoice.objects.bulk_create(
            [invoice for invoice in all_invoices if not Invoice.objects.filter(number=invoice.number).exists()],
        )

        for invoice in all_invoices:
            db = Invoice.objects.filter(number=invoice.number).get()
            if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
                print(f'{invoice.number} - to samo')
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


def get_aquanet(pk, login=None, password=None, account_pk=None):

    payload = {
    'user-login-email[email]': login,
    'user-login-email[password]': password,
    'user-login-email[submit]':	"Zaloguj"
    }

    all_invoices = []

    user = NewUser.objects.get(pk=pk)
    account = Account.objects.get(pk=account_pk)

    with requests.Session() as s:

        res = s.get('https://ebok.aquanet.pl/user/login', verify=False)
        signin = BeautifulSoup(res._content, 'html.parser')
        token = signin.find('input', type='hidden')['value']

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

        response = s.post('https://ebok.aquanet.pl/user/login', headers=headers, data=payload)

        # Get 'https://ebok.aquanet.pl/faktury' to get number of pages in table
        faktury = s.get('https://ebok.aquanet.pl/faktury', headers=headers, verify=False)
        
        soup = BeautifulSoup(faktury.content, 'html.parser')
        # Number of table pages
        pages = soup.find('li', class_='last').find('a')
        pages = pages['href'].lstrip('?page=')

        # Find all unpaid invoices
        tables = soup.find_all('table', class_='table')

        unpaid_table = [table.find_all('tr') for table in tables if table.find('caption').find('h3').text == 'Niezapłacone'][0]

        unpaid_invoices = []
        for row in unpaid_table:
            invoice = [td.text for td in row.find_all('td') if td.text]
            if invoice and invoice[0].strip() != 'Brak danych':
                unpaid_invoices.append(invoice)

        for unpaid in unpaid_invoices:
            date_scope = unpaid[2]
            start_date = ''
            end_date = ''
            if len(date_scope) < 22:
                start_date = date_scope.partition('-')[0]
                end_date = date_scope.partition('-')[2]
            else:
                start_date = date_scope.partition(' do ')[0].lstrip('Za okres od ').replace('/', '.')
                end_date = date_scope.partition(' do ')[2].replace('/', '.')

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
                            wear=None,
                            user=user,
                            is_paid=False,
                            consumption_point='Brak informacji',
                            account=account,
                            category=account.category))

        paid_invoices = []
        # For every page find all rows with invoices and append to list
        for page in range(int(pages) + 1):

            test = {
            "state[_id]": "09534ea9a0668ab4b3f0c011e6c84c11",
            "state[_page]": page,
            "state[_count]": "-1",
            "sort[0][0]": "issuedAt",
            "sort[0][1]": "-1",
            "sort[1][0]": "id",
            "sort[1][1]": "-1"
            }

            invoice_page = s.post('https://ebok.aquanet.pl/such/table/view', headers=headers, data=test, verify=False)

            page_soup = BeautifulSoup(invoice_page.content, 'html.parser')

            for tr in page_soup.find_all('tr')[1:11]:
                paid_invoices.append([td.text for td in tr.find_all('td') if td.text])


        for index, row in enumerate(paid_invoices[:-1:]):
            date_scope = row[2]
            start_date = ''
            end_date = ''
            if len(date_scope) < 22:
                start_date = date_scope.partition('-')[0]
                end_date = date_scope.partition('-')[2]
            else:
                start_date = date_scope.partition(' do ')[0].lstrip('Za okres od ').replace('/', '.')
                end_date = date_scope.partition(' do ')[2].replace('/', '.')

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


        Invoice.objects.bulk_create(
            [invoice for invoice in all_invoices if not Invoice.objects.filter(number=invoice.number).exists()],
        )

        for invoice in all_invoices:
            db = Invoice.objects.filter(number=invoice.number).get()
            if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
                print(f'{invoice.number} - Update')
                Invoice.objects.filter(number=invoice.number).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)

        print(faktury.status_code)

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