import json

from .models import Invoice, Supplier, User
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from dotenv import load_dotenv
from pathlib import Path
import os

dotenv_path = Path('../.env')
load_dotenv(dotenv_path=dotenv_path)

PGNIG_LOGIN = os.getenv('PGNIG_LOGIN')
PGNIG_PASSWORD = os.getenv('PGNIG_PASSWORD')


def get_pgnig(login=None, password=None):
    token_post = requests.post(url="https://ebok.pgnig.pl/auth/login",
                               data={'identificator': PGNIG_LOGIN,
                                     'accessPin': PGNIG_PASSWORD,
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
    us = User.objects.get(pk=2)

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
                                 for invoice in faktury if not Invoice.objects.filter(number=invoice.get('Number')).exists()])

