from django.db import models
import uuid
# Create your models here.
from django.conf import settings
from products.models import Product  

ORDER_STATUS = (
    ('pending', 'Pending'),
    ('forwarded', 'Forwarded to Admin'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
)

class Order(models.Model):
   
    reseller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reseller_orders')
    stockist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='stockist_orders')
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    description = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # per item

    @property
    def total(self):
        return self.quantity * self.price