
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
        fields = [
            'id', 'sku', 'name', 'price', 'quantity', 
            'attributes', 'is_default', 'in_stock', 'low_stock'
        ]
        read_only_fields = ['sku']


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)
    images = ProductImageSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'description', 'price', 'owner', 'variants', 'images', 'tags', 'brand']
        read_only_fields = ['owner', 'sku']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        # Create main product
        product = Product.objects.create(
            owner=user,
            name=validated_data.get('name'),
            description=validated_data.get('description', ''),
            price=validated_data.get('price', 0),
            brand=validated_data.get('brand', '')
        )

        # Handle main product image
        main_image = request.FILES.get('image')
        if main_image:
            ProductImage.objects.create(
                product=product,
                image=main_image,
                is_featured=True
            )

        # Handle variants
        variants_data = []
        index = 0
        while True:
            variant_data = {
                'name': request.data.get(f'variants[{index}][name]'),
                'price': request.data.get(f'variants[{index}][price]'),
                'quantity': request.data.get(f'variants[{index}][quantity]'),
                'attributes': {
                    'other': request.data.get(f'variants[{index}][other]', '')
                }
            }
            
            if not variant_data['name']:
                break
                
            variant_image = request.FILES.get(f'variants[{index}][image]')
            
            # Create variant
            variant = ProductVariant.objects.create(
                product=product,
                name=variant_data['name'],
                price=variant_data['price'] or product.price,
                quantity=variant_data['quantity'] or 0,
                attributes=variant_data['attributes'],
                is_default=(index == 0)  # First variant is default
            )
            
            # Create variant image if exists
            if variant_image:
                ProductImage.objects.create(
                    product=product,
                    variant=variant,
                    image=variant_image
                )
            
            index += 1

        # Handle tags
        tags = request.data.get('tags', '')
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            for tag_name in tag_list:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                product.tags.add(tag)

        return product