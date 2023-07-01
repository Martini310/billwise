from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from base.models import Invoice, Category, Supplier, Account
from .serializers import InvoiceSerializer, CategorySerializer, SupplierSerializer, AccountSerializer, \
    UserSerializer, RegisterSerializer
from knox.models import AuthToken
from django.contrib.auth import login
from rest_framework.authtoken.serializers import AuthTokenSerializer
from knox.views import LoginView as KnoxLoginView
from base.services import get_pgnig, get_enea
from api.permissions import IsOwner


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
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get(self, request):
        # enea_sup = Supplier.objects.get(name='Enea')
        # enea_account = Account.objects.get(user=self.request.user.pk, supplier=enea_sup)
        # get_enea(self.request.user.pk, enea_account.login, enea_account.password)
        # get_pgnig(self.request.user.pk, enea_account.login, enea_account.password)

        invoices = Invoice.objects.filter(user=self.request.user)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


# class InvoiceCreate(APIView):
#     def post(self, request):
#         serializer = InvoiceSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         else:
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvoiceCreate(CreateAPIView):
    serializer_class = InvoiceSerializer


class InvoiceDetails(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_invoice_by_pk(self, pk, user):
        try:
            invoice = Invoice.objects.get(pk=pk)
            if invoice.user == user:
                return invoice
            return Response({
                'error': f'Brak dostępu!'
            }, status=status.HTTP_404_NOT_FOUND)
        except AttributeError as E:
            return f"No data {E}"

    def get(self, request, pk):
        try:
            invoice = self.get_invoice_by_pk(pk=pk, user=self.request.user)
            print(3)
            print(invoice)
            if isinstance(invoice, Response):
                return invoice

            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data)
        except Exception as E:
            return Response({
                'error': f'Invoice does not exist {E}'
            }, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        invoice = Invoice.objects.get(pk=pk)
        serializer = InvoiceSerializer(invoice, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk)
            invoice.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)


# class CategoryList(APIView):
#     def get(self, request):
#         media = Category.objects.all()
#         serializer = CategorySerializer(media, many=True)
#         return Response(serializer.data)
#
#     def post(self, request):
#         serializer = CategorySerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         else:
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryList(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CategoryDetails(APIView):
    def get_media_by_pk(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except:
            return Response({
                'error': 'Category does not exist'
            }, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        media = self.get_media_by_pk(pk)
        serializer = CategorySerializer(media)
        return Response(serializer.data)

    def put(self, request, pk):
        media = self.get_media_by_pk(pk)
        serializer = CategorySerializer(media, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupplierList(ListCreateAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    
    # def get(self, request):
    #     supplier = Supplier.objects.all()
    #     serializer = SupplierSerializer(supplier, many=True)
    #     return Response(serializer.data)
    #
    # def post(self, request):
    #     serializer = SupplierSerializer(data=request.data)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data)
    #     else:
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupplierDetails(APIView):
    def get_supplier_by_pk(self, pk):
        try:
            return Supplier.objects.get(pk=pk)
        except:
            return Response({
                'error': 'Supplier does not exist'
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
