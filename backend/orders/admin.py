from django.contrib import admin
from .models import Order, OrderItem
# Register your models here.
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'reseller', 'stockist', 'status', 'description', 'total_price', 'created_at')
    search_fields = ['id', 'reseller__username', 'stockist__username'] 

class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product', 'quantity', 'price']
    search_fields = ['order__id', 'product__name']
    list_filter = ['order__status']

admin.site.register(OrderItem, OrderItemAdmin)
admin.site.register(Order, OrderAdmin)
