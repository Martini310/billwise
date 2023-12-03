import pytest
from datetime import date
from django.contrib.auth import get_user_model
from base.models import Category, Supplier, Account, Invoice

@pytest.fixture
def user():
    return get_user_model().objects.create_user(username='testuser', password='testpassword', email='test@user.pl', first_name='test_name')

@pytest.fixture
def category():
    return Category.objects.create(name='Test Category')

@pytest.fixture
def supplier():
    return Supplier.objects.create(name='Test Supplier', url='http://example.com')

@pytest.fixture
def account(user, category, supplier):
    return Account.objects.create(
        supplier=supplier,
        login='testlogin',
        password='testpassword',
        user=user,
        category=category
    )

@pytest.fixture
def invoice(user, category, account):
    return Invoice.objects.create(
        number='FV123',
        date=date.today(),
        amount=100.0,
        pay_deadline=date.today(),
        user=user,
        is_paid=False,
        consumption_point='Test Point',
        account=account,
        category=category,
        bank_account_number='1234567890',
        transfer_title='Test Title'
    )

@pytest.mark.django_db
def test_category_str_representation(category):
    assert str(category) == 'Test Category'

@pytest.mark.django_db
def test_supplier_str_representation(supplier):
    assert str(supplier) == 'Test Supplier'

@pytest.mark.django_db
def test_account_str_representation(account):
    expected_str = f"[id:{account.pk}] Konto w {account.supplier.name} użytkownika {account.user.username}"
    assert str(account) == expected_str

@pytest.mark.django_db
def test_invoice_str_representation(invoice):
    expected_str = f"[id:{invoice.pk}] Faktura nr {invoice.number} za {invoice.category} dla użytkownika {invoice.user.username}"
    assert str(invoice) == expected_str

@pytest.mark.django_db
def test_invoice_default_values(invoice):
    assert invoice.is_paid is False
    assert invoice.start_date is None
    assert invoice.end_date is None
    assert invoice.amount_to_pay is None
    assert invoice.wear is None
    assert invoice.consumption_point == 'Test Point'
    assert invoice.bank_account_number == '1234567890'
    assert invoice.transfer_title == 'Test Title'
