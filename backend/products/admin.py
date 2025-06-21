from django.contrib import admin
from .models import (
    Brand, Category, SubCategory, Tag, Product,
    ProductSize, ProductImage, ProductPriceTier, Stock
)

# --- Inline Admin Classes ---
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_featured']
    ordering = ['-is_featured']


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1
    fields = ['size', 'unit', 'price', 'is_default']
    show_change_link = True


class ProductPriceTierInline(admin.TabularInline):
    model = ProductPriceTier
    extra = 1
    fields = ['min_quantity', 'price']
    ordering = ['min_quantity']


# --- Model Admin Classes ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'brand', 'status', 'is_featured']
    list_filter = ['status', 'is_featured', 'brand', 'category']
    search_fields = ['name', 'sku', 'description']
    inlines = [ProductImageInline, ProductSizeInline]
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ['tags']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'unit', 'price', 'is_default', 'is_active']
    list_filter = ['is_default', 'is_active']
    inlines = [ProductPriceTierInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt_text', 'is_featured', 'created_at']
    readonly_fields = ['created_at']


@admin.register(ProductPriceTier)
class ProductPriceTierAdmin(admin.ModelAdmin):
    list_display = ['size', 'min_quantity', 'price']
    list_filter = ['size']


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'description', 'owner_email', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']

    def owner_email(self, obj):
        return obj.owner.email if obj.owner else "-"
    owner_email.short_description = "Owner Email"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'product', 'size', 'quantity', 'rate', 'total_price',
        'status', 'owner', 'created_at', 'updated_at'
    )
    list_filter = ('status',)
    search_fields = ('product__name', 'product__brand__name')
    ordering = ('-created_at',)
    readonly_fields = ('total_price', 'created_at', 'updated_at')
