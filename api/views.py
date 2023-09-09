from django.contrib.auth import login
from django.contrib.auth.models import AnonymousUser
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet, ModelViewSet
from rest_framework import permissions
from .serializers import (
    InvoiceSerializer,
    CategorySerializer,
    SupplierSerializer,
    GetAccountSerializer,
    PostAccountSerializer,
    RegisterSerializer,
    PostInvoiceSerializer,)
from base.models import Invoice, Category, Supplier, Account
from base.services import get_pgnig, get_enea, get_aquanet
from base.tasks import sync_accounts_task
from users.models import NewUser
from users.serializers import CustomUserSerializer
from api.permissions import IsOwner


class InvoiceList(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InvoiceSerializer
    # queryset = invoices = Invoice.objects.all()
    
    # get certain Invoice by provide its number in url
    # /api/invoices/FV123aa
    # Does not work with '/'
    def get_object(self, queryset=None, **kwargs):
        item = self.kwargs.get('pk')
        return get_object_or_404(Invoice, pk=item)

    def get_queryset(self):
        if isinstance(self.request.user, AnonymousUser):
            return []
        return Invoice.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['POST', 'PATCH']:
            return PostInvoiceSerializer
        return InvoiceSerializer


class AccountList(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    # serializer_class = AccountSerializer
    # queryset = Account.objects.all()
    def get_serializer_class(self):
        if self.request.method in ['POST', 'PATCH']:
            return PostAccountSerializer
        return GetAccountSerializer

    def get_queryset(self):
        if isinstance(self.request.user, AnonymousUser):
            return []
        return Account.objects.filter(user=self.request.user)

    # Override the retrieve method to get a single account by ID
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    

class SupplierList(ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class CategoryList(ModelViewSet):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


class CurrentUser(ViewSet):
    queryset = NewUser.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = self.request.user
        return Response({'id': user.id})
    

class SyncAccounts(APIView):
    def get(self, request):
        sync_accounts_task.delay(self.request.user.pk)
        return Response("Done")
