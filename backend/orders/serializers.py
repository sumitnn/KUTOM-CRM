from rest_framework import serializers
from .models import Order, OrderItem
from accounts.models import User
from products.models import Product

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

