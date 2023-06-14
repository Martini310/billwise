from django.urls import path
from .views import InvoiceList, InvoiceCreate, MediaList, AccountCreate

urlpatterns = [
    path('invoices/', InvoiceList.as_view()),
    path('invoices/add/', InvoiceCreate.as_view()),
    path('media/', MediaList.as_view()),
    path('account/', AccountCreate.as_view()),
]
