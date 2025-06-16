from django.contrib import admin
from .models import (
    Brand, Category, Product, ProductSize,
    ProductImage, Tag, ProductSubCategory,
    ProductPricing, Notification
)

# --- Inlines ---

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'display_order', 'is_featured']
    ordering = ['display_order']


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1
    fields = ['sku', 'name', 'size', 'unit', 'quantity', 'threshold', 'is_default']
    show_change_link = True


class ProductPricingInline(admin.TabularInline):
    model = ProductPricing
    extra = 1
    fields = ['quantity', 'price']
    ordering = ['quantity']

# --- Admins ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'owner', 'active', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'sku', 'description', 'brand_name']
    inlines = [ProductImageInline, ProductSizeInline, ProductPricingInline]
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['tags', 'category']
    filter_horizontal = ['tags', 'subcategories']
    ordering = ['-created_at']


@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ['sku', 'name', 'product', 'size', 'unit', 'quantity', 'is_default', 'active']
    list_filter = ['active', 'is_default']
    search_fields = ['sku', 'name', 'product__name', 'size', 'unit']
    autocomplete_fields = ['product']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'image', 'display_order', 'is_featured']
    list_filter = ['is_featured']
    search_fields = ['product__name', 'alt_text']
    ordering = ['product', 'display_order']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(ProductSubCategory)
class ProductSubCategoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'subcategory']
    search_fields = ['product__name', 'subcategory__name']
    autocomplete_fields = ['product', 'subcategory']
    list_filter = ['subcategory']


@admin.register(ProductPricing)
class ProductPricingAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity', 'price']
    search_fields = ['product__name']
    list_filter = ['product']
    ordering = ['product', 'quantity']
    autocomplete_fields = ['product']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'message_preview', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'message', 'notification_type']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def message_preview(self, obj):
        return obj.message[:50] + ('...' if len(obj.message) > 50 else '')
    message_preview.short_description = 'Message'


# --- Category Admin ---
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'parent', 'display_order']
    search_fields = ['name']
    list_filter = ['parent']
    ordering = ['display_order', 'name']
    autocomplete_fields = ['parent']


# --- Brand Admin ---
class BrandAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'is_featured']
    search_fields = ['name']
    list_filter = ['is_featured']


# --- Register non-decorated models ---
admin.site.register(Brand, BrandAdmin)
admin.site.register(Category, CategoryAdmin)
