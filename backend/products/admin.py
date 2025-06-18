from django.contrib import admin
from .models import (
    Brand, Category, SubCategory, Tag,
    Product, ProductSize, ProductImage,
    ProductPriceTier, Notification
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
    fields = ['size', 'unit', 'price', 'quantity', 'is_default']
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
    list_display = ['product', 'size', 'price', 'quantity']
    list_filter = ['is_default', 'is_active']
    inlines = [ProductPriceTierInline]
    search_fields = ['product__name', 'size']

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active',"description",'owner__email', 'created_at',]
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name',  'is_active']
    list_filter = [ 'is_active']
    search_fields = ['name']

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name']

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'is_read']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__username', 'title']