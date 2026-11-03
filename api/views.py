import time

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, exceptions
from rest_framework.mixins import ListModelMixin
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, GenericViewSet

from api.permissions import IsOwner
from base.models import Account, Category, Invoice, Supplier, Group, RecurringPayment
from base.tasks import synchronize_data
from base.services.recurring import generate_recurring_invoices

from .serializers import (CategorySerializer, GetAccountSerializer, GroupSerializer,
                        InvoiceSerializer, PostAccountSerializer,
                        PostInvoiceSerializer, RecurringPaymentSerializer, SupplierSerializer)


class InvoiceList(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = InvoiceSerializer

    # get certain Invoice by provide its number in url
    # /api/invoices/FV123aa
    # Does not work with '/'
    def get_object(self, queryset=None, **kwargs):
        item = self.kwargs.get('pk')
        return get_object_or_404(Invoice, pk=item)

    def get_queryset(self):
        # time.sleep(3) # Only to demonstrate loading circle
        return Invoice.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PATCH']:
            return PostInvoiceSerializer
        return InvoiceSerializer

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        if 'user' in request.data:
            return Response({'detail': 'You cannot set the user field explicitly.'},
                            status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        raise exceptions.MethodNotAllowed("PUT")

    def destroy(self, request, *args, **kwargs):
        raise exceptions.MethodNotAllowed("DELETE")


class AccountList(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_object(self, queryset=None, **kwargs):
        item = self.kwargs.get('pk')
        return get_object_or_404(Account, pk=item)

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PATCH']:
            return PostAccountSerializer
        return GetAccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        if 'user' in request.data:
            return Response({'detail': 'You cannot set the user field explicitly.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Zmiana kategorii konta propaguje się na jego istniejące faktury
        # (nie trzeba ponownie pobierać danych).
        instance.refresh_from_db()
        Invoice.objects.filter(account=instance).update(category=instance.category)

        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        raise exceptions.MethodNotAllowed("PUT")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupList(ModelViewSet):
    """CRUD na grupach dostawców, ograniczony do grup zalogowanego użytkownika."""
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(user=self.request.user)


class RecurringPaymentList(ModelViewSet):
    """CRUD na cyklicznych opłatach; zapis generuje brakujące faktury."""
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = RecurringPaymentSerializer

    def get_queryset(self):
        return RecurringPayment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        obj = serializer.save()
        generate_recurring_invoices(obj.user)

    def perform_update(self, serializer):
        obj = serializer.save()
        generate_recurring_invoices(obj.user)


class SupplierList(GenericViewSet, ListModelMixin):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class CategoryList(GenericViewSet, ListModelMixin):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


class SyncAccounts(APIView):
    def get(self, request):
        user_pk = self.request.user.pk
        try:
            # Wrzuć zadanie na kolejkę Celery (produkcja).
            synchronize_data.delay(user_pk)
        except Exception as exc:
            # Broker/worker niedostępny (np. lokalnie bez Redis) → uruchom synchronicznie.
            logger = __import__('logging').getLogger(__name__)
            logger.warning(f"Celery niedostępny ({exc}); synchronizuję synchronicznie.")
            synchronize_data(user_pk)
        return Response("Done")
