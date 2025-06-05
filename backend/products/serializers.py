
from rest_framework import serializers
from .models import *

class BrandSerializer(serializers.ModelSerializer):
    owner = serializers.EmailField(source='owner.email', read_only=True)
    access = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "is_featured", "description", "access", "slug", "owner"]

    def update(self, instance, validated_data):
        for attr in ['name', 'description', 'is_featured']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])

        logo = validated_data.get('logo')
        if logo:
            instance.logo = logo

        instance.save()
        return instance

    def get_access(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'role', None) == "admin":
            return True

        return obj.owner == user

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.StringRelatedField(many=True, read_only=True)
    access=serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'is_featured', 'display_order', 'subcategories', 'created_at', 'updated_at', "access"]

    def get_access(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not user.is_authenticated:
            return False
        # Admin can edit all categories
        if user.role == "admin":  
            return True
        return obj.owner == user

class SubcategorySerializer(serializers.ModelSerializer):
    parent = CategorySerializer(read_only=True)
    access = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'parent', 'is_featured', 'display_order',
            'created_at', 'updated_at', 'access'
        ]

    def get_access(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin":
            return True
        return obj.owner == user


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'display_order', 'is_featured']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'name', 'price', 'quantity', 'attributes', 'is_default', 'in_stock', 'low_stock']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'description', 'price', 'owner', 'variants', 'images', 'tags']
        read_only_fields = ['owner']