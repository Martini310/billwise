import pytest
from rest_framework.test import APIClient
from users.models import NewUser
from base.models import Invoice, Category, Supplier, Account

invoice_payload = {
    'number': 'test/123',
    'date': '2023-10-12',
    'amount': 123,
    'pay_deadline': '2023-10-22',
    'start_date': '2023-10-02',
    'end_date': '2023-10-08',
    'amount_to_pay': 123,
    'wear': 100,
    'is_paid': False,
    'consumption_point': 'Test point',
    'category': 1,
    'bank_account_number': '12 1234 5678 9012 3456 7890 1234',
    'transfer_title': 'test title',
}

account_payload = {
    'supplier': 1,
    'login': 'test login',
    'password': 'test password',
    'category': 1,
}

@pytest.fixture
def user():
    payload = {
        "first_name": "testname",
        "username": "testuser",
        "email": "user@test.pl",
        "password": "userpassword"
    }
    user_instance = NewUser.objects.create_user(**payload)
    return user_instance


@pytest.fixture
def user2():
    payload = {
        "first_name": "testname2",
        "username": "testuser2",
        "email": "user@test.pl2",
        "password": "userpassword2"
    }
    user_instance = NewUser.objects.create_user(**payload)
    return user_instance


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client(user, client):
    response = client.post('/api/token/', dict(email='user@test.pl', password='userpassword'))
    access_token = response.data.get('access', '')

    client.credentials(HTTP_AUTHORIZATION=f'JWT {access_token}')
    return client


@pytest.fixture
def auth_client2(user2, client):
    response = client.post('/api/token/', dict(email='user@test.pl2', password='userpassword2'))
    access_token = response.data.get('access', '')

    client.credentials(HTTP_AUTHORIZATION=f'JWT {access_token}')
    return client


@pytest.fixture
def account(user):
    category = Category.objects.get(pk=1)
    supplier = Supplier.objects.get(pk=1)
    payload = {
        'supplier': supplier,
        'login': 'test login',
        'password': 'test password',
        'user': user,
        'category': category,
    }
    account_instance = Account.objects.create(**payload)
    return account_instance


@pytest.fixture
def account2(user2):
    category = Category.objects.get(pk=1)
    supplier = Supplier.objects.get(pk=1)

    payload = {
        'supplier': supplier,
        'login': 'test login2',
        'password': 'test password2',
        'user': user2,
        'category': category,
    }
    account_instance = Account.objects.create(**payload)
    return account_instance


@pytest.fixture
def invoice(user):
    category = Category.objects.get(pk=1)
    payload = {
        'number': 'test/123',
        'date': '2023-05-12',
        'amount': 123,
        'pay_deadline': '2023-05-22',
        'start_date': '2023-05-02',
        'end_date': '2023-05-10',
        'amount_to_pay': 123,
        'wear': 100,
        'user': user,
        'is_paid': False,
        'consumption_point': 'Test point',
        'account': None, 
        'category': category,
        'bank_account_number': '12 1234 5678 9012 3456 7890 1234',
        'transfer_title': 'test title',
    }
    invoice_instance = Invoice.objects.create(**payload)
    return invoice_instance


@pytest.fixture
def invoice2(user2):
    category = Category.objects.get(pk=1)
    payload = {
        'number': 'test/user2',
        'date': '2023-06-01',
        'amount': 999,
        'pay_deadline': '2023-06-11',
        'amount_to_pay': 999,
        'user': user2,
        'is_paid': False,
        'category': category,
    }
    invoice_instance = Invoice.objects.create(**payload)
    return invoice_instance
