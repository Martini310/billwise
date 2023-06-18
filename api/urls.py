from django.urls import path
from .views import InvoiceList, InvoiceCreate, InvoiceDetails, MediaList, MediaDetails, AccountCreate, SupplierList, \
    SupplierDetails, RegisterAPI, LoginAPI
from knox import views as knox_views


urlpatterns = [
    path('register/', RegisterAPI.as_view(), name='register'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('logout/', knox_views.LogoutView.as_view(), name='logout'),
    path('logoutall/', knox_views.LogoutAllView.as_view(), name='logoutall'),
    path('invoices/', InvoiceList.as_view()),
    path('invoices/<int:pk>', InvoiceDetails.as_view()),
    path('invoices/add/', InvoiceCreate.as_view()),
    path('media/', MediaList.as_view()),
    path('media/<int:pk>/', MediaDetails.as_view()),
    path('suppliers/', SupplierList.as_view()),
    path('suppliers/<int:pk>/', SupplierDetails.as_view()),
    path('account/add/', AccountCreate.as_view()),
]
