import time

from django.contrib.auth.models import AnonymousUser
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ViewSet

from api.permissions import IsOwner
from base.models import Account, Category, Invoice, Supplier
from base.tasks import sync_accounts_task
from users.models import NewUser

from .serializers import (CategorySerializer, GetAccountSerializer,
                        InvoiceSerializer, PostAccountSerializer,
                        PostInvoiceSerializer, SupplierSerializer)


class InvoiceList(ModelViewSet):
    permission_classes = [IsOwner]
    serializer_class = InvoiceSerializer

    # get certain Invoice by provide its number in url
    # /api/invoices/FV123aa
    # Does not work with '/'
    def get_object(self, queryset=None, **kwargs):
        item = self.kwargs.get('pk')
        return get_object_or_404(Invoice, pk=item)

    def get_queryset(self):
        if isinstance(self.request.user, AnonymousUser):
            return []
        time.sleep(2) # Only to demonstrate loading circle
        return Invoice.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PATCH']:
            return PostInvoiceSerializer
        return InvoiceSerializer


class AccountList(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

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
