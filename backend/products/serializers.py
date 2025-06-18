from rest_framework import serializers
from .models import *
   
from django.utils.text import slugify
import json


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
        # Get the request object from context
        request = self.context.get('request')
        
        # Create the product first
        product = Product.objects.create(**validated_data)
        
        # Handle tags if they exist in request data
        tags_data = request.data.get('tags', [])
        if tags_data:
            try:
                tags_list = json.loads(tags_data[0]) if isinstance(tags_data, list) else json.loads(tags_data)
                for tag_name in tags_list:
                    tag, created = Tag.objects.get_or_create(name=tag_name.strip())
                    product.tags.add(tag)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Handle sizes and price tiers
        sizes_data = {}
        for key, value in request.data.items():
            if key.startswith('sizes['):
                # Parse size index and field name
                parts = key.split('[')
                index = int(parts[1].split(']')[0])
                field = parts[2].split(']')[0]
                
                if index not in sizes_data:
                    sizes_data[index] = {}
                sizes_data[index][field] = value[0] if isinstance(value, list) else value
        
        # Create sizes
        for index, size_data in sizes_data.items():
            size = ProductSize.objects.create(
                product=product,
                size=size_data.get('size', ''),
                unit=size_data.get('unit', ''),
                price=size_data.get('price', 0),
                cost_price=size_data.get('cost_price'),
                quantity=size_data.get('quantity', 0),
                is_default=size_data.get('is_default', 'false').lower() == 'true'
            )
            
            # Handle price tiers for this size
            for key, value in request.data.items():
                if key.startswith(f'price_tiers['):
                    parts = key.split('[')
                    tier_index = int(parts[1].split(']')[0])
                    field = parts[2].split(']')[0]
                    
                    if str(index) == request.data.get(f'price_tiers[{tier_index}][size_index]', [''])[0]:
                        if field == 'min_quantity':
                            min_quantity = value[0] if isinstance(value, list) else value
                        elif field == 'price':
                            price = value[0] if isinstance(value, list) else value
                            ProductPriceTier.objects.create(
                                size=size,
                                min_quantity=min_quantity,
                                price=price
                            )
        
        # Handle main image
        if 'image' in request.FILES:
            main_image = request.FILES['image']
            ProductImage.objects.create(
                product=product,
                image=main_image,
                is_featured=True
            )
        
        # Handle additional images
        additional_images = request.FILES.getlist('additional_images')
        for img in additional_images:
            ProductImage.objects.create(
                product=product,
                image=img
            )

        # Create stock entries for each size
        for size in product.sizes.all():
            Stock.objects.create(
                product=product,
                size=size,
                quantity=size.quantity,
                rate=size.price,
                status='in_stock',
                owner=self.context['request'].user
            )
        
        return product
    
    def update(self, instance, validated_data):
        request = self.context.get('request')

        # === Update basic fields ===
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.short_description = validated_data.get('short_description', instance.short_description)
        instance.brand = validated_data.get('brand', instance.brand)
        instance.category = validated_data.get('category', instance.category)
        instance.subcategory = validated_data.get('subcategory', instance.subcategory)
        instance.status = validated_data.get('status', instance.status)
        instance.is_featured = validated_data.get('is_featured', instance.is_featured)
        instance.save()

        # === Helper to safely parse JSON lists ===
        def parse_json_list(data, default='[]'):
            try:
                return json.loads(data) if isinstance(data, str) else data
            except (json.JSONDecodeError, TypeError):
                return []

        # === Handle tags ===
        tags_data = parse_json_list(request.data.get('tags', '[]'))
        instance.tags.clear()
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
            instance.tags.add(tag)

        # === Handle sizes ===
        sizes = parse_json_list(request.data.get('sizes', '[]'))

        for index, size_data in enumerate(sizes):
            size_id = size_data.get('id')
            is_default = str(size_data.get('is_default', 'false')).lower() == 'true'

            if size_id:
                try:
                    size = ProductSize.objects.get(id=size_id, product=instance)
                    size.size = size_data.get('size', size.size)
                    size.unit = size_data.get('unit', size.unit)
                    size.price = size_data.get('price', size.price)
                    size.cost_price = size_data.get('cost_price', size.cost_price)
                    size.quantity = size_data.get('quantity', size.quantity)
                    size.is_default = is_default
                    size.save()
                except ProductSize.DoesNotExist:
                    continue
            else:
                size = ProductSize.objects.create(
                    product=instance,
                    size=size_data.get('size', ''),
                    unit=size_data.get('unit', ''),
                    price=size_data.get('price', 0),
                    cost_price=size_data.get('cost_price', 0),
                    quantity=size_data.get('quantity', 0),
                    is_default=is_default
                )

            # Clear and re-add price tiers for this size
            ProductPriceTier.objects.filter(size=size).delete()

        # === Handle price tiers ===
        price_tiers = parse_json_list(request.data.get('price_tiers', '[]'))

        for tier in price_tiers:
            size_index = int(tier.get('size_index', -1))
            if 0 <= size_index < len(sizes):
                related_size_data = sizes[size_index]
                try:
                    size = ProductSize.objects.get(product=instance, size=related_size_data.get('size'))
                    ProductPriceTier.objects.create(
                        size=size,
                        min_quantity=tier.get('min_quantity', 0),
                        price=tier.get('price', 0)
                    )
                except ProductSize.DoesNotExist:
                    continue

        # === Handle featured image ===
        if 'image' in request.FILES:
            ProductImage.objects.filter(product=instance, is_featured=True).update(is_featured=False)
            ProductImage.objects.create(
                product=instance,
                image=request.FILES['image'],
                is_featured=True
            )

        # === Handle additional images ===
        for img in request.FILES.getlist('additional_images'):
            ProductImage.objects.create(product=instance, image=img)

        

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
            'rate', 'total_price', 'status', 'expected_date', 'notes',
            'brand_name', 'category_name', 'subcategory_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_price', 'created_at', 'updated_at']
    
    def get_size_display(self, obj):
        if obj.size:
            return f"{obj.size.size}{obj.size.unit}"
        return None
    
    def create(self, validated_data):
        validated_data['total_price'] = validated_data['quantity'] * validated_data['rate']
        return super().create(validated_data)