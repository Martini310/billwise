from datetime import datetime
import urllib3
from requests.exceptions import RequestException
from ..decorators import supplier_log, logger
from ..class_services import SyncSupplier, FetchSupplier

__all__ = ['SyncPGNIG']
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class SyncPGNIG(FetchSupplier, SyncSupplier):
    supplier_name = 'PGNiG'
    # PGNiG eBOK was migrated to the ORLEN platform; the old ebok.pgnig.pl API now
    # lives under ebok.myorlen.pl with the same request/response shape.
    PGNIG_BASE_URL = "https://ebok.myorlen.pl"
    PGNIG_LOGIN_URL = f"{PGNIG_BASE_URL}/auth/login"
    PGNIG_INVOICES_URL = f"{PGNIG_BASE_URL}/crm/get-invoices-v2"
    PGNIG_PPG_LIST_URL = f"{PGNIG_BASE_URL}/crm/get-ppg-list"
    PGNIG_API_VERSION = "3.0"
    # A browser-like User-Agent is required: the WAF rejects the default
    # python-requests agent with 403 before the request ever reaches the API.
    PGNIG_HEADERS = {'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                                   'AppleWebKit/537.36 (KHTML, like Gecko) '
                                   'Chrome/131.0 Safari/537.36'),
                    'Origin': PGNIG_BASE_URL,
                    'Referer': f'{PGNIG_BASE_URL}/',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    }

    @supplier_log(supplier_name)
    def login(self, session):
        try:
            # Carry the browser User-Agent on every request in this session, not
            # just the login POST, or the WAF rejects the invoice/address GETs.
            session.headers.update({'User-Agent': self.PGNIG_HEADERS['User-Agent']})
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
                timeout=30,
            )

            response.raise_for_status()
            data = response.json()
            token = data.get('Token')
            if not token:
                message = data.get('EndUserMessage') or data.get('Message') or 'Nie można się zalogować przy użyciu podanych danych'
                raise ValueError(message)
            logger.info("[PGNIG] Fetched token")
            session.headers.update({'AuthToken': token})

        except RequestException as exc:
            logger.warning(f"[PGNIG] Request exception occurred: {exc}")
            raise ValueError('Nie można się zalogować przy użyciu podanych danych') from exc
        except Exception as exc:
            logger.warning(f"[PGNIG] W trakcie logowanie wystąpił nieoczekiwany błąd: {exc}")
            raise

    @supplier_log(supplier_name)
    def get_addresses(self, session):
        try:
            get_entry_points = session.get(self.PGNIG_PPG_LIST_URL, params={'api-version': self.PGNIG_API_VERSION})
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


    @supplier_log(supplier_name)
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


    @supplier_log(supplier_name)
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
