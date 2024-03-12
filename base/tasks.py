from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.db import connection
from .models import Account
import logging
from random import randint
from importlib import import_module
import os

logger = logging.getLogger(__name__)

fetch_data_classes = {}

# Create a dictionary with SyncSupplier classes assigned to supplier name
for file_name in os.listdir('base/services/suppliers'):
    if file_name.endswith('.py') and file_name != '__init__.py':
        module_name = file_name[:-3]
        module = import_module(f'base.services.suppliers.{module_name}')
        for attr_name in module.__all__:
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and hasattr(attr, 'supplier_name'):
                fetch_data_classes[attr.supplier_name] = attr


@shared_task
def add(x=randint(1, 100), y=randint(1,100)):
    logger.info(f'Executing add task with arguments x={x} and y={y}')
    result = x + y
    logger.info(f'The result of {x} + {y} is {result}')
    return x + y


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
    
# synchronize_data.delay()
