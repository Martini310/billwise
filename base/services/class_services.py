from abc import ABC, abstractmethod
from ..models import Invoice, Account
from users.models import NewUser
from .decorators import logger, supplier_log
import requests
from requests.exceptions import Timeout, RequestException, ConnectionError
import time


class FetchSupplier(ABC):
    """
    Abstract base class representing a supplier from which data can be fetched.
    """
    def __init__(self, user_pk: int, account_pk: int):
        """
        Initialize a FetchSupplier instance with the specified user and account.

        Args:
            user_pk (int): The primary key of the user associated with the supplier's data.
            account_pk (int): The primary key of the account associated with the supplier's data.
        """
        try:
            self.user = NewUser.objects.get(pk=user_pk)
            self.account = Account.objects.get(pk=account_pk)
        except NewUser.DoesNotExist:
            logger.debug(f"User with pk {self.user.pk} does not exist")
        except Account.DoesNotExist:
            logger.debug(f"Account with pk {self.account.pk} does not exist")

    @abstractmethod
    def login(self, session):
        """
        Abstract method to authenticate and log in to the supplier's system.

        Args:
            session: The requests Session object to be used for making HTTP requests.

        Returns:
            None
        """
        pass

    @abstractmethod
    def get_invoices(self, session):
        """
        Abstract method to retrieve invoices data from the supplier's system.

        Args:
            session: The requests Session object to be used for making HTTP requests.

        Returns:
            dict: A dictionary containing the retrieved invoices data.
        """
        pass

    @abstractmethod
    def parse_invoices(self, invoices):
        """
        Abstract method to parse invoices data retrieved from the supplier's system.

        Args:
            invoices (dict): A dictionary containing the invoices data retrieved from the supplier's system.

        Returns:
            list: A list of dictionaries, with each dictionary representing the parsed invoice data.
        """
        pass


class SyncSupplier(ABC):

    def create_invoice_objects(self, invoices):
        """
        Create and return a list of Invoice objects from a dictionary containing invoice data.

        Args:
            invoices (list): A list of dictionaries, where each dictionary represents the data for one invoice.

        Returns:
            list: A list of Invoice objects.
        """
        invoice_objects = []
        account_fields = [field.name for field in Invoice._meta.get_fields() if field.name not in ['id']]
        for invoice in invoices:
            kwargs = {key: invoice.get(key) for key in account_fields}
            obj = Invoice(**kwargs)
            invoice_objects.append(obj)
            
        return invoice_objects
    
    def update_invoices(self, invoices):
        """
        Update existing invoices in the database if their status or amount has changed.

        Args:
            invoices (list): A list of Invoice objects containing updated information.

        Returns:
            None
        """
        for invoice in invoices:
            db = Invoice.objects.filter(number=invoice.number, user=self.user).get()
            if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
                logger.info(f'{self.user.username} - {self.account.supplier.name}] - {invoice.number} - Updating')
                Invoice.objects.filter(number=invoice.number, user=self.user).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)

    def sync_data(self, max_retries=3, retry_delay=5):
        """
        Synchronizes data from the supplier's system to the local database for a specific user and account.

        This method orchestrates the data synchronization process, including logging in to the supplier's system, retrieving invoices,
        parsing invoice data, creating invoice objects, and updating existing invoices in the local database.
        
        Args:
            max_retries (int): The maximum number of retry attempts before giving up.
            retry_delay (int): The delay in seconds between retry attempts.

        Returns:
            None
        """
        while attempt <= max_retries:
            try:
                logger.info(f"[{self.account.supplier.name.upper()}] Starting fetching data for user {self.user.username}")

                # Start a session with the supplier's system
                with requests.Session() as s:
                    # Login to the supplier's system
                    self.login(s)

                    # Retrieve invoices from the supplier's system
                    invoices_data = self.get_invoices(s)

                    # Parse the retrieved invoice data
                    parsed_invoices = self.parse_invoices(invoices_data)

                    # Create invoice objects from the parsed data and bulk insert into the database
                    invoice_objects = self.create_invoice_objects(parsed_invoices)
                    Invoice.objects.bulk_create([invoice for invoice in invoice_objects if not Invoice.objects.filter(number=invoice.number, user=self.user.pk).exists()])

                    # Update existing invoices in the database if necessary
                    self.update_invoices(invoice_objects)

                logger.info(f"[{self.account.supplier.name.upper()}] Finished fetching data for user {self.user.username}")

                attempt = 1
                # Exit the loop if synchronization is successful
                return

            except (Timeout, ConnectionError, RequestException) as e:
                logger.debug(f"Attempt {attempt} failed: {e}")
                if attempt < max_retries:
                    logger.debug(f"Retrying data synchronization in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    attempt += 1
                else:
                    logger.error(f"All retry attempts exhausted. Unable to synchronize data: {e}")
                    raise  # Re-raise the exception if all retry attempts fail

            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
                raise  # Re-raise the exception if it's not a network-related error

