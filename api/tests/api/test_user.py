import pytest
from rest_framework.test import APIClient
from rest_framework import status


client = APIClient()

@pytest.mark.django_db
def test_register_user():
    payload = {
        'first_name': 'testuser',
        'username': 'testusername',
        'email': 'test@user.com',
        'password': 'password'
    }

    response = client.post('/api/user/register/', payload)
    data = response.data

    assert response.status_code == status.HTTP_201_CREATED
    assert data['first_name'] == payload['first_name']
    assert data['username'] == payload['username']
    assert data['email'] == payload['email']
    assert 'password' not in data

@pytest.mark.django_db
def test_login_user():
    payload = {
        'first_name': 'testuser',
        'username': 'testusername',
        'email': 'test@user.com',
        'password': 'password'
    }

    client.post('/api/user/register/', payload)

    response = client.post('/api/token/', data={'email': 'test@user.com', 'password': 'password'})

    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['username'] == 'testusername'
    assert response.data['id'] == 1

@pytest.mark.django_db
def test_login_user_fail():

    response = client.post('/api/token/', data={'email': 'test@user.com', 'password': 'password'})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'No active account found with the given credentials'
