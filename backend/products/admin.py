from django.contrib import admin
from .models import (
    Brand, Category, SubCategory, Tag, Product,
    ProductSize, ProductImage, ProductPriceTier, Stock
)



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


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'brand', 'category', 'status', 'created_at')
    list_filter = ('status', 'category', 'brand', 'created_at')
    search_fields = ('name', 'description', 'short_description', 'sku')
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('tags',)

@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'unit', 'price', 'is_default', 'is_active')
    list_filter = ('is_default', 'is_active')
    search_fields = ('product__name', )

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image', 'is_featured', 'is_default', 'created_at')
    list_filter = ('is_featured', 'is_default')

@admin.register(ProductPriceTier)
class ProductPriceTierAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'min_quantity', 'price')
    list_filter = ('min_quantity',)