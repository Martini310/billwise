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


# ---------------------------------------------------------------------------
# Konfiguracja zaufanego urządzenia Orange z poziomu aplikacji (zamiast shella).
# Dwa kroki: /orange-setup/start/ wysyła SMS, /orange-setup/verify/ zapisuje token.
# Stan sesji (ciasteczka + executionId/state) trzymamy tymczasowo na koncie
# (Account.setup_state), żeby działało też przy wielu workerach.
# ---------------------------------------------------------------------------
import json as _json
import requests as _requests
import urllib3 as _urllib3
from base.services.suppliers.orange import SyncOrange

_urllib3.disable_warnings(_urllib3.exceptions.InsecureRequestWarning)


def _orange_account(request):
    account_id = request.data.get('account_id')
    return get_object_or_404(Account, pk=account_id, user=request.user, supplier__name='Orange')


class OrangeSetupStart(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        account = _orange_account(request)
        base = SyncOrange.LOGIN_BASE
        hdr = {'Origin': SyncOrange.ORIGIN, 'Referer': f'{base}/zaloguj'}
        s = _requests.Session()
        s.headers.update({'User-Agent': SyncOrange.USER_AGENT, 'Accept': 'application/json'})
        try:
            s.get(f'{base}/zaloguj', verify=False, timeout=30)
            s.get(f'{base}/session/check', verify=False, timeout=30)
            init = s.post(f'{base}/login/init', json={'login': account.login},
                          headers=hdr, verify=False, timeout=30).json()
            if not init.get('executionId'):
                return Response({'detail': 'Nie udało się rozpocząć logowania (sesja/CSRF).'},
                                status=status.HTTP_502_BAD_GATEWAY)

            pw = s.post(f'{base}/login/action',
                        json={'action': 'LOGIN_2FA_PASSWORD', 'executionId': init['executionId'],
                              'state': init['state'], 'login': account.login, 'password': account.password},
                        headers=hdr, verify=False, timeout=30).json()
            action = pw.get('requireAction')

            if action == 'COMPLETED':
                token = s.cookies.get('AUTH_DEVICE_TOKEN')
                if token:
                    account.device_token = token
                    account.notification = None
                    account.save(update_fields=['device_token', 'notification'])
                return Response({'status': 'completed'})

            if action not in ('LOGIN_2FA_SMS', 'LOGIN_2FA_SMS_RETRY'):
                return Response({'detail': pw.get('message') or f'Nieoczekiwany wynik: {action}'},
                                status=status.HTTP_400_BAD_REQUEST)

            # SMS wysłany — zapamiętaj stan sesji do kroku weryfikacji.
            account.setup_state = _json.dumps({
                'cookies': _requests.utils.dict_from_cookiejar(s.cookies),
                'exec_id': pw.get('executionId', init['executionId']),
                'state': pw.get('state', init['state']),
            })
            account.save(update_fields=['setup_state'])
            return Response({'status': 'sms_sent'})

        except _requests.RequestException as exc:
            return Response({'detail': f'Błąd połączenia z Orange: {exc}'},
                            status=status.HTTP_502_BAD_GATEWAY)


class OrangeSetupVerify(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        account = _orange_account(request)
        code = (request.data.get('code') or '').strip()
        if not code:
            return Response({'detail': 'Podaj kod SMS.'}, status=status.HTTP_400_BAD_REQUEST)
        if not account.setup_state:
            return Response({'detail': 'Sesja konfiguracji wygasła — rozpocznij konfigurację ponownie.'},
                            status=status.HTTP_400_BAD_REQUEST)

        cfg = _json.loads(account.setup_state)
        base = SyncOrange.LOGIN_BASE
        hdr = {'Origin': SyncOrange.ORIGIN, 'Referer': f'{base}/zaloguj'}
        s = _requests.Session()
        s.headers.update({'User-Agent': SyncOrange.USER_AGENT, 'Accept': 'application/json'})
        s.cookies = _requests.utils.cookiejar_from_dict(cfg.get('cookies', {}))
        try:
            otp = s.post(f'{base}/login/action',
                         json={'action': 'LOGIN_2FA_SMS', 'executionId': cfg['exec_id'],
                               'state': cfg['state'], 'otp': code},
                         headers=hdr, verify=False, timeout=30).json()
            if otp.get('requireAction') != 'COMPLETED' or not otp.get('deviceToken'):
                # Zły/przeterminowany kod — pozwól spróbować ponownie (nie czyść sesji).
                return Response({'detail': otp.get('message') or 'Kod SMS nieprawidłowy.'},
                                status=status.HTTP_400_BAD_REQUEST)

            s.post(f'{base}/login/completed',
                   json={'action': 'ADD_DEVICE', 'state': cfg['state'],
                         'authenticationId': otp['authenticationId'], 'deviceToken': otp['deviceToken']},
                   headers={'Origin': SyncOrange.ORIGIN}, verify=False, timeout=30)

            token = s.cookies.get('AUTH_DEVICE_TOKEN')
            if not token:
                return Response({'detail': 'Brak tokenu zaufanego urządzenia po rejestracji.'},
                                status=status.HTTP_502_BAD_GATEWAY)

            account.device_token = token
            account.notification = None
            account.setup_state = None
            account.save(update_fields=['device_token', 'notification', 'setup_state'])
            return Response({'status': 'completed'})

        except _requests.RequestException as exc:
            return Response({'detail': f'Błąd połączenia z Orange: {exc}'},
                            status=status.HTTP_502_BAD_GATEWAY)
