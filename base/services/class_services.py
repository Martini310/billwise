from abc import ABC, abstractmethod
from ..models import Invoice, Account
from users.models import NewUser
from .decorators import logger, supplier_log
import requests
from requests.exceptions import Timeout, RequestException, ConnectionError
from datetime import datetime


class SyncSupplier(ABC):

    def __init__(self, user_pk: int, account_pk: int):
        try:
            self.user = NewUser.objects.get(pk=user_pk)
            self.account = Account.objects.get(pk=account_pk)
        except NewUser.DoesNotExist:
            logger.debug(f"User with pk {self.user.pk} does not exist")
        except Account.DoesNotExist:
            logger.debug(f"Account with pk {self.account.pk} does not exist")

    @abstractmethod
    def login(self, session):
        pass

    @abstractmethod
    def get_invoices(self, session):
        pass

    @abstractmethod
    def parse_invoices(self, invoices):
        pass

    def create_invoice_objects(self, invoices):
        invoice_objects = []
        account_fields = [field.name for field in Invoice._meta.get_fields() if field.name not in ['id']]
        for invoice in invoices:
            kwargs = {key: invoice.get(key) for key in account_fields}
            obj = Invoice(**kwargs)
            invoice_objects.append(obj)
            
        return invoice_objects
    
    def update_invoices(self, invoices):
        # Update existing invoices if status or amount change
        for invoice in invoices:
            db = Invoice.objects.filter(number=invoice.number, user=self.user).get()
            if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
                logger.info(f'{self.user.username} - {self.account.supplier.name}] - {invoice.number} - Updating')
                Invoice.objects.filter(number=invoice.number, user=self.user).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)

    def sync_data(self):
            try:
                logger.info(f"[{self.account.supplier.name.upper()}] Starting fetching data for user {self.user.username}")

                with requests.Session() as s:
                    self.login(s)
                    invoices = self.get_invoices(s)
                    invoices_dict = self.parse_invoices(invoices)
                    invoice_objects = self.create_invoice_objects(invoices_dict)

                Invoice.objects.bulk_create(
                    [invoice for invoice
                        in invoice_objects
                        if not Invoice.objects.filter(number=invoice.number, user=self.user.pk).exists()
                    ],
                )

                self.update_invoices(invoice_objects)

                logger.info(f"[{self.account.supplier.name.upper()}] Finished fetching data for user {self.user.username}")

            except Timeout as e:
                logger.debug(f"Timeout: {e}")
            except ConnectionError as e:
                logger.debug(f"ConnectionError: {e}")
            except RequestException as e:
                logger.debug(f"RequestException: {e}")
            except ValueError as e:
                logger.error(str(e))
                self.account.notification = str(e)
                self.account.save(update_fields=['notification'])
                raise ValueError(str(e)) from e
            except Exception as e:
                logger.debug(f"An unexpected error occurred: {e}")


class SyncPGNIG(SyncSupplier):
    PGNIG_LOGIN_URL = "https://ebok.pgnig.pl/auth/login"
    PGNIG_INVOICES_URL = "https://ebok.pgnig.pl/crm/get-invoices-v2"
    PGNIG_API_VERSION = "3.0"
    PGNIG_HEADERS = {'Accept': 'application/json',
                     'Accept-Encoding': 'gzip, deflate, br',
                     'Host': 'ebok.pgnig.pl',
                     'Origin': 'https://ebok.pgnig.pl',
                     'Referer': 'https://ebok.pgnig.pl/',
                     'Content-Type': 'application/x-www-form-urlencoded',
                    }

    @supplier_log('PGNIG')
    def login(self, session):
        try:
            response = session.post(
                url=self.PGNIG_LOGIN_URL,
                data={'identificator': self.account.login,
                      'accessPin': self.account.password,
                      'DeviceId': '824e02bc5b8ac6100b807f6fc6184abf',
                      'DeviceType': 'Web'
                     },
                params={'api-version': self.PGNIG_API_VERSION},
                headers=self.PGNIG_HEADERS,
                verify=False,
                timeout=5000,
            )

            response.raise_for_status()
            logger.info("[PGNIG] Fetched token")
            token = response.json().get('Token')
            session.headers.update({'AuthToken': token})
        except RequestException as exc:
            logger.error(f"[PGNIG] Request exception occurred: {exc}")
            raise ValueError('Nie można się zalogować przy użyciu podanych danych') from exc

    @supplier_log('PGNIG')
    def get_addresses(self, session):
        get_entry_points = session.get('https://ebok.pgnig.pl/crm/get-ppg-list?api-version=3.0')
        ppg_list = get_entry_points.json().get('PpgList')
        addresses = dict()
        for ppg in ppg_list:
            ppg_number = ppg.get('IdLocal')
            address = ppg.get('Address')
            addresses[ppg_number] = f"{address.get('Ulica')} {address.get('NrBudynku')}/{address.get('NrLokalu')}, {address.get('KodPocztowy')} {address.get('Miejscowosc')}"
        return addresses


    @supplier_log('PGNIG')
    def get_invoices(self, session):
        # GET invoices on account - amount declared in 'pageSize'
        get_invoices = session.get(
            url=self.PGNIG_INVOICES_URL,
            params={
                'pageNumber': 1,
                'api-version': self.PGNIG_API_VERSION,
                'pageSize': 100,
            }
        )
        invoices = get_invoices.json()['InvoicesList']
        addresses = self.get_addresses(session)
        return {'invoices': invoices, 'addresses': addresses}


    @supplier_log('PGNIG')
    def parse_invoices(self, invoices):
        return [{'number':            invoice.get('Number'),
                'date':               datetime.fromisoformat(invoice.get('Date')[:-1]),
                'amount':             invoice.get('GrossAmount'),
                'pay_deadline':       datetime.fromisoformat(invoice.get('PayingDeadlineDate')[:-1]),
                'start_date':         datetime.fromisoformat(invoice.get('StartDate')[:-1]),
                'end_date':           datetime.fromisoformat(invoice.get('EndDate')[:-1]),
                'amount_to_pay':      invoice.get('AmountToPay'),
                'wear':               invoice.get('WearKWH'),
                'user':               self.user,
                'is_paid':            invoice.get('IsPaid'),
                'consumption_point':  invoices.get('addresses').get(invoice.get('IdPP')),
                'account':            self.account,
                'category':           self.account.category,
                'bank_account_number':invoice.get('Iban'),
                'transfer_title':     invoice.get('Number')}
            for invoice in invoices.get('invoices')]


