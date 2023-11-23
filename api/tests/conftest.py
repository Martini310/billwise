import pytest
from datetime import datetime
from users.models import NewUser
from base.models import Invoice, Category
from rest_framework.test import APIClient

@pytest.fixture
def user():
    payload = {
        "first_name": "testname",
        "username": "testuser",
        "email": "user@test.pl",
        "password": "userpassword"
    }
    user = NewUser.objects.create_user(**payload)
    return user


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
def category():
    category = Category.objects.create(name='test_category')
    return category


@pytest.fixture
def invoice(user, category):
    payload = {
        'number': 'test/123',
        'date': datetime.today(),
        'amount': 123,
        'pay_deadline': datetime.today(),
        'start_date': datetime.today(),
        'end_date': datetime.today(),
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
    invoice = Invoice.objects.create(**payload)
    return invoice