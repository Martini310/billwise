from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.db import connection
from .models import Account
from .services.services import get_enea, get_aquanet, get_pgnig
import logging
from random import randint
from base.services.suppliers.pgnig import SyncPGNIG
from base.services.suppliers.enea import SyncEnea
from base.services.suppliers.aquanet import SyncAquanet

from services.suppliers import *

fetch_data_functions = {'Enea': get_enea, 'PGNiG': get_pgnig, 'Aquanet': get_aquanet}
fetch_data_classes = {'Enea': SyncEnea, 'PGNiG': SyncPGNIG, 'Aquanet': SyncAquanet}

logger = logging.getLogger(__name__)

@shared_task
def add(x=randint(1, 100), y=randint(1,100)):
    logger.info(f'Executing add task with arguments x={x} and y={y}')
    result = x + y
    logger.info(f'The result of {x} + {y} is {result}')
    return x + y

@shared_task
def sync_accounts_task(user_pk):
    with connection.cursor() as cursor:
        accounts = Account.objects.filter(user__pk=user_pk)
        for account in accounts:
            if not account.notification:
                fetch = fetch_data_functions.get(account.supplier.name)
                try:
                    fetch(user_pk, account.pk)
                    account.save()
                except ValueError as e:
                    logger.warning(f"Wystąpił błąd przy pobieraniu danych dla konta {account.supplier.name} dla użytkownika {account.user.username}. {e}")
        return "User data synchronized"

@shared_task
def scheduled_get_data():
    with connection.cursor() as cursor:
        accounts = Account.objects.all()
        for account in accounts:
            if not account.notification:
                fetch_data = fetch_data_functions.get(account.supplier.name)
                try:
                    fetch_data(account.user.id, account.pk)
                    account.save()
                except ValueError as e:
                    logger.warning(f"Wystąpił błąd przy pobieraniu danych dla konta {account.supplier.name} dla użytkownika {account.user.username}. {e}")
        return "Database synchronized"


@shared_task
def synchronize_data(user_pk=None):
    with connection.cursor() as cursor:
        if user_pk:
            accounts = Account.objects.filter(user__pk=user_pk)
        else:
            accounts = Account.objects.all()
            
        for account in accounts:
            if not account.notification:
                SupplierClass = fetch_data_classes.get(account.supplier.name)
                try:
                    obj = SupplierClass(account.user.id, account.pk)
                    obj.sync_data()
                    account.save()
                except ValueError as e:
                    logger.warning(f"Wystąpił błąd przy pobieraniu danych dla konta {account.supplier.name} dla użytkownika {account.user.username}. {e}")
                except Exception as e:
                    logger.error(f"Wystąpił błąd podczas synchronizacji danych: {e}")
        return "Database synchronized"