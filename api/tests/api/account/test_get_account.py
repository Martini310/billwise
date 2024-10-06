import pytest
from rest_framework import status


############ GET OBJECT ################
@pytest.mark.django_db
def test_user_get_his_account(auth_client, account):
    response = auth_client.get('/api/accounts/1/')

    assert response.status_code == status.HTTP_200_OK
    assert response.headers['Content-Type'] == 'application/json'
    assert response.data['supplier']['name'] == 'PGNiG'
    assert response.data['login'] == 'test login'
    assert response.data['password'] == 'test password'
    assert response.data['category']['name'] == 'Gaz'


@pytest.mark.django_db
def test_user_get_not_existed_account_fail(auth_client, account):
    response = auth_client.get('/api/accounts/2/')

    assert response.status_code == status.HTTP_404_NOT_FOUND


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
    assert response.headers['Content-Type'] == 'application/json'
    assert len(response.data) == 1
    
    assert response.data[0]['login'] == 'test login'


@pytest.mark.django_db
def test_not_user_get_all_accounts_fail(client, account):
    response = client.get('/api/accounts/', follow=True)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."
