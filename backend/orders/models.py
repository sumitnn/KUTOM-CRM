from django.db import models
import uuid
# Create your models here.
from django.conf import settings
from products.models import Product ,ProductSize 

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
    note = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.status}"

    def calculate_total(self):
        total = sum(item.total for item in self.items.all())
        self.total_price = total
        self.save()


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product_size = models.ForeignKey(ProductSize, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  



    def __str__(self):
        return f" {self.quantity}"

    @property
    def total(self):
        return self.quantity * self.price


class OrderHistory(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('delivered', 'Delivered'),

       
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order} - {self.action} by {self.actor}"