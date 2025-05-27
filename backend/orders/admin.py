from django.contrib import admin
from .models import Order, OrderItem



# Register your models here.
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'reseller', 'stockist', 'status', 'total_price', 'created_at')
    search_fields = ['id', 'reseller__username', 'stockist__username']
    list_filter = ['status', 'created_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    inlines = [OrderItemInline]


class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_id_display', 'product', 'quantity', 'price', 'total_price')
    search_fields = ['order__id', 'product__name']
    list_filter = ['order__status']

    def order_id_display(self, obj):
        return f"#{obj.order.id}"
    order_id_display.short_description = 'Order ID'

    def total_price(self, obj):
        return obj.get_total()
    total_price.short_description = 'Total'

admin.site.register(OrderItem, OrderItemAdmin)
admin.site.register(Order, OrderAdmin)
