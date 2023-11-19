import pytest
from rest_framework.test import APIClient
from rest_framework import status


client = APIClient()

@pytest.mark.django_db
def test_register_user():
    payload = {
        'first_name': 'testuser',
        'user_name': 'testusername',
        'email': 'test@user.com',
        'password': 'password'
    }

    response = client.post('/api/user/register/', payload)
    data = response.data

    assert response.status_code == status.HTTP_201_CREATED
    assert data['first_name'] == payload['first_name']
    assert data['user_name'] == payload['user_name']
    assert data['email'] == payload['email']
    assert 'password' not in data