import pytest
from rest_framework import status


payload = {
        'supplier': 1,
        'login': 'test login',
        'password': 'test password',
        'category': 1,
    }

############ GET OBJECT ################
@pytest.mark.django_db
def test_user_get_his_account(auth_client, account):
    response = auth_client.get('/api/accounts/1/')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['supplier']['name'] == 'PGNiG'
    assert response.data['login'] == 'test login'
    assert response.data['password'] == 'test password'
    assert response.data['category']['name'] == 'Gaz'


@pytest.mark.django_db
def test_not_user_get_account_fail(client, account):
    response = client.get('/api/accounts/1/')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."


@pytest.mark.django_db
def test_user_get_another_user_account_fail(auth_client2, account):
    response = auth_client2.get('/api/accounts/1/', follow=True)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data['detail'] == "You are not allowed to see or edit this content"


############ GET ALL ################
@pytest.mark.django_db
def test_user_get_all_his_accounts(auth_client, account, account2):
    response = auth_client.get('/api/accounts/', follow=True)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['login'] == 'test login'


@pytest.mark.django_db
def test_not_user_get_all_accounts_fail(client, account):
    response = client.get('/api/accounts/', follow=True)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."


############ POST ################
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
