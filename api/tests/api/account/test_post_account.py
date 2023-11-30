import pytest
from rest_framework import status, exceptions
from api.tests.conftest import account_payload as payload


@pytest.mark.django_db
def test_user_creates_new_account(auth_client):

    response = auth_client.post('/api/accounts/', payload)
    assert response.status_code == status.HTTP_201_CREATED

    response = auth_client.get('/api/accounts/1/')
    assert response.data['supplier']['name'] == 'PGNiG'
    assert response.data['login'] == 'test login'
    assert response.data['password'] == 'test password'
    assert response.data['category']['name'] == 'Gaz'

    all_accounts = auth_client.get('/api/accounts/')
    assert len(all_accounts.data) == 1


@pytest.mark.django_db
def test_user_creates_new_account_missing_required_fields_fail(auth_client):

    response = auth_client.post('/api/accounts/', {})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['supplier'] == [exceptions.ErrorDetail('This field is required.', code='required')]
    assert response.data['login'] == [exceptions.ErrorDetail('This field is required.', code='required')]
    assert response.data['password'] == [exceptions.ErrorDetail('This field is required.', code='required')]
    assert response.data['category'] == [exceptions.ErrorDetail('This field is required.', code='required')]


@pytest.mark.django_db
def test_not_user_creates_new_account_fail(client):

    response = client.post('/api/accounts/', payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'


@pytest.mark.django_db
def test_user_creates_new_account_for_another_user_fail(auth_client, user2):
    edited_payload = payload.copy()
    edited_payload['user'] = user2.id
    response = auth_client.post('/api/accounts/', edited_payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['detail'] == 'You cannot set the user field explicitly.'
