from rest_framework import serializers
from base.models import Invoice, Category, Supplier, Account
from django.contrib.auth import get_user_model

User = get_user_model()

# User Serializer
# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         # fields = ('id', 'username', 'email')
#         fields = ('id',)


# Register Serializer
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(validated_data['username'], validated_data['email'], validated_data['password'])

        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SupplierSerializer(serializers.ModelSerializer):
    media = CategorySerializer(many=False)

    class Meta:
        model = Supplier
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    # supplier = serializers.StringRelatedField()
    supplier = SupplierSerializer(many=False)

    class Meta:
        model = Invoice
        fields = "__all__"


class GetAccountSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(many=False)

    class Meta:
        model = Account
        fields = "__all__"

class PostAccountSerializer(serializers.ModelSerializer):

    class Meta:
        model = Account
        fields = "__all__"