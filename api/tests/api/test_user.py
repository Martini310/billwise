import pytest
from rest_framework import status


data = dict(
    first_name='testuser',
    username='testuser',
    email='user@test.pl',
    password='userpassword'
    )


@pytest.mark.django_db
def test_register_user(client):
    response = client.post('/api/user/register/', data)
    res = response.data

    assert response.status_code == status.HTTP_201_CREATED
    assert res['first_name'] == data['first_name']
    assert res['username'] == data['username']
    assert res['email'] == data['email']
    assert 'password' not in res


@pytest.mark.django_db
def test_login_user(user, client):
    response = client.post('/api/token/', dict(email=data['email'], password=data['password']))

    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['username'] == data['username']
    assert response.data['id'] == 1


@pytest.mark.django_db
def test_login_user_fail(client):
    response = client.post('/api/token/', dict(email='user@test.pl', password='userpassword'))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'No active account found with the given credentials'


@pytest.mark.django_db
def test_logout_user(user, client):
    login_response = client.post('/api/token/', dict(email=data['email'], password=data['password']))
    assert login_response.status_code == status.HTTP_200_OK

    refresh_token = login_response.data.get('refresh')

    logout_response = client.post('/api/user/logout/blacklist/', dict(refresh_token=refresh_token))
    assert logout_response.status_code == status.HTTP_205_RESET_CONTENT

    invalid_refresh_response = client.post('/api/token/refresh/', dict(refresh=refresh_token))
    assert invalid_refresh_response.status_code == status.HTTP_401_UNAUTHORIZED
