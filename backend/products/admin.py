from django.contrib import admin
from django.utils.html import format_html
from .models import Brand, Category, Product, ProductImage

# Brand Admin
@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'logo_preview', 'is_featured', 'created_at')
    list_filter = ('is_featured', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('logo_preview', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'is_featured')
        }),
        ('Logo', {
            'fields': ('logo', 'logo_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.logo.url)
        return "-"
    logo_preview.short_description = 'Logo Preview'


# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'image_preview', 'display_order', 'is_featured', 'product_count')
    list_filter = ('is_featured', 'parent')
    search_fields = ('name', 'description')
    readonly_fields = ('image_preview', 'created_at', 'updated_at', 'product_count')
    fieldsets = (
        (None, {
            'fields': ('name', 'parent', 'description', 'display_order', 'is_featured')
        }),
        ('Image', {
            'fields': ('image', 'image_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ('display_order', 'name')

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "-"
    image_preview.short_description = 'Image Preview'

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


# Product Image Inline
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    readonly_fields = ('image_preview',)
    fields = ('image', 'image_preview', 'alt_text', 'display_order', 'is_featured')

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "-"
    image_preview.short_description = 'Preview'


# Product Admin
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'brand', 
        'category', 
        'sku', 
        'price_display', 
        'stock_status', 
        'is_featured', 
        'status',
        'visibility'
    )
    list_filter = (
        'status', 
        'visibility', 
        'is_featured', 
        'stock_status', 
        'brand', 
        'category',
        'created_at'
    )
    search_fields = ('name', 'sku', 'description', 'short_description')
    readonly_fields = (
        'created_at', 
        'updated_at', 
        'discount_percentage',
        'net_profit',
    )
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'name', 
                'slug', 
                'description', 
                'short_description', 
                'brand', 
                'category', 
                'sku'
            )
        }),
        ('Status & Visibility', {
            'fields': (
                'status', 
                'visibility', 
                'is_featured',
            )
        }),
        ('Pricing', {
            'fields': (
                'mrp', 
                'selling_price', 
                'cost_price', 
                'discount_type',
                'tax', 
                'currency',
                'discount_percentage',
                'net_profit',
            )
        }),
        ('Inventory', {
            'fields': (
                'stock_quantity', 
                'stock_status', 
                'min_order_quantity', 
                'max_order_quantity'
            )
        }),
        ('Shipping', {
            'fields': (
                'weight', 
                'length', 
                'width', 
                'height',
                'free_shipping', 
                'shipping_class'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': (
                'color_specification', 
                'pincode_availability', 
                'tags'
            ),
            'classes': ('collapse',)
        }),
        ('Ratings', {
            'fields': (
                'average_rating', 
                'total_reviews'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at', 
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    inlines = [ProductImageInline]
    prepopulated_fields = {'slug': ('name',)}
    list_per_page = 50
    list_select_related = ('brand', 'category')
    actions = ['mark_as_featured', 'mark_as_not_featured']

    def price_display(self, obj):
        return f"₹{obj.selling_price} (MRP: ₹{obj.mrp})"
    price_display.short_description = 'Price'

    def discount_percentage(self, obj):
        return f"{obj.get_discount_percentage()}%"
    discount_percentage.short_description = 'Discount %'

    def net_profit(self, obj):
        profit = obj.get_net_profit()
        return f"₹{profit}" if profit is not None else "-"
    net_profit.short_description = 'Profit'

    def mark_as_featured(self, request, queryset):
        queryset.update(is_featured=True)
    mark_as_featured.short_description = "Mark selected products as featured"

    def mark_as_not_featured(self, request, queryset):
        queryset.update(is_featured=False)
    mark_as_not_featured.short_description = "Mark selected products as not featured"


# Product Image Admin
@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'display_order', 'is_featured')
    list_filter = ('is_featured', 'product__brand', 'product__category')
    search_fields = ('product__name', 'alt_text')
    readonly_fields = ('image_preview', 'created_at')
    list_editable = ('display_order', 'is_featured')
    fieldsets = (
        (None, {
            'fields': ('product', 'image', 'image_preview', 'alt_text')
        }),
        ('Display Options', {
            'fields': ('display_order', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "-"
    image_preview.short_description = 'Preview'