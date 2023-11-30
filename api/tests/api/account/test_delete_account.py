import pytest
from rest_framework import status


@pytest.mark.django_db
def test_user_send_delete_request_account(auth_client, account):
    response = auth_client.delete('/api/accounts/1/')

    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
def test_user_send_delete_request_to_another_user_account_fail(auth_client2, account):
    response = auth_client2.delete('/api/accounts/1/')

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data['detail'] == 'You are not allowed to see or edit this content'


@pytest.mark.django_db
def test_not_user_send_delete_request_fail(client, account):
    response = client.delete('/api/accounts/1/')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'
