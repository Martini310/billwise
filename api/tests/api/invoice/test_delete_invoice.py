import pytest
from rest_framework import status


################ DELETE ###############
@pytest.mark.django_db
def test_user_send_delete_request_fail(auth_client, invoice):
    response = auth_client.delete('/api/invoices/1/')

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "DELETE" not allowed.'


@pytest.mark.django_db
def test_user_send_delete_request_to_another_user_invoice_fail(auth_client2, invoice):
    response = auth_client2.delete('/api/invoices/1/')

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "DELETE" not allowed.'


@pytest.mark.django_db
def test_not_user_send_delete_request_fail(client, invoice):
    response = client.delete('/api/invoices/1/')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'
