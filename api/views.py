from rest_framework.views import APIView
from rest_framework.response import Response
from base.models import Invoice
from .serializer import InvoiceSerializer


class InvoiceList(APIView):
    def get(self, request):
        invoices = Invoice.objects.all()
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
