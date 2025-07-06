from django.contrib import admin
from .models import Order, OrderItem, OrderHistory

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total',)
    fields = ('product', 'product_size', 'quantity', 'price', 'discount', 'total')

class OrderHistoryInline(admin.TabularInline):
    model = OrderHistory
    extra = 0
    readonly_fields = ('timestamp', 'actor', 'action', 'previous_status', 'current_status', 'notes')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_by', 'created_for', 'status', 'total_price', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'created_by__username', 'created_for__username')
    inlines = [OrderItemInline, OrderHistoryInline]
    readonly_fields = ('total_price',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'product_size', 'quantity', 'price', 'discount', 'total')
    search_fields = ('order__id', 'product__name')

@admin.register(OrderHistory)
class OrderHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'actor', 'action', 'previous_status', 'current_status', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('order__id', 'actor__username', )