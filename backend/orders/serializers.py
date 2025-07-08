from rest_framework import serializers
from .models import Order, OrderItem, OrderHistory,Sale
from accounts.models import User, Address
from products.models import Product, ProductImage, ProductSize
from decimal import Decimal


class UserBasicSerializer(serializers.ModelSerializer):
    role_based_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'email', 'role_based_id']

    def get_role_based_id(self, obj):
        if obj.role == 'vendor':
            return obj.vendor_id
        elif obj.role == 'stockist':
            return obj.stockist_id
        elif obj.role == 'reseller':
            return obj.reseller_id
        return None


class ProductSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_id = serializers.IntegerField(source='brand.id', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku',
            'category_id', 'category_name',
            'brand_id', 'brand_name'
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_featured']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    product_size = serializers.StringRelatedField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_size', 'quantity', 'price', 'discount']


class OrderItemDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='product.name')
    images = ProductImageSerializer(source='product.images', many=True, read_only=True)
    product_size = serializers.StringRelatedField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'price', 'quantity', 'product_size', 'images', 'total']

    def get_total(self, obj):
        discounted_price = obj.price * (1 - obj.discount / 100)
        return round(obj.quantity * discounted_price, 2)


class AddressSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source='state.name', default='')
    district = serializers.CharField(source='district.name', default='')

    class Meta:
        model = Address
        fields = ['street_address', 'city', 'state', 'district', 'postal_code', 'country']


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
            'shippingAddress', 'courier_name', 'tracking_number', 'expected_delivery_date'
        ]

    def get_date(self, obj):
        return obj.created_at.date() if obj.created_at else None

    def get_shippingAddress(self, obj):
        address = getattr(obj.created_for, "address", None)
        if address:
            return AddressSerializer(address).data
        return None

    def get_subtotal(self, obj):
        return sum(item.total for item in obj.items.all())

    def get_tax(self, obj):
        return self.get_subtotal(obj) * Decimal("0.10")

    def get_shipping(self, obj):
        return obj.transport_charges


class OrderSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer()
    created_for = UserBasicSerializer()
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'created_by',
            'created_for',
            'status',
            'description',
            'total_price',
            'items',
            'created_at'
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'note']


class OrderHistorySerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    user_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = OrderHistory
        fields = [
            'id', 'timestamp', 'user_name',
            'previous_status', 'current_status',
            'action', 'action_display', 'notes',
            'order_id'
        ]

class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_size = serializers.CharField(source='product_size.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    order_date = serializers.SerializerMethodField() 

    class Meta:
        model = Sale
        fields = [
            'id', 'order', 'seller', 'buyer', 'product', 'product_name',
            'product_size', 'product_image', 'quantity', 'price', 
            'discount', 'total_price', 'order_date'
        ]

    def get_product_image(self, obj):
        if obj.product:
            image = obj.product.images.filter(is_default=True).first()
            if not image:
                image = obj.product.images.filter(is_featured=True).first()
            if image:
                return image.image.url
        return None
    def get_order_date(self, obj):
        # Handle both date and datetime objects
        sale_date = obj.sale_date
        if hasattr(sale_date, 'date'):  # If it's a datetime
            return sale_date.date().isoformat()
        return sale_date.isoformat()