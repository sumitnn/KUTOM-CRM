from django.contrib import admin
from .models import Brand, Category, Product, ProductVariant, ProductImage

# --- Product Admin ---
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'selling_price', 'active', 'created_at')
    search_fields = ['name', 'sku']
    list_filter = ['active']
    ordering = ['-created_at']
    readonly_fields = ('created_at', 'updated_at')

# --- Product Variant Admin ---
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name', 'sku', 'quantity', 'is_default', 'in_stock', 'low_stock')
    search_fields = ['sku', 'product__name']
    list_filter = ['is_default', 'active', 'product']
    ordering = ['-is_default', 'product', 'sku']
    readonly_fields = ('created_at', 'updated_at')

# --- Product Image Admin ---
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'is_featured', 'display_order')
    list_filter = ['product', 'is_featured']
    search_fields = ['product__name']
    ordering = ['product', 'display_order']

# --- Category Admin ---
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'display_order')
    search_fields = ['name']
    list_filter = ['parent']
    ordering = ['display_order', 'name']

# --- Brand Admin ---
class BrandAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_featured')
    search_fields = ['name']
    list_filter = ['is_featured']

# Register all models
admin.site.register(Product, ProductAdmin)
admin.site.register(ProductVariant, ProductVariantAdmin)
admin.site.register(ProductImage, ProductImageAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Brand, BrandAdmin)
