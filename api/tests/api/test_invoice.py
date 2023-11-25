import pytest
from datetime import datetime
from rest_framework import status


@pytest.mark.django_db
def test_get_invoice(auth_client, invoice, category):
    response = auth_client.get('/api/invoices/1', follow=True)

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
    response = client.get('/api/invoices/1', follow=True)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."


@pytest.mark.django_db
def test_user_get_another_user_invoice_fail(auth_client2, invoice):
    response = auth_client2.get('/api/invoices/1', follow=True)

    assert response.status_code == status.HTTP_200_OK # NOT OK
