from django.contrib import admin
from .models import Order, OrderItem, OrderHistory, OrderPayment,OrderRequest,OrderRequestItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total', 'item_name')
    fields = (
        'item_name',
        'product',
        'variant',
        'quantity',
        'unit_price',
        'discount_percentage',
        'discount_amount',
        'gst_percentage',
        'gst_amount',
        'total',
    )


class OrderHistoryInline(admin.TabularInline):
    model = OrderHistory
    extra = 0
    readonly_fields = ('timestamp', 'actor', 'action', 'previous_status', 'current_status', 'notes')


class OrderPaymentInline(admin.TabularInline):
    model = OrderPayment
    extra = 0
    readonly_fields = ('created_at', 'updated_at')
    fields = ('amount', 'payment_method', 'transaction_id', 'status', 'notes', 'created_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'buyer', 'seller',
        'status', 'payment_status',
        'subtotal', 'gst_amount',
        'discount_amount', 'total_price',
        'expected_delivery_date',
        'created_at', 'updated_at'
    )
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('id', 'buyer__username', 'seller__username', 'tracking_number')
    inlines = [OrderItemInline, OrderHistoryInline, OrderPaymentInline]
    readonly_fields = ('subtotal', 'gst_amount', 'discount_amount', 'total_price', 'created_at', 'updated_at')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'item_name',
        'product', 'variant',
        'quantity', 'unit_price',
        'discount_percentage', 'discount_amount',
        'gst_percentage', 'gst_amount',
        'total'
    )
    search_fields = ('order__id', 'product__name', 'variant__name')


@admin.register(OrderHistory)
class OrderHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'actor', 'action', 'previous_status', 'current_status', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('order__id', 'actor__username')


@admin.register(OrderPayment)
class OrderPaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'payment_method', 'transaction_id', 'status', 'created_at')
    list_filter = ('payment_method', 'status', 'created_at')
    search_fields = ('order__id', 'transaction_id')

class OrderRequestItemInline(admin.TabularInline):
    model = OrderRequestItem
    extra = 1
    readonly_fields = ('total_price',)
    autocomplete_fields = ['product']  # optional if you have many products

@admin.register(OrderRequest)
class OrderRequestAdmin(admin.ModelAdmin):
    list_display = ('request_id', 'requested_by', 'requestor_type', 'target_type', 'target_user', 'status', 'created_at')
    list_filter = ('status', 'requestor_type', 'target_type', 'created_at')
    search_fields = ('request_id', 'requested_by__username', 'target_user__username', 'note')
    readonly_fields = ('request_id', 'created_at', 'updated_at')
    inlines = [OrderRequestItemInline]
    autocomplete_fields = ['requested_by', 'target_user']  # optional for large user tables
    ordering = ('-created_at',)

@admin.register(OrderRequestItem)
class OrderRequestItemAdmin(admin.ModelAdmin):
    list_display = ('order_request', 'product', 'quantity', 'unit_price', 'total_price','variant','gst_percentage','discount_percentage')
    list_filter = ('product',)
    search_fields = ( 'order_request__request_id',)