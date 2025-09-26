from decimal import Decimal, ROUND_HALF_UP
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction as db_transaction
from django.core.exceptions import ObjectDoesNotExist

from products.models import Product, ProductVariant, RoleBasedProduct

ORDER_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('accepted', 'Accepted'),
    ('rejected', 'Rejected'),
    ('ready_for_dispatch', 'Ready For Dispatch'),
    ('dispatched', 'Dispatched (In Progress)'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
)

PAYMENT_STATUS_CHOICES = (
    ('pending', 'Pending '),
    ('partial', 'Partially Paid'),
    ('pending_shipping', 'Pending Shipping Payment'),
    ('paid', 'Paid'),
    ('failed', 'Failed'),
    ('failed_shipping', 'Failed Shipping Payment'),
    ('refunded', 'Refunded'),
)


class Order(models.Model):
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders_created'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders_received'
    )

    status = models.CharField(
        max_length=30,
        choices=ORDER_STATUS_CHOICES,
        default='pending'
    )
    
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )

    note = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True)

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )

    expected_delivery_date = models.DateField(null=True, blank=True)

    # Transport & Dispatch Info
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    transport_charges = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    receipt = models.FileField(upload_to='order_receipts/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['created_at', 'status']),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.buyer.username}"

    def calculate_totals(self):
        """
        Recalculate all totals from order items + transport_charges.
        Uses Decimal arithmetic and rounds to 2 decimals.
        """
        subtotal = Decimal('0.00')
        gst_amount = Decimal('0.00')
        discount_amount = Decimal('0.00')
        
        for item in self.items.all():
            # item.total property returns Decimal
            subtotal += Decimal(item.total)
            gst_amount += Decimal(item.gst_amount or Decimal('0.00'))
            discount_amount += Decimal(item.discount_amount or Decimal('0.00'))
        
        # Calculate final total
        total = subtotal - discount_amount + gst_amount + Decimal(self.transport_charges or Decimal('0.00'))
        
        # Round to 2 decimal places
        self.subtotal = subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.gst_amount = gst_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.discount_amount = discount_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.total_price = total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        self.save(update_fields=['subtotal', 'gst_amount', 'discount_amount', 'total_price', 'updated_at'])

    def update_inventory(self, reverse=False):
        """
        Update inventory levels when order status changes
        """
        from products.models import StockInventory
        
        multiplier = -1 if reverse else 1
        
        for item in self.items.all():
            if item.variant:
                # Create inventory adjustment
                StockInventory.objects.create(
                    product=item.product,
                    variant=item.variant,
                    user=self.seller or self.buyer,
                    new_quantity=multiplier * item.quantity,
                    note=f"Order #{self.id} {'reversal' if reverse else 'fulfillment'}"
                )


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name='items',
        on_delete=models.CASCADE
    )

    # Product information
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    # Pricing information
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Discount in %'
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    gst_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='GST in %'
    )
    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )

    # Role-based pricing reference
    role_based_product = models.ForeignKey(
        RoleBasedProduct,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Reference to the role-based pricing used for this item"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
        indexes = [
            models.Index(fields=['product', 'variant']),
        ]

    def __str__(self):
        item_name = self.variant.name if self.variant else self.product.name
        return f"{self.quantity} x {item_name}"

    def save(self, *args, **kwargs):
        # Calculate discount and GST amounts if not provided
        if not self.discount_amount and self.discount_percentage > 0:
            self.discount_amount = (self.unit_price * self.discount_percentage / Decimal('100.00')).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        
        if not self.gst_amount and self.gst_percentage > 0:
            discounted_price = self.unit_price - self.discount_amount
            self.gst_amount = (discounted_price * self.gst_percentage / Decimal('100.00')).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        
        super().save(*args, **kwargs)
        
        # Update order totals after saving
        if self.order:
            self.order.calculate_totals()

    @property
    def total(self):
        """
        Compute total for this item: (unit_price - discount_amount + gst_amount) * quantity.
        Returns Decimal rounded to 2 decimal places.
        """
        if self.unit_price is None or self.quantity is None:
            return Decimal('0.00')
        
        # Calculate item total
        unit_total = self.unit_price - self.discount_amount + self.gst_amount
        total = unit_total * Decimal(self.quantity)
        
        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def item_name(self):
        """Get the display name for the item"""
        if self.variant:
            return f"{self.product.name} - {self.variant.name}"
        return self.product.name


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
        max_length=30,
        choices=ORDER_STATUS_CHOICES
    )
    notes = models.TextField(blank=True)
    previous_status = models.CharField(max_length=30, blank=True, null=True)
    current_status = models.CharField(max_length=30, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Order History'
        verbose_name_plural = 'Order Histories'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['order', 'timestamp']),
        ]

    def __str__(self):
        actor_str = str(self.actor) if self.actor else 'System'
        return f"Order #{self.order.id} - {self.get_action_display()} by {actor_str}"

    def save(self, *args, **kwargs):
        # If previous_status not provided, try to set from latest history for same order,
        # otherwise fall back to current order.status
        if not self.previous_status:
            try:
                previous_record = OrderHistory.objects.filter(
                    order=self.order
                ).exclude(id=self.id).latest('timestamp')
                self.previous_status = previous_record.current_status or previous_record.action
            except OrderHistory.DoesNotExist:
                self.previous_status = self.order.status
        self.current_status = self.action
        super().save(*args, **kwargs)


class OrderPayment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
        ('wallet', 'Wallet'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
    )
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Payment'
        verbose_name_plural = 'Order Payments'

    def __str__(self):
        return f"Payment #{self.id} for Order #{self.order.id}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update order payment status based on payments
        total_paid = self.order.payments.filter(status='paid').aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        if total_paid >= self.order.total_price:
            self.order.payment_status = 'paid'
        elif total_paid > Decimal('0.00'):
            self.order.payment_status = 'partial'
        else:
            self.order.payment_status = 'pending'
        
        self.order.save(update_fields=['payment_status', 'updated_at'])


class OrderRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    REQUESTOR_TYPE_CHOICES = [
        ('reseller', 'Reseller'),
        ('stockist', 'Stockist'),
    ]

    TARGET_TYPE_CHOICES = [
        ('stockist', 'Stockist'),
        ('admin', 'Admin'),
    ]
    request_id = models.CharField(max_length=40, unique=True, blank=True)

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='order_requests'
    )
    requestor_type = models.CharField(max_length=20, choices=REQUESTOR_TYPE_CHOICES)
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_requests'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.requested_by} → {self.target_type} ({self.status})"
    
    def save(self, *args, **kwargs):
        if not self.request_id:
            last_id = OrderRequest.objects.all().count() + 1
            self.request_id = f"req_0000{str(last_id).zfill(3)}"
        super().save(*args, **kwargs)
    
    @property
    def total_amount(self):
        """Calculate total amount including GST and discounts"""
        return sum(item.total_price for item in self.items.all())
    
    @property
    def total_quantity(self):
        """Calculate total quantity of all items"""
        return sum(item.quantity for item in self.items.all())

class OrderRequestItem(models.Model):
    order_request = models.ForeignKey(OrderRequest, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(RoleBasedProduct, on_delete=models.CASCADE)
    variant= models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    gst_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    

    def __str__(self):
        return f" {self.quantity}"