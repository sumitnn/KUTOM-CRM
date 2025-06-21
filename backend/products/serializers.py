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

class CategorySerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)
    updated_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def update(self, instance, validated_data):

        for attr in ['name', 'is_active']:
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
        fields = ['id', 'name', 'slug']
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
            'id',  'size', 'unit', 'price', 
             'is_default', 'is_active', 'price_tiers',
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
            'images', 'sizes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['sku', 'slug', 'created_at', 'updated_at']
        extra_kwargs = {
            'brand': {'required': False},
            'category': {'required': False},
            'subcategory': {'required': False},
        }

    def _parse_json_field(self, request, field_name, default=None):
        """Helper to parse JSON fields from request data"""
        if default is None:
            default = []
        data = request.data.get(field_name)
        try:
            return json.loads(data) if data else default
        except (json.JSONDecodeError, TypeError):
            return default

    def _process_tags(self, product, tags_data):
        """Process product tags"""
        if not tags_data:
            return

        product.tags.clear()
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
            product.tags.add(tag)

    def _process_sizes_and_tiers(self, product, sizes_data, price_tiers_data, is_update=False):
        """Process sizes and price tiers with bulk operations"""
        # Delete existing sizes if updating
        if is_update:
            product.sizes.all().delete()

        # Prepare size objects
        size_objs = []
        for size_data in sizes_data:
            size_objs.append(ProductSize(
                product=product,
                size=size_data.get('size', ''),
                unit=size_data.get('unit', 'gram'),
                price=float(size_data.get('price', 0)),
                is_default=size_data.get('is_default', False)
            ))

        # Bulk create sizes
        created_sizes = ProductSize.objects.bulk_create(size_objs)

        # Process price tiers
        tier_objs = []
        for tier_data in price_tiers_data:
            size_index = tier_data.get('size_index', -1)
            if 0 <= size_index < len(created_sizes):
                tier_objs.append(ProductPriceTier(
                    size=created_sizes[size_index],
                    min_quantity=int(tier_data.get('min_quantity', 0)),
                    price=float(tier_data.get('price', 0))
                ))

        # Bulk create price tiers
        if tier_objs:
            ProductPriceTier.objects.bulk_create(tier_objs)

    def _process_images(self, product, request, is_update=False):
        """Process product images"""
        try:
            if is_update:
                # Handle removed images
                removed_images = request.data.getlist('removed_images')
                if removed_images:
                    try:
                        # Convert to integers
                        removed_ids = [int(img_id) for img_id in removed_images if img_id.isdigit()]
                        # Delete the images from storage and database
                        ProductImage.objects.filter(
                            product=product,
                            id__in=removed_ids
                        ).delete()
                    except (ValueError, TypeError) as e:
                        print(f"Error processing removed images: {e}")

                # Clear existing featured images
                ProductImage.objects.filter(product=product, is_featured=True).update(is_featured=False)

            # Process main image
            if 'image' in request.FILES:
                main_images = request.FILES.getlist('image')
                if main_images:
                    ProductImage.objects.create(
                        product=product,
                        image=main_images[0],
                        is_featured=True
                    )
                    # Add remaining main images as non-featured
                    for img in main_images[1:]:
                        ProductImage.objects.create(
                            product=product,
                            image=img
                        )

            # Process additional images
            additional_images = request.FILES.getlist('additional_images')
            for img in additional_images:
                ProductImage.objects.create(
                    product=product,
                    image=img
                )
        except Exception as e:
            print(f"Error in _process_images: {e}")
            raise

    def create(self, validated_data):
        request = self.context.get('request')
        
        # Create the product
        product = Product.objects.create(**validated_data)
        
        # Parse JSON data
        sizes_data = self._parse_json_field(request, 'sizes')
        price_tiers_data = self._parse_json_field(request, 'price_tiers')
        tags_data = self._parse_json_field(request, 'tags')

        # Process related data
        self._process_tags(product, tags_data)
        self._process_sizes_and_tiers(product, sizes_data, price_tiers_data)
        self._process_images(product, request)
        
        return product
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        # Update basic fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        
        # Parse JSON data
        sizes_data = self._parse_json_field(request, 'sizes')
        price_tiers_data = self._parse_json_field(request, 'price_tiers')
        tags_data = self._parse_json_field(request, 'tags')

        # Process related data
        self._process_tags(instance, tags_data)
        self._process_sizes_and_tiers(instance, sizes_data, price_tiers_data, is_update=True)
        self._process_images(instance, request, is_update=True)
        
        return instance



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