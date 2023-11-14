from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.db import connection
from .models import Account
from .services import get_enea, get_aquanet, get_pgnig


fetch_data_functions = {'Enea': get_enea, 'PGNiG': get_pgnig, 'Aquanet': get_aquanet}

@shared_task
def add(x, y):
    return x + y

@shared_task
def sync_accounts_task(user_pk):
    with connection.cursor() as cursor:
        accounts = Account.objects.filter(user__pk=user_pk)
        for account in accounts:
            fetch = fetch_data_functions.get(account.supplier.name)
            fetch(user_pk, account.pk)
            account.save()
        return "User data synchronized"
        # return sync_accounts(user_pk)

@shared_task
def scheduled_get_data():
    with connection.cursor() as cursor:
        accounts = Account.objects.all()
        for account in accounts:
            fetch_data = fetch_data_functions.get(account.supplier.name)
            fetch_data(account.user.id, account.pk)
            account.save()
        return "Database synchronized"
    