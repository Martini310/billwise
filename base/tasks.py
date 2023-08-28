from __future__ import absolute_import, unicode_literals

from celery import shared_task
from django.db import connection
from .models import Account, Supplier
from .services import get_enea, get_aquanet, get_pgnig

@shared_task
def add(x, y):
    return x + y

@shared_task
def scheduled_get_enea():
    with connection.cursor() as cursor:
        accounts = Account.objects.all()
        suppliers = Supplier.objects.all()
        data = []
        for account in accounts:
            data.append(account.login)
        for supplier in suppliers:
            if supplier.name == 'Enea':
                for account in supplier.accounts.all():
                    get_enea(account.user.id, account.login, account.password, account.pk)
                    data.append([account.login, account.password, account.category.name])
        return data
    
@shared_task
def scheduled_get_pgnig():
    with connection.cursor() as cursor:
        accounts = Account.objects.all()
        suppliers = Supplier.objects.all()
        data = []
        for account in accounts:
            data.append(account.login)
        for supplier in suppliers:
            if supplier.name == 'PGNiG':
                for account in supplier.accounts.all():
                    get_pgnig(account.user.id, account.login, account.password, account.pk)
                    data.append([account.login, account.password, account.category.name])
        return data
    
@shared_task
def scheduled_get_aquanet():
    with connection.cursor() as cursor:
        accounts = Account.objects.all()
        suppliers = Supplier.objects.all()
        data = []
        for account in accounts:
            data.append(account.login)
        for supplier in suppliers:
            if supplier.name == 'Aquanet':
                for account in supplier.accounts.all():
                    get_aquanet(account.user.id, account.login, account.password, account.pk)
                    data.append([account.login, account.password, account.category.name])
        return data
    