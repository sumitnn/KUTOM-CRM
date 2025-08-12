from django.db import models
import uuid
# Create your models here.
from django.conf import settings
from products.models import Product ,ProductSize 
from django.core.exceptions import ValidationError
from django.db import transaction as db_transaction
from django.core.exceptions import ObjectDoesNotExist
from accounts.models import Wallet, WalletTransaction
from products.models import AdminProduct, AdminProductSize



ORDER_STATUS_CHOICES = (
    ('new', 'New Order'),                 # Order created
    ('accepted', 'Accepted'),            # Approved by admin
    ('rejected', 'Rejected'),            # Rejected by admin
    ('ready_for_dispatch', 'Ready For Dispatch'),          # Ready for dispatch
    ('dispatched', 'dispatched(Inprogress)'),        # Shipped
    ('delivered', 'Delivered'),          # Received by destination
    ('cancelled', 'Cancelled'),          # Cancelled
)

class Order(models.Model):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders_created'
    )
    created_for = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders_for'
    )

    status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default='new'
    )

    note = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True)

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    expected_delivery_date = models.DateField(null=True, blank=True)

    # Transport & Dispatch Info
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    transport_charges = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    receipt = models.FileField(upload_to='order_receipts/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"Order #{self.id}"

    def calculate_total(self):
        self.total_price = sum(item.total for item in self.items.all()) + self.transport_charges
        self.save()


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name='items',
        on_delete=models.CASCADE
    )

    # Vendor product
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items',
        null=True,
        blank=True
    )
    product_size = models.ForeignKey(
        ProductSize,
        on_delete=models.PROTECT,
        verbose_name='Size',
        null=True,
        blank=True
    )

    # Admin catalog product
    admin_product = models.ForeignKey(
        AdminProduct,
        on_delete=models.PROTECT,
        related_name='order_items',
        null=True,
        blank=True
    )
    admin_product_size = models.ForeignKey(
        AdminProductSize,
        on_delete=models.PROTECT,
        verbose_name='Admin Size',
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text='Discount in %'
    )

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        if self.product:
            return f"{self.quantity} x {self.product.name} ({self.product_size})"
        elif self.admin_product:
            return f"{self.quantity} x {self.admin_product.name} ({self.admin_product_size})"
        return f"{self.quantity} x Unknown Product"

    @property
    def total(self):
        if self.price is None or self.discount is None or self.quantity is None:
            return 0
        discounted_price = self.price * (1 - self.discount / 100)
        return round(self.quantity * discounted_price, 2)



class OrderHistory(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='history_records'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_actions'
    )
    action = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES
    )
    notes = models.TextField(blank=True)
    previous_status = models.CharField(max_length=20, blank=True, null=True)
    current_status = models.CharField(max_length=20, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Order History'
        verbose_name_plural = 'Order Histories'
        ordering = ['-timestamp']

    def __str__(self):
        return f"Order #{self.order.id} - {self.get_action_display()} by {self.actor or 'System'}"

    def save(self, *args, **kwargs):
        if not self.previous_status:
            try:
                previous_record = OrderHistory.objects.filter(order=self.order).exclude(id=self.id).latest('timestamp')
                self.previous_status = previous_record.current_status or previous_record.action
            except OrderHistory.DoesNotExist:
                self.previous_status = self.order.status
        self.current_status = self.action
        super().save(*args, **kwargs)


class Sale(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='sales'
    )

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='purchases'
    )

    # Vendor product flow
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales'
    )
    product_size = models.ForeignKey(
        ProductSize,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # Admin product flow
    admin_product = models.ForeignKey(
        AdminProduct,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_sales'
    )
    admin_product_size = models.ForeignKey(
        AdminProductSize,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    sale_date = models.DateField(auto_now_add=True)
    transaction_created = models.BooleanField(default=False)

    class Meta:
        ordering = ['-sale_date']

    def __str__(self):
        if self.product:
            return f"{self.quantity} x {self.product.name} (₹{self.total_price})"
        elif self.admin_product:
            return f"{self.quantity} x {self.admin_product.name} (₹{self.total_price})"
        return f"{self.quantity} items (₹{self.total_price})"
    
    
class Inventory(models.Model):
    MOVEMENT_TYPES = [
        ("IN", "Stock In"),
        ("OUT", "Stock Out"),
    ]

    product = models.ForeignKey(
        AdminProduct,
        on_delete=models.CASCADE,
        related_name="inventory"
    )
    product_size = models.ForeignKey(
       AdminProductSize,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
    quantity = models.PositiveIntegerField()
    note = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} - {self.product} ({self.quantity})"