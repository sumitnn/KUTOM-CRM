from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant, Brand, Category
from django.db import transaction, IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError, APIException
import logging

logger = logging.getLogger(__name__)

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'is_featured']
        read_only_fields = ['slug']

    def validate_name(self, value):
        
        try:
            if len(value) < 2:
                raise ValidationError("Brand name must be at least 2 characters long.")
            return value
        except Exception as e:
            logger.error(f"Brand validation error: {str(e)}")
            raise

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'is_featured']
        read_only_fields = ['slug']

    def validate(self, data):
        try:
            parent = data.get('parent')
            if parent and parent.id == self.instance.id if self.instance else False:
                raise ValidationError("Category cannot be its own parent.")
            return data
        except Exception as e:
            logger.error(f"Category validation error: {str(e)}")
            raise

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'display_order', 'is_featured']
        extra_kwargs = {
            'image': {'required': False}
        }

    def validate_display_order(self, value):
        try:
            if value < 0:
                raise ValidationError("Display order cannot be negative.")
            return value
        except Exception as e:
            logger.error(f"ProductImage validation error: {str(e)}")
            raise

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'name', 'quantity', 'threshold', 
            'price', 'cost_price', 'selling_price', 'mrp',
            'image', 'attributes',  'active'
        ]
        extra_kwargs = {
            'sku': {'required': True},
            'attributes': {'required': True}
        }

    def validate(self, data):
        try:
            # Validate pricing hierarchy
            if all(field in data for field in ['mrp', 'selling_price', 'cost_price']):
                if not (data['mrp'] >= data['selling_price'] >= data['cost_price']):
                    raise ValidationError("Price hierarchy must be: MRP >= Selling Price >= Cost Price")
            return data
        except Exception as e:
            logger.error(f"ProductVariant validation error: {str(e)}")
            raise

class ProductWriteSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False)
    variants = ProductVariantSerializer(many=True, required=False)
    brand = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        required=False,
        allow_null=True
    )
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'brand', 'sku', 'status', 'visibility', 'is_featured',
            'mrp', 'selling_price', 'cost_price', 'discount_type', 'tax',
            'currency', 'stock_quantity', 'stock_status', 'min_order_quantity',
            'max_order_quantity', 'weight', 'length', 'width', 'height',
            'free_shipping', 'shipping_class', 'color_specification',
            'pincode_availability', 'tags', 'images', 'variants'
        ]
        read_only_fields = ['slug', 'average_rating', 'total_reviews']

    def validate(self, data):
        try:
            # Validate pricing consistency
            mrp = data.get('mrp', self.instance.mrp if self.instance else 0)
            selling_price = data.get('selling_price', self.instance.selling_price if self.instance else 0)
            
            if mrp < selling_price:
                raise ValidationError("MRP must be greater than or equal to selling price")

            # Validate stock status
            stock_status = data.get('stock_status', self.instance.stock_status if self.instance else 'in_stock')
            stock_quantity = data.get('stock_quantity', self.instance.stock_quantity if self.instance else 0)
            
            if stock_status == 'in_stock' and stock_quantity <= 0:
                raise ValidationError("Stock status cannot be 'in_stock' with zero quantity")

            # Validate min/max order quantities
            min_qty = data.get('min_order_quantity', self.instance.min_order_quantity if self.instance else 1)
            max_qty = data.get('max_order_quantity', self.instance.max_order_quantity if self.instance else None)
            
            if max_qty is not None and min_qty > max_qty:
                raise ValidationError("Minimum order quantity cannot exceed maximum order quantity")

            return data
        except Exception as e:
            logger.error(f"Product validation error: {str(e)}")
            raise

    @transaction.atomic
    def create(self, validated_data):
        try:
            images_data = validated_data.pop('images', [])
            variants_data = validated_data.pop('variants', [])
            
            product = Product.objects.create(**validated_data)
            
            # Create product images
            for image_data in images_data:
                ProductImage.objects.create(product=product, **image_data)
            
            # Create product variants
            for variant_data in variants_data:
                ProductVariant.objects.create(product=product, **variant_data)
            
            return product

        except IntegrityError as e:
            logger.error(f"Product creation integrity error: {str(e)}")
            raise ValidationError({"detail": "Database integrity error occurred while creating product."})
        
        except Exception as e:
            logger.error(f"Product creation error: {str(e)}")
            raise APIException("An error occurred while creating the product.")

    @transaction.atomic
    def update(self, instance, validated_data):
        try:
            images_data = validated_data.pop('images', None)
            variants_data = validated_data.pop('variants', None)
            
            # Update product fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Handle images update
            if images_data is not None:
                self._update_related_objects(instance, images_data, ProductImage, 'images')
            
            # Handle variants update
            if variants_data is not None:
                self._update_related_objects(
                    instance, 
                    variants_data, 
                    ProductVariant, 
                    'variants',
                    {'product': instance}
                )
            
            return instance

        except IntegrityError as e:
            logger.error(f"Product update integrity error: {str(e)}")
            raise ValidationError({"detail": "Database integrity error occurred while updating product."})
        
        except Exception as e:
            logger.error(f"Product update error: {str(e)}")
            raise APIException("An error occurred while updating the product.")

    def _update_related_objects(self, instance, data, model_class, relation_name, context=None):
        """Helper method to update nested related objects"""
        existing_objects = getattr(instance, relation_name).all()
        kept_objects = []
        
        for obj_data in data:
            if 'id' in obj_data:
                try:
                    obj = existing_objects.get(id=obj_data['id'])
                    serializer_class = globals()[f"{model_class.__name__}Serializer"]
                    serializer = serializer_class(
                        obj, 
                        data=obj_data, 
                        partial=True,
                        context=context or {}
                    )
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    kept_objects.append(obj.id)
                except ObjectDoesNotExist:
                    raise ValidationError(
                        {relation_name: f"{model_class.__name__} with id {obj_data['id']} does not exist"}
                    )
            else:
                create_data = {**obj_data, 'product': instance}
                model_class.objects.create(**create_data)
        
        # Delete objects not included in the request
        for obj in existing_objects:
            if obj.id not in kept_objects:
                obj.delete()

class ProductReadSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        depth = 1

    def to_representation(self, instance):
        try:
            return super().to_representation(instance)
        except Exception as e:
            logger.error(f"Product representation error: {str(e)}")
            raise APIException("An error occurred while processing the product data.")