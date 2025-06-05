from django.contrib import admin
from .models import Brand, Category, Product, ProductVariant, ProductImage,Tag

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'display_order', 'is_featured']
    ordering = ['display_order']


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['sku', 'name', 'price', 'quantity', 'attributes', 'is_default']
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'owner', 'active', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'sku', 'description']
    inlines = [ProductImageInline, ProductVariantInline]
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['tags']
    filter_horizontal = ['tags']
    ordering = ['-created_at']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['sku', 'name', 'product', 'price', 'quantity', 'is_default', 'active']
    list_filter = ['active', 'is_default']
    search_fields = ['sku', 'name', 'product__name']
    autocomplete_fields = ['product']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'image', 'display_order', 'is_featured']
    list_filter = ['is_featured']
    search_fields = ['product__name']
    ordering = ['product', 'display_order']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']



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

admin.site.register(Category, CategoryAdmin)
admin.site.register(Brand, BrandAdmin)
