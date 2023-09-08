from django.urls import path, include
# from .views import InvoiceList, InvoiceCreate, InvoiceDetails, CategoryList, CategoryDetails, AccountCreate, SupplierList, \
#     SupplierDetails
from .views import InvoiceList, AccountList, SupplierList, CategoryList, CurrentUser, SyncAccounts
from rest_framework.routers import DefaultRouter

app_name = 'billwise_api'

router = DefaultRouter()
router.register('invoices', InvoiceList, basename='invoices')
router.register('accounts', AccountList, basename='accounts')
router.register('suppliers', SupplierList, basename='suppliers')
router.register('category', CategoryList, basename='category')
router.register('current-user', CurrentUser, basename='current_user')
# urlpatterns = router.urls
urlpatterns = [
    path('', include(router.urls)),
    path('sync/', SyncAccounts.as_view(), name='sync'),
]



# urlpatterns = [
#     path('invoices/', InvoiceList.as_view()),
#     path('invoices/<int:pk>', InvoiceDetails.as_view()),
#     path('invoices/add/', InvoiceCreate.as_view()),
#     path('category/', CategoryList.as_view()),
#     path('category/<int:pk>/', CategoryDetails.as_view()),
#     path('suppliers/', SupplierList.as_view()),
#     path('suppliers/<int:pk>/', SupplierDetails.as_view()),
#     path('account/add/', AccountCreate.as_view()),
# ]
