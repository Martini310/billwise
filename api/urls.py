from django.urls import path
from .views import InvoiceList

urlpatterns = [
    path('invoices/', InvoiceList.as_view(), name='invoice_list'),
]