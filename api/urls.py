from django.urls import path, include
from .views import InvoiceList, AccountList, SupplierList, CategoryList, CurrentUser, SyncAccounts
from rest_framework.routers import DefaultRouter

app_name = 'billwise_api'

router = DefaultRouter()
router.register('invoices', InvoiceList, basename='invoices')
router.register('accounts', AccountList, basename='accounts')
router.register('suppliers', SupplierList, basename='suppliers')
router.register('category', CategoryList, basename='category')
router.register('current-user', CurrentUser, basename='current_user')

urlpatterns = [
    path('', include(router.urls)),
    path('sync/', SyncAccounts.as_view(), name='sync'),
]
