from rest_framework import serializers
from base.models import Invoice


class InvoiceSerializer(serializers.Serializer):
    class Meta:
        model = Invoice
        fields = "__all__"
