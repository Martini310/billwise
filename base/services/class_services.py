from abc import ABC, abstractmethod
from ..models import Invoice, Account
from users.models import NewUser
from decorators import logger
import requests
from requests.exceptions import Timeout, RequestException, ConnectionError

class SyncSupplier(ABC):

    def __init__(self, user_pk, account_pk):
        self.user = NewUser.objects.get(pk=user_pk)
        self.account = Account.objects.get(pk=account_pk)

    @abstractmethod
    def login():
        pass

    @abstractmethod
    def get_invoices():
        pass

    @abstractmethod
    def parse_invoices():
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
                logger.info(f"[{self.account.supplier.upper()}] Starting fetching data for user {self.user.username}")

                with requests.Session() as s:
                    self.login(s)
                    invoices = self.get_invoices(s)
                    invoices_dict = self.create_invoice_objects(invoices)
                    invoice_objects = self.create_invoice_objects(invoices_dict)

                Invoice.objects.bulk_create(
                    [invoice for invoice
                        in invoice_objects
                        if not Invoice.objects.filter(number=invoice.number, user=self.user.pk).exists()
                    ],
                )

                self.update_invoices(invoice_objects)

                logger.info(f"[{self.account.supplier.upper()}] Finished fetching data for user {self.user.username}")

            except NewUser.DoesNotExist:
                logger.debug(f"User with pk {self.user.pk} does not exist")
            except Account.DoesNotExist:
                logger.debug(f"Account with pk {self.account.pk} does not exist")
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

