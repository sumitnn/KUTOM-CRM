from django.contrib import admin
from .models import (
    Brand, MainCategory, Category, SubCategory, Tag, ProductFeatures,
    Product, ProductVariant, ProductImage, ProductVariantPrice, ProductVariantBulkPrice,
    RoleBasedProduct, ProductCommission, StockInventory, StockInventoryHistory
)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active', 'created_at')
    ordering = ('-created_at',)


@admin.register(MainCategory)
class MainCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active', 'created_at')
    ordering = ('-created_at',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'main_category', 'owner', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('main_category', 'is_active', 'created_at')


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'owner', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('category', 'brand', 'is_active', 'created_at')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProductFeatures)
class ProductFeaturesAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at')
    search_fields = ('name',)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ('name', 'is_default', 'is_active')


class ProductImageInline(admin.TabularInline):
    model = Product.images.through
    extra = 1
    verbose_name = 'Image'
    verbose_name_plural = 'Images'


class ProductVariantPriceInline(admin.TabularInline):
    model = ProductVariantPrice
    extra = 1
    autocomplete_fields = ('variant', 'user')
    show_change_link = True


class ProductBulkPriceInline(admin.TabularInline):
    model = ProductVariantBulkPrice
    extra = 1
    autocomplete_fields = ('variant',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'brand', 'category', 'subcategory', 'status', 'is_active', 'created_at')
    search_fields = ('name', 'sku')
    list_filter = ('brand', 'category', 'subcategory', 'status', 'is_active', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline, ProductVariantPriceInline, ProductBulkPriceInline, ProductImageInline]
    filter_horizontal = ('tags', 'features')
    readonly_fields = ('sku',)
    
    # Optimize queryset to reduce database queries
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'brand', 'category', 'subcategory'
        ).prefetch_related('tags', 'features')


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'product', 'is_default', 'is_active', 'created_at')
    search_fields = ('name', 'sku', 'product__name')
    list_filter = ('is_active', 'is_default', 'created_at')
    readonly_fields = ('sku',)
    
    # Optimize queryset
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'image_preview', 'alt_text', 'is_featured', 'is_default', 'created_at')
    search_fields = ('alt_text',)
    list_filter = ('is_featured', 'is_default', 'created_at')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-height: 50px; max-width: 50px;" />'
        return "No Image"
    image_preview.allow_tags = True
    image_preview.short_description = 'Preview'


@admin.register(ProductVariantPrice)
class ProductVariantPriceAdmin(admin.ModelAdmin):
    list_display = ('product', 'variant', 'user', 'role', 'price', 'discount', 'gst_percentage', 'actual_price')
    search_fields = ('product__name', 'variant__name', 'user__username')
    list_filter = ('role', 'user')
    
    # Optimize queryset
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'variant', 'user')


@admin.register(ProductVariantBulkPrice)
class ProductVariantBulkPriceAdmin(admin.ModelAdmin):
    list_display = ('product', 'variant', 'max_quantity', 'price', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('product__name', 'variant__name')
    
    # Optimize queryset
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'variant')


# ---------- Role Based Products ----------

class RoleBasedProductVariantInline(admin.TabularInline):
    model = RoleBasedProduct.variants.through
    extra = 1
    verbose_name = 'Variant'
    verbose_name_plural = 'Variants'


@admin.register(RoleBasedProduct)
class RoleBasedProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'role', 'price', 'is_featured', 'created_at')
    list_filter = ('role', 'is_featured', 'created_at')
    search_fields = ('product__name', 'user__username')
    inlines = [RoleBasedProductVariantInline]
    
    # Only show price field for roles that need it
    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if obj and obj.role in ['vendor', 'admin']:
            # Remove price field for vendor and admin roles
            return [field for field in fields if field != 'price']
        return fields
    
    # Optimize queryset
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'user')


@admin.register(ProductCommission)
class ProductCommissionAdmin(admin.ModelAdmin):
    list_display = (
        'get_product_name', 'commission_type',
        'reseller_commission_value', 'stockist_commission_value',
        'admin_commission_value', 'updated_at'
    )
    search_fields = ('role_product__product__name',)
    list_filter = ('commission_type',)
    
    def get_product_name(self, obj):
        return obj.role_product.product.name
    get_product_name.short_description = 'Product'
    
    # Optimize queryset
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('role_product__product')


class StockInventoryHistoryInline(admin.TabularInline):
    model = StockInventoryHistory
    extra = 0
    readonly_fields = (
        "old_quantity",
        "change_quantity",
        "new_quantity",
        "action",
        "reference_id",
        "created_at",
    )
    can_delete = False
    show_change_link = True

@admin.register(StockInventory)
class StockInventoryAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "variant",
        "user",
        "total_quantity",
        "created_at",
        "updated_at",
    )
    list_filter = ("product", "variant", "user", "created_at", "updated_at")
    search_fields = ("product__name", "variant__name", "user__username")
    inlines = [StockInventoryHistoryInline]
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-updated_at",)

@admin.register(StockInventoryHistory)
class StockInventoryHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "stock_inventory",
        "user",
        "old_quantity",
        "change_quantity",
        "new_quantity",
        "action",
        "reference_id",
        "created_at",
    )
    list_filter = ("action", "user", "created_at")
    search_fields = (
        "stock_inventory__product__name",
        "stock_inventory__variant__name",
        "user__username",
        "reference_id",
    )
    readonly_fields = (
        "stock_inventory",
        "user",
        "old_quantity",
        "change_quantity",
        "new_quantity",
        "action",
        "reference_id",
        "created_at",
    )
    ordering = ("-created_at",)