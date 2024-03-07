from abc import ABC, abstractmethod
from ..models import Invoice, Account
from users.models import NewUser
from .decorators import logger, supplier_log
import requests
from requests.exceptions import Timeout, RequestException, ConnectionError
from datetime import datetime
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


class SyncPGNIG(FetchSupplier, SyncSupplier):
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
                data={
                    'identificator': self.account.login,
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
        except ValueError as exc:
            logger.error(f"[PGNIG] Value error occurred during login: {exc}")
            self.account.notification = str(exc)
            self.account.save(update_fields=['notification'])
            raise  # Re-raise the ValueError to propagate it up the call stack

    @supplier_log('PGNIG')
    def get_addresses(self, session):
        try:
            get_entry_points = session.get('https://ebok.pgnig.pl/crm/get-ppg-list?api-version=3.0')
            ppg_list = get_entry_points.json().get('PpgList')
            addresses = dict()
            for ppg in ppg_list:
                ppg_number = ppg.get('IdLocal')
                address = ppg.get('Address')
                addresses[ppg_number] = f"{address.get('Ulica')} {address.get('NrBudynku')}{'/' + address.get('NrLokalu')}, {address.get('KodPocztowy')} {address.get('Miejscowosc')}"
            return addresses
        except (RequestException, ValueError) as e:
            logger.error(f"Error occurred while fetching addresses: {e}")
            raise  # Re-raise the exception to propagate it up the call stack


    @supplier_log('PGNIG')
    def get_invoices(self, session):
        # GET invoices - amount declared in 'pageSize'
        try:
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
        except (RequestException, ValueError) as e:
            logger.error(f"Error occurred while fetching invoices: {e}")
            raise  # Re-raise the exception to propagate it up the call stack


    @supplier_log('PGNIG')
    def parse_invoices(self, invoices):
        parsed_invoices = []
        for invoice in invoices.get('invoices'):
            try:
                parsed_invoice = {
                    'number':             invoice.get('Number'),
                    'date':               self.parse_datetime(invoice.get('Date')),
                    'amount':             invoice.get('GrossAmount'),
                    'pay_deadline':       self.parse_datetime(invoice.get('PayingDeadlineDate')),
                    'start_date':         self.parse_datetime(invoice.get('StartDate')),
                    'end_date':           self.parse_datetime(invoice.get('EndDate')),
                    'amount_to_pay':      invoice.get('AmountToPay'),
                    'wear':               invoice.get('WearKWH'),
                    'user':               self.user,
                    'is_paid':            invoice.get('IsPaid'),
                    'consumption_point':  invoices.get('addresses').get(invoice.get('IdPP')),
                    'account':            self.account,
                    'category':           self.account.category,
                    'bank_account_number':invoice.get('Iban'),
                    'transfer_title':     invoice.get('Number')
                }
                parsed_invoices.append(parsed_invoice)
            except ValueError as e:
                logger.error(f"Error parsing invoice: {e}")
                continue  # Skip this invoice and proceed to the next one

        return parsed_invoices
    
    
    def parse_datetime(self, datetime_str):
        """
        Parse datetime string into datetime object.
        
        Args:
            datetime_str (str): Datetime string to parse.
            
        Returns:
            datetime: Parsed datetime object.
            
        Raises:
            ValueError: If the datetime string is invalid or in an unexpected format.
        """
        try:
            return datetime.fromisoformat(datetime_str[:-1])
        except ValueError as e:
            raise ValueError(f"Error parsing datetime: {e}") from e
