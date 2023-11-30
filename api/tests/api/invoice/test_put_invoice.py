import pytest
from rest_framework import status
from api.tests.conftest import invoice_payload as payload


################# PUT #######################
@pytest.mark.django_db
def test_user_send_put_request_fail(auth_client, invoice):
    edited_payload = payload.copy()
    edited_payload['number'] = 'edited number'
    response = auth_client.put('/api/invoices/1/', edited_payload)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "PUT" not allowed.'


@pytest.mark.django_db
def test_user_send_put_request_to_another_user_invoice_fail(auth_client2, invoice):
    edited_payload = payload.copy()
    edited_payload['number'] = 'edited number'
    response = auth_client2.put('/api/invoices/1/', edited_payload)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "PUT" not allowed.'


@pytest.mark.django_db
def test_not_user_send_put_request_fail(client, invoice):
    edited_payload = payload.copy()
    edited_payload['number'] = 'edited number'
    response = client.put('/api/invoices/1/', edited_payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'
