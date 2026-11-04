from django.contrib.auth import get_user_model
from rest_framework import serializers
from base.models import Account, Category, Invoice, Supplier, Group, RecurringPayment

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(validated_data['username'],
                                        validated_data['email'],
                                        validated_data['password']
                                        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SupplierSerializer(serializers.ModelSerializer):

    class Meta:
        model = Supplier
        fields = '__all__'


class GroupSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Group
        fields = ('id', 'name', 'color', 'user')


class RecurringPaymentSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = RecurringPayment
        fields = ('id', 'name', 'amount', 'amount_variable', 'category', 'group', 'day', 'interval_months',
                  'start_date', 'bank_account_number', 'transfer_title', 'active', 'user')


class RecurringMiniSerializer(serializers.ModelSerializer):
    """Lekki widok opłaty cyklicznej zagnieżdżany w fakturze (nazwa + grupa)."""
    group = GroupSerializer(many=False, read_only=True)

    class Meta:
        model = RecurringPayment
        fields = ('id', 'name', 'group', 'amount_variable')


class GetAccountSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(many=False)
    category = CategorySerializer(many=False)
    group = GroupSerializer(many=False, read_only=True)

    class Meta:
        model = Account
        fields = "__all__"


class PostAccountSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    
    class Meta:
        model = Account
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    account = GetAccountSerializer(many=False)
    category = CategorySerializer(many=False)
    recurring = RecurringMiniSerializer(many=False, read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'number', 'date', 'amount', 'pay_deadline', 'start_date',
                    'end_date', 'amount_to_pay', 'wear', 'is_paid', 'consumption_point',
                    'account', 'recurring', 'category', 'bank_account_number', 'transfer_title', 'estimated']


class PostInvoiceSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Invoice
        fields = "__all__"
