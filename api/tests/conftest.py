import pytest
from users.models import NewUser
from rest_framework.test import APIClient

@pytest.fixture
def user():
    payload = {
        "first_name": "testname",
        "username": "testuser",
        "email": "user@test.pl",
        "password": "userpassword"
    }
    user = NewUser.objects.create_user(**payload)
    return user


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client(user, client):
    client.post('/api/token/', dict(email='user@test.pl', password='userpassword'))
    return client