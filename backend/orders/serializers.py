from rest_framework import serializers
from .models import Order, OrderItem, OrderHistory, OrderPayment,OrderRequestItem,OrderRequest,CustomerPurchase
from accounts.models import User, Address, Wallet, WalletTransaction,StockistAssignment
from products.models import Product, ProductImage, ProductVariant, RoleBasedProduct, ProductVariantPrice,ProductFeatures
from decimal import Decimal
from django.db.models import Sum
from products.serializers import BrandSerializer, CategorySerializer, TagSerializer


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
    role_based_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'address', 'phone', 'whatsapp_number',"role_based_id"]

    def get_address(self, obj):
        address = getattr(obj, "address", None)  
        return AddressSerializer(address).data if address else {}
    
    def get_role_based_id(self, obj):
        if hasattr(obj, 'vendor_id') and obj.role == 'vendor':
            return obj.vendor_id
        elif hasattr(obj, 'stockist_id') and obj.role == 'stockist':
            return obj.stockist_id
        elif hasattr(obj, 'reseller_id') and obj.role == 'reseller':
            return obj.reseller_id
        return None


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
    
class OrderRequestItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product.name', read_only=True)
    product_sku = serializers.CharField(source='product.product.sku', read_only=True)
    product_type = serializers.CharField(source='product.product.product_type', read_only=True)
    
    # Use rolebaseid as the main input field, mapped to product
    rolebaseid = serializers.PrimaryKeyRelatedField(
        queryset=RoleBasedProduct.objects.all(),
        source='product',  # This maps rolebaseid to the product field
        write_only=True
    )
    
    # Keep product as read-only for response
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = OrderRequestItem
        fields = [
            'id', 'product', 'rolebaseid', 'product_name', 'product_sku', 'product_type', 
            'quantity', 'unit_price', 'total_price', 'variant', 'gst_percentage', 'discount_percentage'
        ]
        read_only_fields = ['total_price', 'product_name', 'product_sku', 'product_type', 'product']

# serializers.py

class OrderRequestSerializer(serializers.ModelSerializer):
    items = OrderRequestItemSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    requested_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = OrderRequest
        fields = [
            'id', 'request_id', 'requested_by',
            'requestor_type', 'target_type', 'target_user',
            'status', 'note', 'items', 'total_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['request_id', 'created_at', 'updated_at', 'total_amount']
        extra_kwargs = {
            "requested_by": {"required": False},
            "requestor_type": {"required": False},
            "target_type": {"required": False},
        }

    def create(self, validated_data):
        request_user = self.context["request"].user
        items_data = validated_data.pop('items', [])
        admin_user = User.objects.filter(role='admin').first()
        

        total_amount = Decimal("0.00")

        # Calculate secure prices
        secure_items = []
        for item_data in items_data:
            variant = item_data.get("variant")
            role_based_product = item_data.get("product")  # This comes from rolebaseid field
            quantity = item_data.get("quantity", 1)
            
            # Get the actual Product from RoleBasedProduct
            actual_product = role_based_product.product

            try:
                price_obj = ProductVariantPrice.objects.get(
                    variant=variant,
                    role="admin",
                    product=actual_product
                )
            except ProductVariantPrice.DoesNotExist:
                raise serializers.ValidationError({
                    "error": f"No valid price found for variant {variant.id} and role admin"
                })

            unit_price = price_obj.price
            discount = price_obj.discount
            gst_percentage = price_obj.gst_percentage

            # Apply discount
            discounted_price = unit_price - (unit_price * Decimal(discount) / 100)

            # GST calculation
            gst_tax = discounted_price * Decimal(gst_percentage) / 100
            final_price = discounted_price + gst_tax

            total_price = final_price * quantity
            total_amount += total_price

            secure_items.append({
                "variant": variant,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": discount,
                "gst_percentage": gst_percentage,
                "gst_tax": gst_tax,
                "final_price": final_price,
                "total_price": total_price,
                "product": role_based_product  # RoleBasedProduct instance
            })

        # Default values
        validated_data['requested_by'] = request_user
        validated_data['target_user'] = admin_user
        validated_data.setdefault("requestor_type", "stockist")
        validated_data.setdefault("target_type", "admin")

        # Wallet check for stockists
        wallet = None
        if validated_data["requestor_type"] == "stockist":
            try:
                wallet = Wallet.objects.select_for_update().get(user=request_user)
                if wallet.current_balance < total_amount:
                    raise serializers.ValidationError({
                        "error": "Insufficient wallet balance"
                    })
                wallet.current_balance -= total_amount
                wallet.save()
            except Wallet.DoesNotExist:
                raise serializers.ValidationError({
                    "error": "Wallet not found for user"
                })

        # Create order request
        order_request = OrderRequest.objects.create(**validated_data)
        
        # Create wallet transaction for stockist
        if wallet and validated_data["requestor_type"] == "stockist":
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_amount,
                description=f"Order Request #{order_request.id} placed",
                transaction_status='SUCCESS',
                order_id=order_request.id
            )
        
        # Create order request items
        for item in secure_items:
            OrderRequestItem.objects.create(
                order_request=order_request,
                variant=item["variant"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                discount_percentage=item["discount"],
                gst_percentage=item["gst_percentage"],
                total_price=item["total_price"],
                product=item["product"]  # RoleBasedProduct instance
            )

        return order_request

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['total_amount'] = sum(item.total_price for item in instance.items.all())
        return representation


class OrderRequestStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderRequest
        fields = ['status']

class OrderRequestProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    features = serializers.SlugRelatedField(
        many=True,
        slug_field="name",
        queryset=ProductFeatures.objects.all(),
        required=False
    )
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'sku', 'is_active',  'weight', 'weight_unit',
            'dimensions', 'currency', 'product_type', 'video_url', 'warranty',
            'brand', 'category', 'tags', 'features', 'images'
        ]

class OrderRequestDetailItemSerializer(serializers.ModelSerializer):
    product = OrderRequestProductSerializer(source='product.product',read_only=True)  # nested full product
    variant = serializers.StringRelatedField()   # optional, to show variant name or implement a VariantSerializer

    class Meta:
        model = OrderRequestItem
        fields = [
            "id", "product", "quantity", "unit_price",
            "total_price", "variant", "gst_percentage", "discount_percentage"
        ]


class OrderRequestDetailSerializer(serializers.ModelSerializer):
    items = OrderRequestDetailItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    requested_by = UserBasicSerializer(read_only=True)  # your existing user serializer
   

    class Meta:
        model = OrderRequest
        fields = [
            'id', 'request_id', 'requested_by', 'target_user',
            'requestor_type', 'target_type', 'status', 'note',
            'items', 'total_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['request_id', 'created_at', 'updated_at', 'total_amount']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['total_amount'] = sum(item.total_price for item in instance.items.all())
        return representation


class ResellerOrderRequestSerializer(serializers.ModelSerializer):
    items = OrderRequestItemSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    requested_by=UserBasicSerializer(read_only=True)

    class Meta:
        model = OrderRequest
        fields = [
            'id', 'request_id', 'requested_by',
            'requestor_type', 'target_type', 'target_user',
            'status', 'note', 'items', 'total_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['request_id', 'created_at', 'updated_at', 'total_amount']
        extra_kwargs = {
            "requested_by": {"required": False},
            "requestor_type": {"required": False},
            "target_type": {"required": False},
        }

    def create(self, validated_data):
        
        request_user = self.context["request"].user
        items_data = validated_data.pop('items', [])
        stockist_user = (
            StockistAssignment.objects.filter(reseller=request_user)
            .select_related("stockist")
            .last()
        )

        stockist_user = stockist_user.stockist if stockist_user else (
            User.objects.filter(role="stockist", is_default_user=True).last()
        )
        
        total_amount = Decimal("0.00")

        # Calculate secure prices
        secure_items = []
        for item_data in items_data:
            variant= item_data.get("variant")
            quantity = item_data.get("quantity", 1)
            role_product= item_data.get("product")

            try:
                price_obj = ProductVariantPrice.objects.get(
                    variant=variant,
                    role="admin",
                    product=role_product.product
                )
            except ProductVariantPrice.DoesNotExist:
                raise serializers.ValidationError(
                    {"error": f"No valid price found for variant {variant.id} and role admin"}
                )

            unit_price = price_obj.price
            discount = price_obj.discount
            gst_percentage = price_obj.gst_percentage

            # Apply discount
            discounted_price = unit_price - (unit_price * Decimal(discount) / 100)

            # GST calculation
            gst_tax = discounted_price * Decimal(gst_percentage) / 100
            final_price = discounted_price + gst_tax

            total_price = final_price * quantity
            total_amount += total_price

            secure_items.append({
                "variant_id": variant.id,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": discount,
                "gst_percentage": gst_percentage,
                "gst_tax": gst_tax,
                "final_price": final_price,
                "total_price": total_price,
                "product_id": role_product.id
            })

        # Default values
        validated_data['requested_by'] = request_user
        validated_data['target_user'] = stockist_user
        validated_data.setdefault("requestor_type", "reseller")
        validated_data.setdefault("target_type", "stockist")

        # Wallet check for stockists
        if validated_data["requestor_type"] == "reseller":
            wallet = Wallet.objects.select_for_update().get(user=request_user)
            if wallet.current_balance < total_amount:
                raise serializers.ValidationError(
                    {"error": "Insufficient wallet balance"}
                )
            wallet.current_balance -= total_amount
            wallet.save()
        
            
        # Create order + secure items
        order_request = OrderRequest.objects.create(**validated_data)
        # Create wallet transaction for stockist
        WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=total_amount,
                description=f"Order Request #{order_request.id} placed",
                transaction_status='SUCCESS',
                order_id=order_request.id
            )
        
        for item in secure_items:
            OrderRequestItem.objects.create(
                order_request=order_request,
                variant_id=item["variant_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                discount_percentage=item["discount"],
                gst_percentage=item["gst_percentage"],
                total_price=item["total_price"],
                product_id=item["product_id"]
            )

        return order_request

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['total_amount'] = sum(item.total_price for item in instance.items.all())
        return representation



class CustomerPurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    
    class Meta:
        model = CustomerPurchase
        fields = '__all__'
        read_only_fields = ('id', 'total_price', 'vendor', 'created_at', 'updated_at')

    def create(self, validated_data):
      
        # Set the vendor to the current user
        validated_data['vendor'] = self.context['request'].user
        return super().create(validated_data)
    

class CustomerPurchaseRoleBasedProductSerializer(serializers.ModelSerializer):
    rolebaseproductid = serializers.UUIDField(source='id', read_only=True)
    name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = RoleBasedProduct
        fields = ['rolebaseproductid', 'name', 'is_featured', 'price']

class CustomerPurchaseListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    
    class Meta:
        model = CustomerPurchase
        fields = ['id','address','full_name','email','phone','product_name', 'variant_name', 'quantity', 'price_per_unit', 'total_price', 'payment_method', 'purchase_date', 'state_name', 'district_name']
        read_only_fields = ('id', 'total_price', 'vendor', 'created_at', 'updated_at')