from rest_framework import serializers
from .models import *
from accounts.models import User
from products.models import Product,ProductImage
from decimal import Decimal
from accounts.models import Address

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # or your custom user model
        fields = ['id', 'username', 'email', 'role']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category']  # Add more fields if needed

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']  

    def get_subtotal(self, obj):
        return obj.quantity * obj.price  # Optional if not stored

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_featured']

class OrderItemDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='product.name')
    images = ProductImageSerializer(source='product.images', many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'price', 'quantity', 'images', 'total']

    def get_total(self, obj):
        return obj.price * obj.quantity



class AddressSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source='state.name', default='')
    district = serializers.CharField(source='district.name', default='')

    class Meta:
        model = Address
        fields = [
            'street_address',
            'city',
            'state',
            'district',
            'postal_code',
            'country'
        ]

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    date = serializers.SerializerMethodField()
    shippingAddress = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    tax = serializers.SerializerMethodField()
    shipping = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'date', 'status', 'description',
            'items', 'subtotal', 'shipping', 'tax', 'total_price',
            'shippingAddress'
        ]

    def get_date(self, obj):
        return obj.created_at.date() if obj.created_at else None

    def get_shippingAddress(self, obj):
        address = getattr(obj.reseller, "address", None)
        if address:
            return AddressSerializer(address).data
        return None

    def get_subtotal(self, obj):
        return sum(item.price * item.quantity for item in obj.items.all())

    def get_tax(self, obj):
        return self.get_subtotal(obj) * Decimal("0.10")  # Proper Decimal multiplication

    def get_shipping(self, obj):
        return Decimal("0.00")


class OrderSerializer(serializers.ModelSerializer):
    reseller = UserBasicSerializer()
    stockist = UserBasicSerializer()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'reseller',
            'stockist',
            'status',
            'description',
            'total_price',
            'items',
            'created_at'
        ]

class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status','note']


class OrderHistorySerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    user_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    brand_name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    subcategory = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()
    actual_rate = serializers.SerializerMethodField()
    accepted_price = serializers.DecimalField(source='order.accepted_price', max_digits=10, decimal_places=2, read_only=True)
    amount = serializers.DecimalField(source='order.total_amount', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderHistory
        fields = [
            'id', 'timestamp', 'user_name', 'brand_name', 'category', 'subcategory',
            'quantity', 'actual_rate', 'accepted_price', 'action', 'amount', 'order_number'
        ]

    def get_brand_name(self, obj):
        return getattr(getattr(obj.order.product, 'brand', None), 'name', '')

    def get_category(self, obj):
        return getattr(getattr(obj.order.product, 'category', None), 'name', '')

    def get_subcategory(self, obj):
        return getattr(getattr(obj.order.product, 'subcategory', None), 'name', '')

    def get_quantity(self, obj):
        return getattr(obj.order, 'quantity', 0)

    def get_actual_rate(self, obj):
        return getattr(obj.order.product, 'actual_rate', None)