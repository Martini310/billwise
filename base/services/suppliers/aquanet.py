from datetime import datetime
from bs4 import BeautifulSoup
import re
import urllib3
from ..decorators import supplier_log, logger
from ..class_services import FetchSupplier, SyncSupplier


__all__ = ['SyncAquanet']
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class SyncAquanet(FetchSupplier, SyncSupplier):
    
    supplier_name = 'Aquanet'
    # AQUANET_LOGIN_URL = 'https://ebok.aquanet.pl/user/login'
    AQUANET_LOGIN_URL = 'https://ebok.aquanet.pl/api/login'
    
    @supplier_log(supplier_name)
    def login(self, session):
        payload = {
            'email': self.account.login,
            'password': self.account.password,
        }
        login_respone = session.post('https://ebok.aquanet.pl/api/login', json=payload, verify=False)
        # Handle Login error
        print(login_respone.json())
        self.balance = login_respone.json().get('user', 0).get('activeBuyer', 0).get('balance', 0)
        if login_respone.json().get('status') == 400:
            error_login_msg = login_respone.json().get('error')
            logger.warning('[AQUANET] error msg: %s', error_login_msg)
            raise ValueError(error_login_msg)
        
        
    @supplier_log(supplier_name)
    def get_invoices(self, session):

        url = 'https://ebok.aquanet.pl/api/graphql'
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
        variables = {   
                        "filter": {
                            "statuses": [],
                            "groupTypes": [],
                            "issuedAtFrom": 'null',
                            "issuedAtTo": 'null',
                            "number": ""
                            },
                        "limit": 0,
                        "offset": 0
                    }
        response = session.post(url, json={'query': query, 'variables': variables})
        data = response.json()
        # print(data)
        return {'invoices': data['data']['invoices']}
    
        ################################################
        ################# OLD API ######################
        ################################################
        # paid_invoices = session.get('https://ebok.aquanet.pl/api/mobile/invoices?search%5Bstatus%5D=paid&limit=0', verify=False)
        # print(paid_invoices)
        # paid_invoices = paid_invoices.json().get('data').get('entries')

        # unpaid_invoices = session.get('https://ebok.aquanet.pl/api/mobile/invoices?search%5Bstatus%5D=unpaid&limit=0', verify=False)
        # unpaid_invoices = unpaid_invoices.json().get('data').get('entries')

        # processing_invoices = session.get('https://ebok.aquanet.pl/api/mobile/invoices?search%5Bstatus%5D=processing&limit=0', verify=False)
        # processing_invoices = processing_invoices.json().get('data').get('entries')

        # account_number = session.get('https://ebok.aquanet.pl/api/mobile/buyers', verify=False)
        # account_number = account_number.json().get('data').get('entries')[0].get('account')

        # return {'invoices': [*paid_invoices, *unpaid_invoices, *processing_invoices], 'bank_account_number': account_number}


    @supplier_log(supplier_name)
    def parse_invoices(self, invoices):
        invoice_objects = []
        for invoice in invoices.get('invoices'):
            invoice_objects.append({
                'number':             invoice['number'],
                'date':               datetime.fromtimestamp(int(invoice['issuedAt'])),
                'amount':             float(invoice['value']),
                'pay_deadline':       datetime.fromtimestamp(int(invoice['paymentDeadlineAt'])),
                'amount_to_pay':      float(self.balance),
                'user':               self.user,
                'is_paid':            invoice['status'] == 'PAID',
                'account':            self.account,
                'category':           self.account.category,
                'bank_account_number':invoices.get('bank_account_number'),
                'transfer_title':     invoice['number'],
                })
                
        return invoice_objects
