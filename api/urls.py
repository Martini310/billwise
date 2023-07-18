from django.urls import path
# from .views import InvoiceList, InvoiceCreate, InvoiceDetails, CategoryList, CategoryDetails, AccountCreate, SupplierList, \
#     SupplierDetails
from .views import InvoiceList, AccountCreate, SupplierList, CategoryList, CurrentUser
from rest_framework.routers import DefaultRouter

app_name = 'billwise_api'

router = DefaultRouter()
router.register('invoices', InvoiceList, basename='invoices')
router.register('account/add', AccountCreate, basename='add_account')
router.register('suppliers', SupplierList, basename='suppliers')
router.register('category', CategoryList, basename='category')
router.register('current-user', CurrentUser, basename='current_user')
urlpatterns = router.urls



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
