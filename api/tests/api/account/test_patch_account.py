import pytest
from rest_framework import status, exceptions


@pytest.mark.django_db
def test_user_edit_his_account(auth_client, account):

    response = auth_client.patch('/api/accounts/1/', dict(login='edited', password='new password'))

    assert response.status_code == status.HTTP_200_OK
    assert response.data['login'] == 'edited'
    assert response.data['password'] == 'new password'


@pytest.mark.django_db
def test_user_edit_his_account_with_invalid_data_fail(auth_client, account):

    response = auth_client.patch('/api/accounts/1/', dict(supplier='edited', category='new password'))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['supplier'] == [exceptions.ErrorDetail(string='Incorrect type. Expected pk value, received str.', code='incorrect_type')]
    assert response.data['category'] == [exceptions.ErrorDetail(string='Incorrect type. Expected pk value, received str.', code='incorrect_type')]


@pytest.mark.django_db
def test_user_edit_another_user_account_fail(auth_client2, account):

    response = auth_client2.patch('/api/accounts/1/', dict(number='edited', amount='new password'))

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data['detail'] == 'You are not allowed to see or edit this content'


@pytest.mark.django_db
def test_not_user_edit_user_account_fail(client, account):

    response = client.patch('/api/accounts/1/', dict(number='edited', amount='new password'))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'
