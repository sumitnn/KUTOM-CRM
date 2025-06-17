from rest_framework import serializers
from .models import (
    Brand, Category, SubCategory, Tag,
    Product, ProductSize, ProductImage,
    ProductPriceTier, Notification
)

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "is_active", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def update(self, instance, validated_data):
        for attr in ['name', 'is_active']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])

        logo = validated_data.get('logo')
        if logo:
            instance.logo = logo

        instance.save()
        return instance


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'is_featured', 'is_active', 'subcategories', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_subcategories(self, obj):
        subcategories = obj.subcategories.filter(is_active=True)
        return SubCategorySerializer(subcategories, many=True, context=self.context).data


class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'category', 'category_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']

    def create(self, validated_data):
        tag, created = Tag.objects.get_or_create(**validated_data)
        return tag


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_featured', 'created_at']
        read_only_fields = ['created_at']


class ProductPriceTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPriceTier
        fields = ['id', 'min_quantity', 'price']
        read_only_fields = ['id']


class ProductSizeSerializer(serializers.ModelSerializer):
    price_tiers = ProductPriceTierSerializer(many=True, read_only=True)

    class Meta:
        model = ProductSize
        fields = [
            'id', 'name', 'size', 'unit', 'price', 'cost_price', 
            'quantity', 'is_default', 'is_active', 'price_tiers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'slug', 'description', 'short_description',
            'brand', 'brand_name', 'category', 'category_name', 'subcategory',
            'subcategory_name', 'tags', 'status', 'is_featured', 'rating',
            'images', 'sizes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sku', 'slug', 'created_at', 'updated_at']
        extra_kwargs = {
            'brand': {'required': False},
            'category': {'required': False},
            'subcategory': {'required': False},
        }

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        product = Product.objects.create(**validated_data)
        
        # Handle tags
        for tag_data in tags_data:
            tag, created = Tag.objects.get_or_create(name=tag_data['name'])
            product.tags.add(tag)
            
        return product

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        
        if tags_data is not None:
            instance.tags.clear()
            for tag_data in tags_data:
                tag, created = Tag.objects.get_or_create(name=tag_data['name'])
                instance.tags.add(tag)
                
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'title', 'message', 'notification_type',
            'is_read', 'related_url', 'created_at'
        ]
        read_only_fields = ['created_at']