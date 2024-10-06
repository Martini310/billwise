import pytest
from rest_framework import status
from django.urls import reverse


############  GET  ################
@pytest.mark.django_db
def test_get_invoice(invoice, auth_client):
    url = reverse('billwise_api:invoices-detail', kwargs={'pk': invoice.pk})
    response = auth_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers['Content-Type'] == 'application/json'
    assert response.data['number'] == 'test/123'
    assert response.data['date'] == '2023-05-12'
    assert response.data['amount'] == 123
    assert response.data['pay_deadline']== '2023-05-22'
    assert response.data['start_date'] == '2023-05-02'
    assert response.data['end_date'] == '2023-05-10'
    assert response.data['amount_to_pay'] == 123
    assert response.data['wear'] == 100
    assert not response.data['is_paid']
    assert response.data['consumption_point'] == 'Test point'
    assert response.data['account'] is None
    assert response.data['category']['id'] == 1
    assert response.data['category']['name'] == 'Gaz'
    assert response.data['bank_account_number'] == '12 1234 5678 9012 3456 7890 1234'
    assert response.data['transfer_title'] == 'test title'


@pytest.mark.django_db
def test_user_get_not_existed_invoice_fail(auth_client, invoice):
    url = reverse('billwise_api:invoices-detail', kwargs={'pk': 2})
    response = auth_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_not_user_get_invoice_fail(client, invoice):
    url = reverse('billwise_api:invoices-detail', kwargs={'pk': invoice.pk})
    response = client.get(url, follow=True)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."


@pytest.mark.django_db
def test_user_get_another_user_invoice_fail(auth_client2, invoice):
    url = reverse('billwise_api:invoices-detail', kwargs={'pk': invoice.pk})
    response = auth_client2.get(url, follow=True)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data['detail'] == "You are not allowed to see or edit this content"


@pytest.mark.django_db
def test_user_get_all_his_invoices(auth_client, invoice, invoice2):
    url = reverse('billwise_api:invoices-list')
    response = auth_client.get(url, follow=True)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers['Content-Type'] == 'application/json'
    assert len(response.data) == 1
    assert response.data[0]['number'] == 'test/123'


@pytest.mark.django_db
def test_not_user_get_all_invoices_fail(client, invoice):
    url = reverse('billwise_api:invoices-list')
    response = client.get(url, follow=True)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['detail'] == "Authentication credentials were not provided."
    