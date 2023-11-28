import pytest
from datetime import datetime
from rest_framework import status
from rest_framework.exceptions import ErrorDetail

from users.models import NewUser

payload = {
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

############  GET  ################
@pytest.mark.django_db
def test_get_invoice(invoice, category, auth_client):
    response = auth_client.get('/api/invoices/1/')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['number'] == 'test/123'
    assert response.data['date'] == datetime.today().date().strftime("%Y-%m-%d")
    assert response.data['amount'] == 123
    assert response.data['pay_deadline']== datetime.today().date().strftime("%Y-%m-%d")
    assert response.data['start_date'] == datetime.today().date().strftime("%Y-%m-%d")
    assert response.data['end_date'] == datetime.today().date().strftime("%Y-%m-%d")
    assert response.data['amount_to_pay'] == 123
    assert response.data['wear'] == 100
    assert not response.data['is_paid']
    assert response.data['consumption_point'] == 'Test point'
    assert response.data['account'] is None
    assert response.data['category']['id'] == category.id
    assert response.data['category']['name'] == category.name
    assert response.data['bank_account_number'] == '12 1234 5678 9012 3456 7890 1234'
    assert response.data['transfer_title'] == 'test title'


@pytest.mark.django_db
def test_not_user_get_invoice_fail(client, invoice):
    response = client.get('/api/invoices/1/', follow=True)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."


@pytest.mark.django_db
def test_user_get_another_user_invoice_fail(auth_client2, invoice):
    response = auth_client2.get('/api/invoices/1/', follow=True)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data['detail'] == "You are not allowed to see this content"


################# POST ######################
@pytest.mark.django_db
def test_user_creates_new_invoice(auth_client, category):

    response = auth_client.post('/api/invoices/', payload)
    assert response.status_code == status.HTTP_201_CREATED

    get_response = auth_client.get('/api/invoices/1/')
    assert get_response.data['number'] == 'test/123'
    assert get_response.data['date'] == '2023-10-12'
    assert get_response.data['amount'] == 123
    assert get_response.data['pay_deadline']== '2023-10-22'
    assert get_response.data['start_date'] == '2023-10-02'
    assert get_response.data['end_date'] == '2023-10-08'
    assert get_response.data['amount_to_pay'] == 123
    assert get_response.data['wear'] == 100
    assert not get_response.data['is_paid']
    assert get_response.data['consumption_point'] == 'Test point'
    assert get_response.data['account'] is None
    assert get_response.data['category']['id'] == 1
    assert get_response.data['category']['name'] == 'Gaz'
    assert get_response.data['bank_account_number'] == '12 1234 5678 9012 3456 7890 1234'
    assert get_response.data['transfer_title'] == 'test title'

    all_invoices = auth_client.get('/api/invoices/')
    assert len(all_invoices.data) == 1


@pytest.mark.django_db
def test_not_user_creates_new_invoice_fail(client, category):

    response = client.post('/api/invoices/', payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'


@pytest.mark.django_db
def test_user_creates_new_invoice_for_another_user_fail(auth_client, user2, category):
    edited_payload = payload.copy()
    edited_payload['user'] = user2.id
    response = auth_client.post('/api/invoices/', edited_payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['detail'] == 'You cannot set the user field explicitly.'


############ PATCH #####################
@pytest.mark.django_db
def test_user_edit_his_invoice(auth_client, invoice):

    response = auth_client.patch('/api/invoices/1/', dict(number='edited', amount=222.44))

    assert response.status_code == status.HTTP_200_OK
    assert response.data['number'] == 'edited'
    assert response.data['amount'] == 222.44
