from rest_framework import serializers
from .models import Order, OrderItem, OrderHistory, OrderPayment
from accounts.models import User, Address
from products.models import Product, ProductImage, ProductVariant, RoleBasedProduct
from decimal import Decimal
from django.db.models import Sum

class UserBasicSerializer(serializers.ModelSerializer):
    role_based_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_based_id', 'phone']

    def get_role_based_id(self, obj):
        if hasattr(obj, 'vendor_id') and obj.role == 'vendor':
            return obj.vendor_id
        elif hasattr(obj, 'stockist_id') and obj.role == 'stockist':
            return obj.stockist_id
        elif hasattr(obj, 'reseller_id') and obj.role == 'reseller':
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


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'sku']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_featured']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(),
        source='variant',
        write_only=True,
        required=False
    )
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    item_name = serializers.CharField(read_only=True)  # Uses @property from model
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)  # Uses @property from model

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_id', 'variant', 'variant_id', 
            'item_name', 'quantity', 'unit_price', 'discount_percentage', 
            'discount_amount', 'gst_percentage', 'gst_amount', 'total',
            'role_based_product'
        ]
        read_only_fields = ['total']



class OrderItemDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='product.name')
    images = serializers.SerializerMethodField()
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    item_name = serializers.CharField(source='item_name', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'name', 'item_name', 'unit_price', 'quantity', 
            'variant_name', 'discount_percentage', 'discount_amount',
            'gst_percentage', 'gst_amount', 'images', 'total'
        ]

    def get_images(self, obj):
        # Get images from the product
        images = obj.product.images.all() if obj.product else []
        return ProductImageSerializer(images, many=True).data


class AddressSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source='state.name', default='')
    district = serializers.CharField(source='district.name', default='')

    class Meta:
        model = Address
        fields = ['street_address', 'city', 'state', 'district', 'postal_code', 'country']


class UserWithAddressSerializer(serializers.ModelSerializer):
    address = serializers.SerializerMethodField()
    whatsapp_number = serializers.CharField(source='profile.whatsapp_number', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'address', 'phone', 'whatsapp_number']

    def get_address(self, obj):
        address = getattr(obj, "address", None)  
        return AddressSerializer(address).data if address else {}


class OrderSerializer(serializers.ModelSerializer):
    buyer = UserWithAddressSerializer(read_only=True)
    seller = UserBasicSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'seller', 'status', 'status_display',
            'payment_status', 'payment_status_display', 'description',
            'subtotal', 'total_price', 'gst_amount', 'discount_amount',
            'items', 'created_at', 'courier_name', 'tracking_number',
            'transport_charges', 'expected_delivery_date', 'receipt', 'note'
        ]
        read_only_fields = ['created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    buyer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='buyer',
        write_only=True
    )
    seller_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='seller',
        write_only=True,
        required=False
    )

    class Meta:
        model = Order
        fields = [
            'id', 'buyer_id', 'seller_id', 'status', 'description', 'note',
            'transport_charges', 'expected_delivery_date', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        # Calculate totals after creating items
        order.calculate_totals()
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'note']


class OrderHistorySerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    user_name = serializers.CharField(source='actor.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = OrderHistory
        fields = [
            'id', 'timestamp', 'user_name', 'actor',
            'previous_status', 'current_status',
            'action', 'action_display', 'notes', 'order_id'
        ]


class OrderDispatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id', 'courier_name', 'tracking_number', 'transport_charges',
            'expected_delivery_date', 'receipt', 'note', 'status'
        ]
        read_only_fields = ['id']


class OrderDetailSerializer(serializers.ModelSerializer):
    buyer = UserWithAddressSerializer(read_only=True)
    seller = UserBasicSerializer(read_only=True)
    items = OrderItemDetailSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    payments = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'status_display', 'payment_status', 'payment_status_display',
            'description', 'note', 'items', 'subtotal', 'total_price', 'gst_amount',
            'discount_amount', 'courier_name', 'tracking_number', 'expected_delivery_date',
            'buyer', 'seller', 'transport_charges', 'created_at', 'updated_at', 
            'receipt', 'payments'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_payments(self, obj):
        payments = obj.payments.all()
        return OrderPaymentSerializer(payments, many=True).data


class OrderPaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_name = serializers.CharField(source='order.buyer.username', read_only=True)

    class Meta:
        model = OrderPayment
        fields = [
            'id', 'order', 'amount', 'payment_method', 'payment_method_display',
            'transaction_id', 'status', 'status_display', 'notes',
            'created_at', 'updated_at', 'user_name'
        ]
        read_only_fields = ['created_at', 'updated_at']


class OrderPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderPayment
        fields = [
            'order', 'amount', 'payment_method', 'transaction_id', 'notes'
        ]

    def validate(self, data):
        order = data['order']
        amount = data['amount']
        
        # Check if payment exceeds order total
        total_paid = order.payments.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        if total_paid + amount > order.total_price:
            raise serializers.ValidationError(
                f"Payment amount exceeds order total. Remaining balance: {order.total_price - total_paid}"
            )
        
        return data