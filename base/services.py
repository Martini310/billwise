import json
from bs4 import BeautifulSoup
from .models import Invoice, Supplier, User
import requests
import urllib3
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# from dotenv import load_dotenv
# from pathlib import Path
# import os
#
# dotenv_path = Path('../.env')
# load_dotenv(dotenv_path=dotenv_path)
#
# PGNIG_LOGIN = os.getenv('PGNIG_LOGIN')
# PGNIG_PASSWORD = os.getenv('PGNIG_PASSWORD')

# import socket
# from urllib3.connection import HTTPConnection
#
# HTTPConnection.default_socket_options = (
#         HTTPConnection.default_socket_options + [
#     (socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1),
#     (socket.SOL_TCP, socket.TCP_KEEPIDLE, 45),
#     (socket.SOL_TCP, socket.TCP_KEEPINTVL, 10),
#     (socket.SOL_TCP, socket.TCP_KEEPCNT, 6)
# ]
# )


def get_pgnig(pk, login=None, password=None):
    token_post = requests.post(url="https://ebok.pgnig.pl/auth/login",
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
                               verify=False
                               )

    response_json = token_post.json()
    token = response_json.get('Token')

    print(token)
    get_invoices = requests.get(url='https://ebok.pgnig.pl/crm/get-invoices-v2',
                                params={'pageNumber': 1,
                                        'api-version': 3.0,
                                        'pageSize': 30,
                                        },
                                headers={'AuthToken': token},
                                verify=False
                                )

    invoices_json = get_invoices.json()
    print(invoices_json)
    last_invoice = invoices_json['InvoicesList'][0]
    print(last_invoice)
    print(type(invoices_json))
    faktury = invoices_json['InvoicesList']

    sup = Supplier.objects.get(pk=2)
    us = User.objects.get(pk=pk)

    Invoice.objects.bulk_create([Invoice(number=invoice.get('Number'),
                                         date=invoice.get('Date')[:10],
                                         amount=invoice.get('GrossAmount'),
                                         pay_deadline=invoice.get('PayingDeadlineDate')[:10],
                                         start_date=invoice.get('StartDate')[:10],
                                         end_date=invoice.get('EndDate')[:10],
                                         amount_to_pay=invoice.get('AmountToPay'),
                                         wear=invoice.get('WearKWH'),
                                         supplier=sup,
                                         user=us,
                                         is_paid=invoice.get('IsPaid'),
                                         consumption_point='test')
                                 for invoice in faktury if
                                 not Invoice.objects.filter(number=invoice.get('Number')).exists()])


def get_enea(pk, login=None, password=None):
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
        # print the html returned or something more intelligent to see if it's a successful login page.
        print(p.status_code)
        # An authorised request.
        page = s.get('https://ebok.enea.pl/invoices/invoice-history')
        soup = BeautifulSoup(page.content, 'html.parser')

        # Find username and account number.
        user = soup.find('span', class_='navbar-user-info-name')
        # print(user.text.strip())

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

            supplier = Supplier.objects.get(pk=3)
            user = User.objects.get(pk=pk)

            all_invoices.append(Invoice(number=name.text.strip(),
                                        date=datetime.strptime(date.text.strip(), "%d.%m.%Y"),
                                        amount=float(value.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                                        pay_deadline=datetime.strptime(payment_date.text.strip(), "%d.%m.%Y"),
                                        start_date=None,
                                        end_date=None,
                                        amount_to_pay=float(payment.text.strip().rstrip('\xa0 zł').replace(',', '.')),
                                        wear=None,
                                        supplier=supplier,
                                        user=user,
                                        is_paid=True if 'Zapłacona' in status.text.strip() else False,
                                        consumption_point='test'))

        Invoice.objects.bulk_create(
            [invoice for invoice in all_invoices if not Invoice.objects.filter(number=invoice.number).exists()]
        )

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
