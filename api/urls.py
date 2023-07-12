from django.urls import path
from .views import InvoiceList, InvoiceCreate, InvoiceDetails, CategoryList, CategoryDetails, AccountCreate, SupplierList, \
    SupplierDetails


urlpatterns = [
    path('invoices/', InvoiceList.as_view()),
    path('invoices/<int:pk>', InvoiceDetails.as_view()),
    path('invoices/add/', InvoiceCreate.as_view()),
    path('category/', CategoryList.as_view()),
    path('category/<int:pk>/', CategoryDetails.as_view()),
    path('suppliers/', SupplierList.as_view()),
    path('suppliers/<int:pk>/', SupplierDetails.as_view()),
    path('account/add/', AccountCreate.as_view()),
]
