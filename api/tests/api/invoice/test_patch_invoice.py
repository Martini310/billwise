import pytest
from rest_framework import status


############ PATCH #####################
@pytest.mark.django_db
def test_user_edit_his_invoice(auth_client, invoice):

    response = auth_client.patch('/api/invoices/1/', dict(number='edited', amount=222.44))

    assert response.status_code == status.HTTP_200_OK
    assert response.data['number'] == 'edited'
    assert response.data['amount'] == 222.44


@pytest.mark.django_db
def test_user_edit_another_user_invoice_fail(auth_client2, invoice):

    response = auth_client2.patch('/api/invoices/1/', dict(number='edited', amount=222.44))

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data['detail'] == 'You are not allowed to see or edit this content'


@pytest.mark.django_db
def test_not_user_edit_user_invoice_fail(client, invoice):

    response = client.patch('/api/invoices/1/', dict(number='edited', amount=222.44))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == 'Authentication credentials were not provided.'
