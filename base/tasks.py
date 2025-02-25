from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.db import connection
from .models import Account
import logging
from random import randint
from importlib import import_module
import os
from django.core.mail import send_mail
from .services.fake_data import generate_fake_data

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
            if account.notification:
                logger.error(f"Pominięto pobieranie danych dla konta {account.supplier.name} dla użytkownika {account.user.username}. {account.notification}")
            else:
                SupplierClass = fetch_data_classes.get(account.supplier.name)
                try:
                    obj = SupplierClass(account.user.id, account.pk)
                    obj.sync_data()
                    account.save()
                except ValueError as e:
                    account.notification = str(e)
                    account.save(update_fields=['notification'])
                    logger.error(f"Wystąpił błąd przy pobieraniu danych dla konta {account.supplier.name} dla użytkownika {account.user.username}. {e}")
                except Exception as e:
                    logger.error(f"Wystąpił błąd podczas synchronizacji danych: {e}")
        return "Database synchronized"
    
# synchronize_data.delay()

@shared_task
def send_email_notification(to_email, subject, message):
    """
    Task to send an email with notification aboout new invoice to the user.
    """
    logger.info(f"[EMAIL] Sending email to {to_email}")

    code = send_mail(subject, message, 'brzoza3102gmail.com', [to_email], fail_silently=False)

    logger.info(f"[EMAIL] Email sent to {to_email} with code {code}")


@shared_task
def generate_fake_data_task(user_pk, amount):
    logger.info(f"[FAKE DATA] Generating fake data for user {user_pk} with amount {amount}")
    generate_fake_data(user_pk, amount)
    logger.info(f"[FAKE DATA] Fake data generated for user {user_pk} with amount {amount}")

# synchronize_data(1)