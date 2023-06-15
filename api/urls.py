from django.urls import path
from .views import InvoiceList, InvoiceCreate, InvoiceDetails, MediaList, AccountCreate, SupplierList, SupplierDetails

urlpatterns = [
    path('invoices/', InvoiceList.as_view()),
    path('invoices/<int:pk>', InvoiceDetails.as_view()),
    path('invoices/add/', InvoiceCreate.as_view()),
    path('media/', MediaList.as_view()),
    path('suppliers/', SupplierList.as_view()),
    path('suppliers/<int:pk>/', SupplierDetails.as_view()),
    path('account/add/', AccountCreate.as_view()),
]
