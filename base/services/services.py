import requests
import urllib3
from users.models import NewUser
from ..models import Account, Invoice
from requests.exceptions import RequestException, Timeout, ConnectionError
from .decorators import logger
from .pgnig import login_to_pgnig, get_pgnig_invoices, parse_pgnig_invoices
from .enea import login_to_enea, get_enea_invoices, parse_enea_invoices
from .aquanet import login_to_aquanet, get_aquanet_invoices, parse_aquanet_invoices


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def update_invoices_in_db(invoices: list, user: object, supplier: str):
    # Update existing invoices if status or amount change
    for invoice in invoices:
        db = Invoice.objects.filter(number=invoice.number, user=user).get()
        if invoice.is_paid != db.is_paid or invoice.amount_to_pay != db.amount_to_pay or invoice.amount != db.amount:
            logger.info(f'[get_{supplier}] {invoice.number} - Updating')
            Invoice.objects.filter(number=invoice.number, user=user).update(is_paid=invoice.is_paid, amount_to_pay=invoice.amount_to_pay, amount=invoice.amount)


def create_invoice_objects(invoices):
    invoice_objects = []
    account_fields = [field.name for field in Invoice._meta.get_fields() if field.name not in ['id']]
    for invoice in invoices:
        kwargs = {key: invoice.get(key) for key in account_fields}
        obj = Invoice(**kwargs)
        invoice_objects.append(obj)
        
    return invoice_objects


def fetch_data(user_pk, account_pk, login_func, get_invoices_func, create_invoice_func, supplier):
    try:
        user = NewUser.objects.get(pk=user_pk)
        account = Account.objects.get(pk=account_pk)

        logger.info(f"[{supplier.upper()}] Starting fetching data for user {user.username}")

        with requests.Session() as s:
            login_func(account, s)
            invoices = get_invoices_func(s)
            invoices_dict = create_invoice_func(invoices, user, account)
            invoice_objects = create_invoice_objects(invoices_dict)
        Invoice.objects.bulk_create(
            [invoice for invoice
                in invoice_objects
                if not Invoice.objects.filter(number=invoice.number, user=user_pk).exists()
            ],
        )
        update_invoices_in_db(invoice_objects, user, supplier)

        logger.info(f"[{supplier.upper()}] Finished fetching data for user {user.username}")

    except NewUser.DoesNotExist:
        logger.debug(f"User with pk {user_pk} does not exist")
    except Account.DoesNotExist:
        logger.debug(f"Account with pk {account_pk} does not exist")
    except Timeout as e:
        logger.debug(f"Timeout: {e}")
    except ConnectionError as e:
        logger.debug(f"ConnectionError: {e}")
    except RequestException as e:
        logger.debug(f"RequestException: {e}")
    except ValueError as e:
        logger.error(str(e))
        account.notification = str(e)
        account.save(update_fields=['notification'])
        raise ValueError(str(e)) from e
    except Exception as e:
        logger.debug(f"An unexpected error occurred: {e}")



def get_aquanet(user_pk: int, account_pk: int):
    fetch_data(user_pk, account_pk, login_to_aquanet, get_aquanet_invoices, parse_aquanet_invoices, 'aquanet')

def get_enea(user_pk: int, account_pk: int):
    fetch_data(user_pk, account_pk, login_to_enea, get_enea_invoices, parse_enea_invoices, 'enea')

def get_pgnig(user_pk: int, account_pk: int):
    fetch_data(user_pk, account_pk, login_to_pgnig, get_pgnig_invoices, parse_pgnig_invoices, 'pgnig')

# get_aquanet(2, 11)
# get_enea(2, 13) # nieistniejące konto
# get_enea(26, 19) # zły login
# get_aquanet(26, 20)
# get_pgnig(7, 14) # zły login SPP
# get_pgnig(2, 9)
# get_pgnig(2, 13)

# from .class_services import SyncPGNIG

# a = SyncPGNIG(2,9)
# a.sync_data()