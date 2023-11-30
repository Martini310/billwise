import pytest
from rest_framework import status
from api.tests.conftest import invoice_payload as payload


################# POST ######################
@pytest.mark.django_db
def test_user_creates_new_invoice(auth_client):

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
def test_not_user_creates_new_invoice_fail(client):

    response = client.post('/api/invoices/', payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'


@pytest.mark.django_db
def test_user_creates_new_invoice_for_another_user_fail(auth_client, user2):
    edited_payload = payload.copy()
    edited_payload['user'] = user2.id
    response = auth_client.post('/api/invoices/', edited_payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['detail'] == 'You cannot set the user field explicitly.'
