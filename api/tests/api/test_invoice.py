import pytest
from datetime import datetime
from rest_framework.test import APIClient
from rest_framework import status


@pytest.mark.django_db
def test_create_invoice(auth_client, invoice, category, user):
    response = auth_client.get('/api/invoices/1', follow=True)

    print(response.data)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['number'] == 'test/123'
    assert response.data['date'] == datetime.today().date()
    assert response.data['amount'] == 123
    assert response.data['pay_deadline']== datetime.today().date()
    assert response.data['start_date'] == datetime.today().date()
    assert response.data['end_date'] == datetime.today().date()
    assert response.data['amount_to_pay'] == 123
    assert response.data['wear'] == 100
    assert response.data['user'] == user
    assert not response.data.is_paid
    assert response.data['consumption_point'] == 'Test point'
    assert response.data['account'] is None
    assert response.data['category'] == category
    assert response.data['bank_account_number'] == '12 1234 5678 9012 3456 7890 1234'
    assert response.data['transfer_title'] == 'test title'


@pytest.mark.django_db
def not_user_get_invoice_fail():
    pass