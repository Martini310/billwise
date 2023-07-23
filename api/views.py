from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from base.models import Invoice, Category, Supplier, Account
from .serializers import InvoiceSerializer, CategorySerializer, SupplierSerializer, AccountSerializer, RegisterSerializer
from users.models import NewUser
from django.contrib.auth import login
from rest_framework.authtoken.serializers import AuthTokenSerializer
from base.services import get_pgnig, get_enea
from api.permissions import IsOwner
from rest_framework.viewsets import ViewSet, ModelViewSet
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import AnonymousUser
from users.serializers import CustomUserSerializer


class InvoiceList(ModelViewSet):
    # permission_classes = [permissions.IsAuthenticated]
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
        
        enea_sup = Supplier.objects.get(name='Enea')
        enea_account = Account.objects.get(user=self.request.user.pk, supplier=enea_sup)
        get_pgnig(self.request.user.pk, enea_account.login, enea_account.password)
        return Invoice.objects.filter(user=self.request.user)


class AccountCreate(ModelViewSet):
    serializer_class = AccountSerializer
    queryset = Account.objects.all()


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
#### OLD VIEWS ####

# class InvoiceList(ViewSet):
#     # permission_classes = [permissions.IsAuthenticated]
#     queryset = invoices = Invoice.objects.all()

#     def list(self, request):
#         serializer = InvoiceSerializer(self.queryset, many=True)
#         return Response(serializer.data)
    
#     def retrieve(self, request, pk=None):
#         invoice = get_object_or_404(self.queryset, pk=pk)
#         serializer = InvoiceSerializer(invoice)
#         return Response(serializer.data)
    
#     def destroy(self, request, pk=None):
#         invoice = get_object_or_404(self.queryset, pk=pk)
#         invoice.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)

# class InvoiceList(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request):
#         # enea_sup = Supplier.objects.get(name='Enea')
#         # enea_account = Account.objects.get(user=self.request.user.pk, supplier=enea_sup)
#         # get_enea(self.request.user.pk, enea_account.login, enea_account.password)
#         # get_pgnig(self.request.user.pk, enea_account.login, enea_account.password)

#         # invoices = Invoice.objects.filter(user=self.request.user)
#         invoices = Invoice.objects.all()
#         serializer = InvoiceSerializer(invoices, many=True)
#         return Response(serializer.data)


class InvoiceCreate(CreateAPIView):
    serializer_class = InvoiceSerializer


# class InvoiceDetails(APIView):
#     # permission_classes = [permissions.IsAuthenticated, IsOwner]

#     def get_invoice_by_pk(self, pk, user):
#         try:
#             invoice = Invoice.objects.get(pk=pk)
#             if invoice.user == user:
#                 return invoice
#             return Response({
#                 'error': f'Brak dostępu!'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except AttributeError as E:
#             return f"No data {E}"

#     def get(self, request, pk):
#         try:
#             invoice = self.get_invoice_by_pk(pk=pk, user=self.request.user)
#             print(3)
#             print(invoice)
#             if isinstance(invoice, Response):
#                 return invoice

#             serializer = InvoiceSerializer(invoice)
#             return Response(serializer.data)
#         except Exception as E:
#             return Response({
#                 'error': f'Invoice does not exist {E}'
#             }, status=status.HTTP_404_NOT_FOUND)

#     def put(self, request, pk):
#         invoice = Invoice.objects.get(pk=pk)
#         serializer = InvoiceSerializer(invoice, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         else:
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def delete(self, request, pk):
#         try:
#             invoice = Invoice.objects.get(pk=pk)
#             invoice.delete()
#             return Response(status=status.HTTP_204_NO_CONTENT)
#         except ValueError:
#             return Response(status=status.HTTP_400_BAD_REQUEST)


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

# class CategoryList(ListCreateAPIView):
#     queryset = Category.objects.all()
#     serializer_class = CategorySerializer


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


# class SupplierList(ListCreateAPIView):
#     queryset = Supplier.objects.all()
#     serializer_class = SupplierSerializer
    
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


# class AccountCreate(APIView):
#     def post(self, request):
#         serializer = AccountSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         else:
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class AccountCreate(CreateAPIView):
#     serializer_class = AccountSerializer


