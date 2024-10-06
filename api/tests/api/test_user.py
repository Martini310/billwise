import pytest
from rest_framework import status
from rest_framework.exceptions import ErrorDetail


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
    payload = dict(email=data['email'], password=data['password'])
    login_response = client.post('/api/token/', payload)
    assert login_response.status_code == status.HTTP_200_OK

    refresh_token = login_response.data.get('refresh')

    logout_response = client.post('/api/user/logout/blacklist/', dict(refresh_token=refresh_token))
    assert logout_response.status_code == status.HTTP_205_RESET_CONTENT

    invalid_refresh_response = client.post('/api/token/refresh/', dict(refresh=refresh_token))
    assert invalid_refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_change_password(auth_client):
    payload = dict(old_password='userpassword', new_password='newpassword')
    response = auth_client.post('/api/user/change_password/', payload)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['message'] == 'Password changed successfully.'

    reauth_response = auth_client.post('/api/token/', dict(email='user@test.pl', password='newpassword'))
    assert reauth_response.status_code == status.HTTP_200_OK
    assert 'access' in reauth_response.data
    assert 'refresh' in reauth_response.data


@pytest.mark.django_db
def test_change_password_fail(auth_client):
    payload = dict(old_password='wrong_password', new_password='newpassword')
    response = auth_client.post('/api/user/change_password/', payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['error'] == 'Incorrect old password.'

    reauth_response = auth_client.post('/api/token/', dict(email='user@test.pl', password='userpassword'))
    assert reauth_response.status_code == status.HTTP_200_OK
    assert 'access' in reauth_response.data
    assert 'refresh' in reauth_response.data


@pytest.mark.django_db
def test_change_password_wrong_payload_fail(auth_client):
    payload = dict(wrong_field='userpassword', new_password='newpassword')
    response = auth_client.post('/api/user/change_password/', payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data == {'old_password': [ErrorDetail(string='This field is required.', code='required')]}

    reauth_response = auth_client.post('/api/token/', dict(email='user@test.pl', password='userpassword'))
    assert reauth_response.status_code == status.HTTP_200_OK
    assert 'access' in reauth_response.data
    assert 'refresh' in reauth_response.data
