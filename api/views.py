from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from base.models import Invoice, Media, Supplier, Account
from .serializers import InvoiceSerializer, MediaSerializer, SupplierSerializer, AccountSerializer, \
    UserSerializer, RegisterSerializer
from knox.models import AuthToken
from django.contrib.auth import login
from rest_framework.authtoken.serializers import AuthTokenSerializer
from knox.views import LoginView as KnoxLoginView
from base.services import get_pgnig, get_enea


# Register API
class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)[1]
        })


class LoginAPI(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return super(LoginAPI, self).post(request, format=None)


class InvoiceList(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # get_pgnig()
        enea_sup = Supplier.objects.get(name='Enea')
        enea_account = Account.objects.get(user=self.request.user.pk, supplier=enea_sup)
        get_enea(self.request.user.pk, enea_account.login, enea_account.password)

        invoices = Invoice.objects.filter(user=self.request.user)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


class InvoiceCreate(APIView):
    def post(self, request):
        serializer = InvoiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvoiceDetails(APIView):
    def get(self, request, pk):
        try:
            supplier = Invoice.objects.get(pk=pk)
            serializer = InvoiceSerializer(supplier)
            return Response(serializer.data)
        except:
            return Response({
                'error':  'Invoice does not exist'
            }, status=status.HTTP_404_NOT_FOUND)


class MediaList(APIView):
    def get(self, request):
        media = Media.objects.all()
        serializer = MediaSerializer(media, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MediaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MediaDetails(APIView):
    def get_media_by_pk(self, pk):
        try:
            return Media.objects.get(pk=pk)
        except:
            return Response({
                'error':  'Media does not exist'
            }, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        media = self.get_media_by_pk(pk)
        serializer = MediaSerializer(media)
        return Response(serializer.data)

    def put(self, request, pk):
        media = self.get_media_by_pk(pk)
        serializer = MediaSerializer(media, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupplierList(APIView):
    def get(self, request):
        supplier = Supplier.objects.all()
        serializer = SupplierSerializer(supplier, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SupplierSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupplierDetails(APIView):
    def get_supplier_by_pk(self, pk):
        try:
            return Supplier.objects.get(pk=pk)
        except:
            return Response({
                'error':  'Supplier does not exist'
            }, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        supplier = self.get_supplier_by_pk(pk)
        serializer = SupplierSerializer(supplier)
        return Response(serializer.data)

    def put(self, request, pk):
        supplier = self.get_supplier_by_pk(pk)
        serializer = SupplierSerializer(supplier, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountCreate(APIView):
    def post(self, request):
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
