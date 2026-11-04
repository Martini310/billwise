from django.urls import path, include
from .views import (InvoiceList, AccountList, SupplierList, CategoryList, GroupList,
                    RecurringPaymentList, SyncAccounts, OrangeSetupStart, OrangeSetupVerify)
from rest_framework.routers import DefaultRouter

app_name = 'billwise_api'

router = DefaultRouter()
router.register('invoices', InvoiceList, basename='invoices')
router.register('accounts', AccountList, basename='accounts')
router.register('suppliers', SupplierList, basename='suppliers')
router.register('category', CategoryList, basename='category')
router.register('groups', GroupList, basename='groups')
router.register('recurring', RecurringPaymentList, basename='recurring')

urlpatterns = [
    path('', include(router.urls)),
    path('sync/', SyncAccounts.as_view(), name='sync'),
    path('orange-setup/start/', OrangeSetupStart.as_view(), name='orange-setup-start'),
    path('orange-setup/verify/', OrangeSetupVerify.as_view(), name='orange-setup-verify'),
]
