import pytest
from rest_framework import status
from api.tests.conftest import account_payload as payload


@pytest.mark.django_db
def test_user_send_put_request_account_fail(auth_client, account):
    edited_payload = payload.copy()
    edited_payload['login'] = 'edited login'
    response = auth_client.put('/api/accounts/1/', edited_payload)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "PUT" not allowed.'


@pytest.mark.django_db
def test_user_send_put_request_to_another_user_account_fail(auth_client2, account):
    edited_payload = payload.copy()
    edited_payload['login'] = 'edited login'
    response = auth_client2.put('/api/accounts/1/', edited_payload)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "PUT" not allowed.'


@pytest.mark.django_db
def test_not_user_send_put_request_account_fail(client, account):
    edited_payload = payload.copy()
    edited_payload['login'] = 'edited login'
    response = client.put('/api/accounts/1/', edited_payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'
