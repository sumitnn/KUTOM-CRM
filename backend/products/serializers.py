from rest_framework import serializers
from .models import *
   
from django.utils.text import slugify

import json
from collections import defaultdict

class BrandSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "is_active","description", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


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

    class Meta:
        model = Category
        fields = ['id', 'name', 'main_category', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

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

    class Meta:
        model = SubCategory
        fields = [
            'id', 'name',
            'category', 'category_name',
            'brand', 'brand_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

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
        read_only_fields = ['id']


class ProductSizeSerializer(serializers.ModelSerializer):
    price_tiers = ProductPriceTierSerializer(many=True, read_only=True)

    class Meta:
        model = ProductSize
        fields = "__all__"
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
            'images', 'sizes', 'created_at', 'updated_at',
            'currency', 'weight', 'weight_unit', 'dimensions', 'product_type',
            'shipping_info', 'video_url', 'warranty', 'content_embeds', 'features'
        ]
        read_only_fields = ['sku', 'slug', 'created_at', 'updated_at']



class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    brand_name = serializers.CharField(source='product.brand.name', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='product.subcategory.name', read_only=True)
    size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = [
            'id', 'product', 'product_name', 'size', 'size_display', 'quantity', 
            'rate', 'total_price', 'status', 'notes',
            'brand_name', 'category_name', 'subcategory_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_price', 'created_at', 'updated_at']
    
    def get_size_display(self, obj):
        if obj.size:
            return f"{obj.size.size}"
        return None
    
    def create(self, validated_data):
        validated_data['total_price'] = validated_data['quantity'] * validated_data['rate']
        return super().create(validated_data)


class ProductSizeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = '__all__'  

class ProductDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku']