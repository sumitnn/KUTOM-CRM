from rest_framework import serializers
from .models import *
from django.utils.text import slugify
import json
from collections import defaultdict
from rest_framework.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from .utils import *
from accounts.utils import create_notification


class BrandSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "is_active", "description", "created_at", "updated_at", "owner"]
        read_only_fields = ["created_at", "updated_at", "owner"]

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
    main_category_name = serializers.CharField(source='main_category.name', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'main_category', 'main_category_name', 'is_active', 'created_at', 'updated_at', "owner"]
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
            'is_active', 'created_at', 'updated_at', "owner"
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


class ProductFeaturesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFeatures
        fields = "__all__"


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = "__all__"
        read_only_fields = ['created_at']


class ProductVariantBulkPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariantBulkPrice
        fields = ["id", "max_quantity", "price","discount" ,"gst_percentage","final_price","created_at", "updated_at"]


class ProductVariantPriceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    total_available_quantity = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ProductVariantPrice
        fields = [
            "id", "user", "user_name", "role", "role_display", "price", "discount",
            "gst_percentage", "gst_tax", "actual_price","stockist_price","reseller_price","total_available_quantity",
            "reseller_gst","reseller_discount","stockist_gst","stockist_discount","stockist_actual_price","reseller_actual_price",
        ]
    def get_total_available_quantity(self, obj):
        from .models import StockInventory  # avoid circular import
        try:
            inventory = StockInventory.objects.get(
                product=obj.product,
                variant=obj.variant,
                user=obj.user
            )
            return inventory.total_quantity
        except StockInventory.DoesNotExist:
            return 0


class ProductVariantSerializer(serializers.ModelSerializer):
    product_variant_prices = serializers.SerializerMethodField()
    bulk_prices = serializers.SerializerMethodField()  # changed to method

    class Meta:
        model = ProductVariant
        fields = [
            "id", "name", "sku", "is_default", "is_active",
            "created_at", "updated_at", "product_variant_prices", "bulk_prices"
        ]
        read_only_fields = ['sku']

    def get_product_variant_prices(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return []

        user = request.user
        user_role = getattr(user, "role", None)

        if user_role in ["stockist", "reseller"]:
            # ✅ For stockists & resellers → show admin-set prices only
            queryset = obj.prices.filter(user__role="admin")
        elif user_role == "admin":
            queryset = obj.prices.filter(user__role="vendor")
        else:
            # ✅ For others → show prices set by themselves
            queryset = obj.prices.filter(user=user)

        return ProductVariantPriceSerializer(queryset, many=True, context=self.context).data

    def get_bulk_prices(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return []

        user_role = getattr(request.user, "role", None)

        if user_role in ["stockist", "reseller"]:
            # ❌ Hide bulk prices
            return []
        else:
            # ✅ Show bulk prices for others
            return ProductVariantBulkPriceSerializer(obj.bulk_prices.all(), many=True, context=self.context).data



class ADMINNEWProductVariantSerializer(serializers.ModelSerializer):
    product_variant_prices = serializers.SerializerMethodField()


    class Meta:
        model = ProductVariant
        fields = [
            "id", "name", "sku", "is_default", "is_active",
            "created_at", "updated_at", "product_variant_prices"
        ]
        read_only_fields = ['sku']

    def get_product_variant_prices(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return []

        user = request.user
        user_role = getattr(user, "role", None)
        prices_qs = obj.prices.all()

        queryset = prices_qs.none()

        if user_role in ["stockist", "reseller"]:
            # ✅ Show admin prices only (fallback to vendor if missing)
            queryset = prices_qs.filter(user__role="admin")
            if not queryset.exists():
                queryset = prices_qs.filter(user__role="vendor")

        elif user_role == "admin":
            # ✅ Admin → prefer admin, fallback to vendor
            queryset = prices_qs.filter(user__role="admin")
            if not queryset.exists():
                queryset = prices_qs.filter(user__role="vendor")

        else:
            # ✅ Vendor or others → show own prices, fallback to admin/vendor
            queryset = prices_qs.filter(user=user)
            if not queryset.exists():
                queryset = prices_qs.filter(user__role__in=["admin", "vendor"])

        return ProductVariantPriceSerializer(queryset, many=True, context=self.context).data

class ProductSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(
        many=True,
        slug_field="name",
        queryset=Tag.objects.all(),
        required=False
    )
    features = serializers.SlugRelatedField(
        many=True,
        slug_field="name",
        queryset=ProductFeatures.objects.all(),
        required=False
    )
    # variants = ProductVariantSerializer(many=True, required=False, read_only=True)
    images = ProductImageSerializer(many=True, required=False, read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    subcategory_name = serializers.CharField(source="subcategory.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "sku", "name", "slug", "description", "short_description",
            "brand", "brand_name", "category", "category_name", 
            "subcategory", "subcategory_name", "tags", "features", 
            "images", "variants", "is_active", "status", "status_display",
            "rating", "currency", "weight", "weight_unit", "dimensions", 
            "product_type", "product_type_display", "video_url", "warranty",
            "created_at", "updated_at"
        ]
        read_only_fields = ['sku', 'slug']


class RoleBasedProductSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    variants_detail = ProductVariantSerializer(source='variants', many=True, read_only=True)
    variant_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ProductVariant.objects.all(),
        source='variants',
        write_only=True,
        required=False
    )
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_unique_id = serializers.CharField(source='user.unique_role_id', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = RoleBasedProduct
        fields = [
            'id', 'product', 'product_id', 'product_detail', 'user', 'user_name',
            'role', 'role_display', 'variants', 'variant_ids', 'variants_detail',
            'is_featured', 'price', 'created_at', 'updated_at','user_unique_id'
        ]
        read_only_fields = ['user','user_unique_id']

    def validate(self, data):
        # Validate price based on role
        role = data.get('role', self.instance.role if self.instance else None)
        price = data.get('price')
        
        if role in ['stockist', 'reseller'] and price is None:
            raise serializers.ValidationError(f"Price is required for {role} role")
        
        if role in ['admin', 'vendor'] and price is not None:
            data['price'] = None  # Remove price for roles that don't need it
            
        return data


class StockInventorySerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = StockInventory
        fields = [
            "id", "product", "variant", "variant_name", "user", "user_name",
            "total_quantity", "notes", "created_at", "updated_at"
        ]


class ProductCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCommission
        fields = [
            "id", "commission_type",
            "reseller_commission_value",
            "stockist_commission_value",
            "admin_commission_value",
            "updated_at"
        ]


class ADMINRoleBasedProductSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)
    inventories = serializers.SerializerMethodField()
    commission = serializers.SerializerMethodField()
    variants_detail = ADMINNEWProductVariantSerializer(source='variants', many=True, read_only=True)

    class Meta:
        model = RoleBasedProduct
        fields = [
            "id", "product_detail", "user",
            "is_featured", "price",
            "inventories", "commission",
            "created_at", "updated_at","variants_detail"
        ]
        read_only_fields = ["user"]

    def get_inventories(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return []

        user = request.user
        user_role = getattr(user, "role", None)

        if user_role in ["stockist", "reseller"]:
            admin_user= User.objects.filter(role="admin").first()
            # ✅ Stockist & Reseller → show inventories from admin
            queryset = obj.product.inventories.filter(user=admin_user)
        else:
            # ✅ Others → show their own inventories
            queryset = obj.product.inventories.filter(user=user)

        return StockInventorySerializer(queryset, many=True, context=self.context).data

    def get_commission(self, obj):
        """
        Returns all commission records (variant-wise) linked to this RoleBasedProduct.
        """
        commissions = ProductCommission.objects.filter(role_product=obj).select_related('variant')

        if commissions.exists():
            return ProductCommissionSerializer(commissions, many=True, context=self.context).data
        return []


    

class ProductCommissionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='role_product.product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    commission_type_display = serializers.CharField(source='get_commission_type_display', read_only=True)

    class Meta:
        model = ProductCommission
        fields = [
            'id',
            'role_product',
            'product_name',
            'variant',
            'variant_name',
            'commission_type',
            'commission_type_display',
            'reseller_commission_value',
            'stockist_commission_value',
            'admin_commission_value',
            'updated_at',
        ]


class ProductDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku']


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "phone", "unique_role_id"]


# ---------------------------
# Product Create Serializer
# ---------------------------
class ProductCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    features = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    sizes = serializers.ListField(write_only=True, required=False)
    price_tiers = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "short_description", "brand", "category",
            "subcategory", "tags", "features", "currency", "weight", "weight_unit",
            "dimensions", "product_type", "video_url", "warranty", "status",
            "sizes", "price_tiers"
        ]

    def to_internal_value(self, data):
        """Parse JSON-like strings from frontend QueryDict."""
        def parse_json_field(field):
            raw_value = data.get(field)
            if isinstance(raw_value, list) and raw_value:
                raw_value = raw_value[0]
            if isinstance(raw_value, str) and raw_value.startswith("["):
                try:
                    return json.loads(raw_value)
                except json.JSONDecodeError:
                    return []
            return raw_value or []

        data = super().to_internal_value(data)
        data["tags"] = [str(t) for t in parse_json_field("tags")]
        data["features"] = [str(f) for f in parse_json_field("features")]
        data["sizes"] = parse_json_field("sizes")
        data["price_tiers"] = parse_json_field("price_tiers")

        # normalize frontend "sizeIndex" → "variantIndex"
        for tier in data.get("price_tiers", []):
            if "sizeIndex" in tier and "variantIndex" not in tier:
                tier["variantIndex"] = tier.pop("sizeIndex")

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
       

        tags_data = validated_data.pop("tags", [])
        features_data = validated_data.pop("features", [])
        sizes_data = validated_data.pop("sizes", [])
        price_tiers_data = validated_data.pop("price_tiers", [])
        
        print(sizes_data)
        

        # create product
        product = Product.objects.create(owner=user,**validated_data)
        # 🔹 Handle tags safely
        for tag_name in tags_data:
            tag_name = tag_name.strip()
            tag_slug = slugify(tag_name)

            try:
                tag, _ = Tag.objects.get_or_create(
                    slug=tag_slug,
                    defaults={"name": tag_name, "owner": user}
                )
            except IntegrityError:
                # In case of a race condition or slug conflict
                tag = Tag.objects.filter(slug=tag_slug).first()

            if tag:
                product.tags.add(tag)

        # 🔹 Handle features safely
        for feature_name in features_data:
            feature_name = feature_name.strip()
           

            try:
                feature, _ = ProductFeatures.objects.get_or_create(
                    name=feature_name,
                    defaults={ "owner": user}
                )
            except IntegrityError:
                feature = ProductFeatures.objects.filter(name=feature_name).first()

            if feature:
                product.features.add(feature)

        # images
        
        for idx, f in enumerate(request.FILES.getlist("image")):
            img_obj = ProductImage.objects.create(
                image=f,
                alt_text=f"{product.name} image {idx + 1}",
                is_featured=(idx == 0),
                is_default=(idx == 0),
            )
            product.images.add(img_obj)
            break  # Only the first image is treated as main image
            
        images_to_add = []
        for idx, f in enumerate(request.FILES.getlist("additional_images")):
            img_obj = ProductImage.objects.create(
                image=f,
                alt_text=f"{product.name} additional image {idx + 1}",
                is_featured=False,
                is_default=False,
            )
            images_to_add.append(img_obj)

        if images_to_add:
            product.images.add(*images_to_add)

        # variants
        variant_objects = []
        for idx, size in enumerate(sizes_data):
            variant = ProductVariant.objects.create(
                product=product,
                name=size.get("size") or f"Variant {idx+1}",
                is_default=(idx == 0),
                is_active=True,
            )
            variant_objects.append(variant)

            ProductVariantPrice.objects.create(
                product=product,
                variant=variant,
                user=user,
                price=Decimal(size.get("price") or 0),
                role=user.role,
                discount=int(size.get("discount_percentage") or 0),
                gst_percentage=int(size.get("gst_percentage") or 0),
            )

            for tier in price_tiers_data:
                if tier.get("variantIndex") == idx:
                    qty = int(tier.get("min_quantity") or tier.get("max_quantity") or 0)
                    ProductVariantBulkPrice.objects.create(
                        product=product,
                        variant=variant,
                        max_quantity=qty,
                        price=Decimal(tier.get("price") or 0),
                        gst_percentage=int(tier.get("gst_percentage") or 0),
                        discount=int(tier.get("discount_percentage") or 0),
                    )

        # role-based product
        role_based_product = RoleBasedProduct.objects.create(
            product=product,
            user=user,
            role=user.role,
            is_featured=False,
        )
        if variant_objects:
            role_based_product.variants.set(variant_objects)

        return product
    

class ProductUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    features = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    sizes = serializers.ListField(write_only=True, required=False)
    price_tiers = serializers.ListField(write_only=True, required=False)
    removed_images = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "short_description", "brand", "category",
            "subcategory", "tags", "features", "currency", "weight", "weight_unit",
            "dimensions", "product_type", "video_url", "warranty", "status",
            "sizes", "price_tiers", "removed_images"
        ]

    def to_internal_value(self, data):
        """Parse JSON-like strings from frontend QueryDict."""
        def parse_json_field(field):
            raw_value = data.get(field)
            if isinstance(raw_value, list) and raw_value:
                raw_value = raw_value[0]
            if isinstance(raw_value, str) and raw_value.startswith("["):
                try:
                    return json.loads(raw_value)
                except json.JSONDecodeError:
                    return []
            return raw_value or []

        data = super().to_internal_value(data)
        data["tags"] = [str(t) for t in parse_json_field("tags")]
        data["features"] = [str(f) for f in parse_json_field("features")]
        data["sizes"] = parse_json_field("sizes")
        data["price_tiers"] = parse_json_field("price_tiers")
        data["removed_images"] = parse_json_field("removed_images")

        # normalize frontend "sizeIndex" → "variantIndex"
        for tier in data.get("price_tiers", []):
            if "sizeIndex" in tier and "variantIndex" not in tier:
                tier["variantIndex"] = tier.pop("sizeIndex")

        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        request = self.context["request"]
        user = request.user

        # Extract nested data
        tags_data = validated_data.pop("tags", [])
        features_data = validated_data.pop("features", [])
        sizes_data = validated_data.pop("sizes", [])
        price_tiers_data = validated_data.pop("price_tiers", [])
        removed_images_data = validated_data.pop("removed_images", [])

        # Non-admins force product to draft
        if user.role != "admin":
            validated_data["status"] = "draft"

        # Update base product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 🔹 Handle removed images
        if removed_images_data:
            if not isinstance(removed_images_data, list):
                removed_images_data = [removed_images_data]
            removed_images_data = [int(i) for i in removed_images_data if str(i).isdigit()]
            ProductImage.objects.filter(id__in=removed_images_data).delete()

        # 🔹 Update Tags
        instance.tags.clear()
        for tag_name in tags_data:
            tag_name = tag_name.strip()
            tag_slug = slugify(tag_name)
            try:
                tag, _ = Tag.objects.get_or_create(
                    slug=tag_slug,
                    defaults={"name": tag_name, "owner": user}
                )
            except IntegrityError:
                tag = Tag.objects.filter(slug=tag_slug).first()
            if tag:
                instance.tags.add(tag)

        # 🔹 Update Features
        instance.features.clear()
        for feature_name in features_data:
            feature_name = feature_name.strip()
            try:
                feature, _ = ProductFeatures.objects.get_or_create(
                    name=feature_name,
                    defaults={"owner": user}
                )
            except IntegrityError:
                feature = ProductFeatures.objects.filter(name=feature_name).first()
            if feature:
                instance.features.add(feature)

        # 🔹 Handle Main Image
        if "image" in request.FILES:
            # remove old featured image
            instance.images.filter(is_featured=True).delete()

            img_obj = ProductImage.objects.create(
                image=request.FILES["image"],
                alt_text=f"{instance.name} main image",
                is_featured=True,
                is_default=True,
            )
            instance.images.add(img_obj)

        # 🔹 Handle Additional Images
        for idx, f in enumerate(request.FILES.getlist("additional_images")):
            img_obj = ProductImage.objects.create(
                image=f,
                alt_text=f"{instance.name} additional image {idx + 1}",
                is_featured=False,
                is_default=False,
            )
            instance.images.add(img_obj)

        # 🔹 Handle Variants (Update, Create, Delete)
        existing_variant_ids = [size.get("id") for size in sizes_data if size.get("id")]
        instance.variants.exclude(id__in=existing_variant_ids).delete()

        variant_objects = []

        for idx, size in enumerate(sizes_data):
            variant_id = size.get("id")
            if variant_id:
                # Update existing variant
                variant = ProductVariant.objects.get(id=variant_id, product=instance)
                variant.name = size.get("size") or f"Variant {idx + 1}"
                variant.is_default = size.get("is_default", False)
                variant.is_active = True
                variant.save()
            else:
                # Create new variant
                variant = ProductVariant.objects.create(
                    product=instance,
                    name=size.get("size") or f"Variant {idx + 1}",
                    is_default=size.get("is_default", (idx == 0)),
                    is_active=True,
                )

            variant_objects.append(variant)

            # 🔸 Update or Create ProductVariantPrice
            price_data = {
                "price": Decimal(size.get("price") or 0),
                "discount": int(size.get("discount_percentage") or 0),
                "gst_percentage": int(size.get("gst_percentage") or 0),
            }

            price_obj = ProductVariantPrice.objects.filter(variant=variant).first()
            if price_obj:
                for attr, value in price_data.items():
                    setattr(price_obj, attr, value)
                price_obj.save()
            else:
                ProductVariantPrice.objects.create(
                    product=instance,
                    variant=variant,
                    user=user,
                    role=user.role,
                    **price_data,
                )

            # 🔸 Handle Bulk Prices (Price Tiers)
            ProductVariantBulkPrice.objects.filter(variant=variant).delete()
            variant_tiers = [
                tier for tier in price_tiers_data
                if tier.get("variantIndex") == idx or tier.get("sizeId") == variant_id
            ]

            for tier in variant_tiers:
                qty = int(tier.get("min_quantity") or tier.get("max_quantity") or 0)
                ProductVariantBulkPrice.objects.create(
                    product=instance,
                    variant=variant,
                    max_quantity=qty,
                    price=Decimal(tier.get("price") or 0),
                    gst_percentage=int(tier.get("gst_percentage") or 0),
                    discount=int(tier.get("discount_percentage") or 0),
                )

        # 🔹 Handle RoleBasedProduct
        product_owner = getattr(instance, "owner", user)
        role_based_product = RoleBasedProduct.objects.filter(
            product=instance, user=product_owner
        ).first()

        if not role_based_product:
            role_based_product = RoleBasedProduct.objects.create(
                product=instance,
                user=product_owner,
                role=product_owner.role,
                is_featured=True,
            )

        if variant_objects:
            role_based_product.variants.set(variant_objects)

        return instance
# ---------------------------
# Inventory Serializers
# ---------------------------
class StockInventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    brand_name = serializers.CharField(source='product.brand.name', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='product.subcategory.name', read_only=True)
    last_history = serializers.SerializerMethodField()
    
    class Meta:
        model = StockInventory
        fields = [
            'id',
            'product', 'product_name',
            'variant', 'variant_name',
            'user', 'user_name',
            'total_quantity', 'notes',
            'created_at', 'updated_at',
            'brand_name', 'category_name', 'subcategory_name',
            'last_history', 'manufacture_date', 'expiry_date', 'batch_number'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'last_history']

    def get_last_history(self, obj):
        last = obj.history.order_by('-created_at').first()
        if last:
            return StockInventoryHistorySerializer(last).data
        return None
    
    def validate(self, data):
        """
        Validate that expiry_date is after manufacture_date
        """
        manufacture_date = data.get('manufacture_date')
        expiry_date = data.get('expiry_date')
        
        if manufacture_date and expiry_date:
            if expiry_date <= manufacture_date:
                raise serializers.ValidationError({
                    'expiry_date': 'Expiry date must be after manufacture date.'
                })
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        product = validated_data['product']
        variant = validated_data.get('variant', None)
        change_quantity = validated_data.pop('total_quantity', 0)
        notes = validated_data.get('notes', '')
        manufacture_date = validated_data.get('manufacture_date')
        expiry_date = validated_data.get('expiry_date')
        batch_number = validated_data.get('batch_number')

        # Check if stock already exists for this product-variant-batch combination
        existing_stock = StockInventory.objects.filter(
            user=user,
            product=product,
            variant=variant,
            batch_number=batch_number
        ).first()

        if existing_stock:
            raise ValidationError(
                f"Stock for product '{product.name}', variant '{variant.name if variant else 'N/A'}' "
                f"and batch '{batch_number}' already exists for this user."
            )

        # Create the StockInventory record
        stock_inventory = StockInventory.objects.create(
            user=user,
            product=product,
            variant=variant,
            notes=notes,
            manufacture_date=manufacture_date,
            expiry_date=expiry_date,
            batch_number=batch_number,
            total_quantity=0  # Start with 0, will be adjusted below
        )
        
        # Adjust stock using the method
        if change_quantity > 0:
            stock_inventory.adjust_stock(change_quantity=change_quantity, action="ADD")

        return stock_inventory
    
    def update(self, instance, validated_data):
        """
        Update stock record:
        - Adjust total_quantity if provided
        - Update notes if provided
        - Update batch information if provided
        - Create a StockInventoryHistory entry via adjust_stock
        """
        change_quantity = validated_data.pop('total_quantity', None)
        notes = validated_data.get('notes', None)
        manufacture_date = validated_data.get('manufacture_date', None)
        expiry_date = validated_data.get('expiry_date', None)
        batch_number = validated_data.get('batch_number', None)

        
        # Update batch information if provided
        update_fields = []
        if manufacture_date is not None:
            instance.manufacture_date = manufacture_date
            update_fields.append('manufacture_date')
        
        if expiry_date is not None:
            instance.expiry_date = expiry_date
            update_fields.append('expiry_date')
        
        
        
        if notes is not None:
            instance.notes = notes
            update_fields.append('notes')
        
        if instance.user.role =="vendor" and instance.batch_number !=batch_number:
            
            ExpiryTracker.objects.filter(stock_item=instance,user=instance.user,batch_number=instance.batch_number).delete()
            
                
        if batch_number is not None:
            instance.batch_number = batch_number
            update_fields.append('batch_number')

        # Save batch information updates
        if update_fields:
            instance.save(update_fields=update_fields)

        # Adjust stock quantity if provided and create history
        if change_quantity is not None:
            # Calculate the difference between new quantity and current quantity
            quantity_difference = change_quantity - instance.total_quantity
            
            if quantity_difference != 0:
                action = "ADD" if quantity_difference > 0 else "ADJUST"
                instance.adjust_stock(
                    change_quantity=abs(quantity_difference), 
                    action=action
                )

        return instance


class StockInventoryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StockInventoryHistory
        fields = ['old_quantity', 'change_quantity', 'new_quantity', 'action', 'created_at']

class ProductVariantMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name"]
        read_only_fields = ["id", "name"]








class RequestImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestImage
        fields = ['id', 'image', 'uploaded_at']

class StockTransferRequestSerializer(serializers.ModelSerializer):
    images = RequestImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    # 🔹 Extra read-only fields for frontend list
    product_name = serializers.CharField(source="product.name", read_only=True)
    brand_name = serializers.CharField(source="product.brand.name", read_only=True)
    category_name = serializers.CharField(source="product.category.name", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True)

    class Meta:
        model = StockTransferRequest
        fields = [
            'id', 'request_id', 'request_type', 'status',
            'raised_by', 'raised_to', 'quantity',
            'batch_number', 'reason', 'description',
            'expiry_date', 'remaining_days',
            'original_stock_deducted', 'replacement_stock_added',
            'created_at', 'updated_at', 'completed_at',
            'images', 'uploaded_images',
            'product', 'variant',
            # ✅ New fields for listing
            'product_name', 'brand_name', 'category_name', 'variant_name','admin_notes','user_notes','approved_date',
            'delivery_date','tracking_number','courier_name','delivery_note','new_batch_number'
        ]
        read_only_fields = [
            'request_id', 'status', 'created_at', 'updated_at', 'completed_at',
            'original_stock_deducted', 'replacement_stock_added', 'raised_by','admin_notes','user_notes','approved_date'
        ]

    # -------------------------------------
    # Validation logic for request_type
    # -------------------------------------
    def validate(self, attrs):
        request = self.context.get('request')
        reason = self.initial_data.get('reason', '').lower()

        # If already provided, respect frontend value
        if attrs.get('request_type'):
            return attrs

        # Determine base type from reason
        if "expired" in reason:
            attrs['request_type'] = (
                'admin_expiry' if getattr(request.user, 'role', None) == "admin" else 'reseller_expiry'
            )
        elif "damaged" in reason:
            attrs['request_type'] = (
                'admin_damaged' if getattr(request.user, 'role', None) == "admin" else 'reseller_damaged'
            )
        elif "defective" in reason:
            attrs['request_type'] = (
                'admin_defective' if getattr(request.user, 'role', None) == "admin" else 'reseller_defective'
            )
        elif "incorrect" in reason:
            attrs['request_type'] = (
                'admin_incorrect' if getattr(request.user, 'role', None) == "admin" else 'reseller_incorrect'
            )
        else:
            attrs['request_type'] = (
                'admin_damaged' if getattr(request.user, 'role', None) == "admin" else 'reseller_damaged'
            )
        return attrs

    # -------------------------------------
    # Create logic
    # -------------------------------------
    def create(self, validated_data):
        request = self.context['request']

        # ✅ collect uploaded files
        uploaded_images = []
        for key in request.FILES:
            if key.startswith('images'):
                uploaded_images.extend(request.FILES.getlist(key))

        tracker_id = request.data.get('tracker_id')

        # ✅ auto-assign raised_by
        validated_data['raised_by'] = request.user

        # ✅ determine raised_to
        if getattr(request.user, 'role', None) == 'admin':
            product = validated_data.get('product')
            if product and hasattr(product, 'owner'):
                validated_data['raised_to'] = product.owner
            else:
                raise serializers.ValidationError("Product owner not found for admin request.")
        else:
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                raise serializers.ValidationError("Admin user not found.")
            validated_data['raised_to'] = admin_user

        # ✅ mark expiry tracker resolved
        if tracker_id:
            tracker = ExpiryTracker.objects.filter(id=tracker_id).first()
            if tracker:
                tracker.is_resolved = True
                tracker.save(update_fields=['is_resolved'])

        # ✅ deduct stock from inventory
        stock_qs = StockInventory.objects.get(product_id=validated_data.get("product"), variant_id=validated_data.get("variant"), batch_number=validated_data.get("batch_number"), user=request.user)

        if not stock_qs.total_quantity >= validated_data.get("quantity"):
            raise serializers.ValidationError("Insufficient stock available for the requested return/replacement.")

        stock_qs.adjust_stock(
                change_quantity=-validated_data.get("quantity"),
                action="REPLACEMENT_STOCK_DEDUCTED",
                reference_id=f"",
            )
        
        validated_data['original_stock_deducted'] = True
        # ✅ create request
        stock_request = super().create(validated_data)

        # ✅ notify
        create_notification(
            user=validated_data['raised_to'],
            title="New Return/Replacement Request" if validated_data['reason']=="expired" else "New Damaged/Defective/Incorrect Request",
            message=f"A new return/replacement request has been raised for product '{stock_request.product.name}'.",
            notification_type="returnproduct",
            related_url=f""
        )

        # ✅ attach uploaded images
        for img in uploaded_images:
            RequestImage.objects.create(transfer_request=stock_request, image=img)

        return stock_request


class ExpiredProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'brand_name', 'category_name'] # include any extra fields you want


class ExpiredProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'sku']  


class ExpiredStockInventorySerializer(serializers.ModelSerializer):
    product = ExpiredProductSerializer(read_only=True)
    variant = ExpiredProductVariantSerializer(read_only=True)

    class Meta:
        model = StockInventory
        fields = [
            'id', 'product', 'variant', 'user', 'total_quantity',
            'batch_number', 'manufacture_date', 'expiry_date',
            'is_expired', 'notes', 'created_at', 'updated_at'
        ]

from datetime import date
class ExpiryTrackerSerializer(serializers.ModelSerializer):
    stock_item = ExpiredStockInventorySerializer(read_only=True)
    remaining_days = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()  # dynamically computed

    class Meta:
        model = ExpiryTracker
        fields = [
            'id', 'stock_item', 'user', 'batch_number', 'expiry_date',
            'remaining_days', 'status', 'can_request_return',
            'created_at', 'updated_at', 'stock_quantity', 'is_resolved'
        ]

    def get_remaining_days(self, obj):
        """Calculate how many days remain until expiry."""
        if not obj.expiry_date:
            return None

        today = date.today()
        return (obj.expiry_date - today).days

    def get_status(self, obj):
        """Determine expiry status based on remaining days."""
        if not obj.expiry_date:
            return None

        today = date.today()
        days_remaining = (obj.expiry_date - today).days

        if days_remaining < 0:
            return 'expired'
        elif 1 <= days_remaining <= 15:
            return 'critical'
        elif 16 <= days_remaining <= 30:
            return 'expiring_soon'
        else:
            return 'active'