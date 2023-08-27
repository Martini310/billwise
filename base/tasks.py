from __future__ import absolute_import, unicode_literals

from celery import shared_task
from django.db import connection
from .models import Account, Supplier

@shared_task
def add(x, y):
    return x + y

@shared_task
def user_data():
    with connection.cursor() as cursor:
        accounts = Account.objects.all()
        suppliers = Supplier.objects.all()
        data = []
        for account in accounts:
            data.append(account.login)
        for supplier in suppliers:
            for account in supplier.accounts.all():
                data.append([account.login, account.password, account.category.name])
        return data