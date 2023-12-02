import pytest
from rest_framework import status


@pytest.mark.django_db
def test_user_get_supplier_list(auth_client):

    response = auth_client.get('/api/suppliers/')

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 3 # [PGNiG, Enea, Aquanet] Predefined in migrations


@pytest.mark.django_db
def test_not_user_get_supplier_list_fail(client):

    response = client.get('/api/suppliers/')
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."


@pytest.mark.django_db
def test_user_post_supplier(auth_client):

    response = auth_client.post('/api/suppliers/', dict(name='test', url='https://test.com'))

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.data['detail'] == 'Method "POST" not allowed.'


@pytest.mark.django_db
def test_user_put_supplier(auth_client):

    response = auth_client.put('/api/suppliers/1/', dict(name='test', url='https://test.com'))

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_user_patch_supplier(auth_client):

    response = auth_client.patch('/api/suppliers/1/', dict(name='test'))

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_user_delete_supplier(auth_client):

    response = auth_client.delete('/api/suppliers/1/')

    assert response.status_code == status.HTTP_404_NOT_FOUND
