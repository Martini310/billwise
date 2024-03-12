"""
Module to create fake data and save it to given user
"""
from ..models import *
from users.models import NewUser
import random
import datetime
import string

accounts = Account.objects.all()
suppliers = Supplier.objects.all()
categories = Category.objects.all()


def random_date(start, end):
    """Generate a random datetime between `start` and `end`"""
    return start + datetime.timedelta(
        # Get a random amount of seconds between `start` and `end`
        seconds=random.randint(0, int((end - start).total_seconds())),
    )

def random_invoice_number():
    number = ''
    for _ in range(3):
        for _ in range(4):
            number += random.choice(string.ascii_letters)
        number += '/'
    return number[:-1]

def random_account_number():
    acc = ''
    for _ in range(26):
        acc += str(random.randint(0, 9))
    return acc

def generate_fake_data(user_id, amount):
    user = NewUser.objects.get(id=user_id)
    invoices = []
    start_date = datetime.datetime(2020,1,1)
    end_date = datetime.datetime(2024,2,20)

    for _ in range(amount):
        amount = round(random.random() * 100, 2)
        number = random_invoice_number()
        date = random_date(start_date, end_date)

        invoice = Invoice(
            number = number,
            date = date,
            amount = amount,
            pay_deadline = date + datetime.timedelta(14),
            start_date = date - datetime.timedelta(14),
            end_date = date - datetime.timedelta(7),
            amount_to_pay = amount,
            wear = random.randint(0, 500),
            user = user,
            is_paid = True,
            account = random.choice(accounts),
            category = random.choice(categories),
            bank_account_number = random_account_number(),
            transfer_title = f"faktura number {number} z dnia {str(date.date())}",
        )
        invoices.append(invoice)

    Invoice.objects.bulk_create(invoices)
    return invoices
        
