from rest_framework import serializers
from .models import *
   
from django.utils.text import slugify

import json
from collections import defaultdict

class BrandSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "is_active","description", "created_at", "updated_at","owner"]
        read_only_fields = ["created_at", "updated_at","owner"]


    def get_created_at(self, obj):
        return obj.created_at.date().isoformat()  

    def get_updated_at(self, obj):
        return obj.updated_at.date().isoformat()

    def update(self, instance, validated_data):
        for attr in ['name', 'is_active']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])

        logo = validated_data.get('logo')
        if logo:
            instance.logo = logo

        instance.save()
        return instance

class MainCategorySerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    updated_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    class Meta:
        model = MainCategory
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    updated_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'main_category', 'is_active', 'created_at', 'updated_at',"owner"]
        read_only_fields = ['created_at', 'updated_at', 'owner']

    def update(self, instance, validated_data):
        for attr in ['name', 'is_active', 'main_category']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])
        instance.save()
        return instance

class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    updated_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = SubCategory
        fields = [
            'id', 'name',
            'category', 'category_name',
            'brand', 'brand_name',
            'is_active', 'created_at', 'updated_at',"owner"
        ]
        read_only_fields = ['created_at', 'updated_at', 'owner']

    def update(self, instance, validated_data):
        for attr in ['name', 'category', 'brand', 'is_active']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])
        instance.save()
        return instance

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"
        read_only_fields = ['slug']

    def create(self, validated_data):
        tag, _ = Tag.objects.get_or_create(**validated_data)
        return tag

    def update(self, instance, validated_data):
        if 'name' in validated_data:
            instance.name = validated_data['name']
            instance.slug = slugify(validated_data['name'])
        instance.save()
        return instance




class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = "__all__"
        read_only_fields = ['created_at']


class ProductPriceTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPriceTier
        fields = "__all__"
        read_only_fields = ['id','product', 'size']



class ProductSizeSerializer(serializers.ModelSerializer):
    price_tiers = ProductPriceTierSerializer(many=True, read_only=True)

    class Meta:
        model = ProductSize
        fields = "__all__"
        read_only_fields = ['created_at', 'updated_at']


class AdminProductSizeSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = AdminProductSize
        fields = "__all__"
        read_only_fields = ['created_at', 'updated_at']


class ProductLISTCREATESerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    vendor_id = serializers.CharField(source='owner.vendor_id', read_only=True)
 
    

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'slug', 'description', 'short_description',
            'brand', 'brand_name', 'category', 'category_name', 'subcategory',
            'subcategory_name', 'tags', 'status', 'is_featured', 'rating',
            'images', 'sizes', 'created_at', 'updated_at',
            'currency', 'weight', 'weight_unit', 'dimensions', 'product_type',
            'shipping_info', 'video_url', 'warranty', 'content_embeds', 'features','vendor_id','gst_tax','gst_percentage'
        ]
        read_only_fields = ['sku', 'slug', 'created_at', 'updated_at']




class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    vendor_id = serializers.CharField(source='owner.vendor_id', read_only=True)
    features = serializers.SerializerMethodField()
    

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'slug', 'description', 'short_description',
            'brand', 'brand_name', 'category', 'category_name', 'subcategory',
            'subcategory_name', 'tags', 'status', 'is_featured', 'rating',
            'images', 'sizes', 'created_at', 'updated_at',
            'currency', 'weight', 'weight_unit', 'dimensions', 'product_type',
            'shipping_info', 'video_url', 'warranty', 'content_embeds', 'features','vendor_id','gst_tax','gst_percentage'
        ]
        read_only_fields = ['sku', 'slug', 'created_at', 'updated_at']

    def get_features(self, obj):
        try:
            if isinstance(obj.features, str):
                return json.loads(obj.features)
            elif isinstance(obj.features, list):
                return obj.features
            else:
                return []
        except Exception:
            return []


class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProductImage
        fields = ['id', 'image', 'alt_text', 'is_featured', 'is_default', 'created_at']


class AdminProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProductSize
        fields = ['id', 'size', 'unit', 'price', 'is_default', 'is_active', 'created_at', 'updated_at']


class AdminProductDetailSerializer(serializers.ModelSerializer):
    images = AdminProductImageSerializer(many=True, read_only=True)
    sizes = AdminProductSizeSerializer(many=True, read_only=True)
    admin_id = serializers.CharField(source='admin.id', read_only=True)
    admin_name = serializers.CharField(source='admin.username', read_only=True)

    brand_id = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    category_id = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    subcategory_id = serializers.SerializerMethodField()
    subcategory_name = serializers.SerializerMethodField()

    tags = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    class Meta:
        model = AdminProduct
        fields = [
            'id', 'sku', 'name', 'slug', 'description', 'short_description',
            'price', 'resale_price', 'weight', 'weight_unit', 'dimensions',
            'product_type', 'currency', 'quantity_available', 'stock_status',
            'is_active', 'admin_id', 'admin_name', 'video_url',
            'brand_id', 'brand_name',
            'category_id', 'category_name',
            'subcategory_id', 'subcategory_name',
            'tags',
            'created_at', 'updated_at',
            'images', 'sizes'
        ]
        read_only_fields = fields

    def get_brand_id(self, obj):
        return obj.brand.id if obj.brand else None

    def get_brand_name(self, obj):
        return obj.brand.name if obj.brand else None

    def get_category_id(self, obj):
        return obj.category.id if obj.category else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_subcategory_id(self, obj):
        return obj.subcategory.id if obj.subcategory else None

    def get_subcategory_name(self, obj):
        return obj.subcategory.name if obj.subcategory else None

    def update(self, instance, validated_data):
        # Only allow updating price, resale_price, is_active
        allowed_fields = {'price', 'resale_price', 'is_active'}
        for field in list(validated_data.keys()):
            if field not in allowed_fields:
                validated_data.pop(field)
        return super().update(instance, validated_data)




class ProductSizeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = '__all__'  

class ProductDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku']

class AdminProductDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProduct
        fields = ['id', 'name', 'sku']

class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    brand_name = serializers.CharField(source='product.brand.name', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='product.subcategory.name', read_only=True)
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = [
            'id', 'product', 'product_name', 'size', 'size_display',
            'quantity', 'old_quantity', 'new_quantity', 'rate', 'total_price', 'status', 'notes',
            'brand_name', 'category_name', 'subcategory_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'old_quantity', 'total_price', 'status',
            'created_at', 'updated_at'
        ]

    def get_size_display(self, obj):
        return str(obj.size.size) if obj.size else None

    def create(self, validated_data):
        
        product = validated_data['product']
        size = validated_data.get('size')
        new_quantity = int(validated_data.get('quantity', 0))
        rate = validated_data.get('rate', 0)

        # Prevent duplicate stock
        if Stock.objects.filter(product=product, size=size).exists():
            raise serializers.ValidationError("Stock already exists for this product-size combination. Please update instead.")

        # Compute derived fields
        validated_data['old_quantity'] = 0
        validated_data['quantity'] = new_quantity
        validated_data['total_price'] = new_quantity * rate
        validated_data['status'] = 'out_of_stock' if new_quantity <= 10 else 'in_stock'
        validated_data['notes'] = validated_data.get('notes', '')


        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.new_quantity = validated_data.get('quantity', 0)
        instance.rate = validated_data.get('rate', instance.rate)
        instance.notes = validated_data.get('notes', instance.notes)

        instance.save()
        return instance
    

class AdminProductCommissionSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    vendor_price = serializers.SerializerMethodField()
    mrp = serializers.SerializerMethodField()
    margin = serializers.SerializerMethodField()

    class Meta:
        model = ProductCommission
        fields = [
            'id', 'admin_product', 'product_name', 'vendor_price', 'mrp', 'margin',
            'commission_type', 'reseller_commission_value', 'stockist_commission_value',
            'admin_commission_value', 'updated_at'
        ]
        read_only_fields = ['admin_commission_value', 'margin']

    def get_product_name(self, obj):
        return obj.admin_product.name if obj.admin_product else None

    def get_vendor_price(self, obj):
        return obj.admin_product.price if obj.admin_product else None

    def get_mrp(self, obj):
        return obj.admin_product.resale_price if obj.admin_product else None

    def get_margin(self, obj):
        return obj.calculate_margin()
    

class AdminProductSerializer(serializers.ModelSerializer):
    reseller_commission_value = serializers.SerializerMethodField()
    stockist_commission_value = serializers.SerializerMethodField()

    class Meta:
        model = AdminProduct
        fields = '__all__'  # still sends all AdminProduct fields
        # the two commission fields will be appended

    def get_reseller_commission_value(self, obj):
        commission = getattr(obj, "commission", None)
        if not commission:
            commission = getattr(obj, "adminproductcommission", None)
        return commission.reseller_commission_value if commission else None

    def get_stockist_commission_value(self, obj):
        commission = getattr(obj, "commission", None)
        if not commission:
            commission = getattr(obj, "adminproductcommission", None)
        return commission.stockist_commission_value if commission else None
    

class AdminProductListSerializer(serializers.ModelSerializer):
    brand_id = serializers.IntegerField(source='brand.id', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    subcategory_id = serializers.IntegerField(source='subcategory.id', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)

    first_image = serializers.SerializerMethodField()

    class Meta:
        model = AdminProduct
        fields = [
            'id', 'name', 'short_description', 'price', 'resale_price',
            'weight', 'weight_unit', 'stock_status', 'is_active', 'sku',
            'brand_id', 'brand_name',
            'category_id', 'category_name',
            'subcategory_id', 'subcategory_name',
            'first_image', 'quantity_available'
        ]

    def get_first_image(self, obj):
        image = (
            obj.images.filter(is_default=True).first()
            or obj.images.filter(is_featured=True).first()
            or obj.images.first()
        )
        return image.image.url if image else None
