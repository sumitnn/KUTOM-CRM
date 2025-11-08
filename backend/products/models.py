from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from accounts.models import User
import uuid
from decimal import Decimal,ROUND_HALF_UP

# Common abstract base model to reduce repetition
class BaseModel(models.Model):
    owner = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='%(class)ss'  # Dynamic related_name
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True  # This makes it an abstract base class
        ordering = ['-created_at']


class Brand(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='brands/logos/', blank=True, null=True)
    description = models.TextField(blank=True)

    class Meta(BaseModel.Meta):
        pass  # Inherits ordering from BaseModel

    def __str__(self):
        return self.name


class MainCategory(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    image = models.ImageField(upload_to='main_categories/', null=True, blank=True)

    class Meta(BaseModel.Meta):
        verbose_name_plural = "Main Categories"

    def __str__(self):
        return self.name


class Category(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    main_category = models.ForeignKey(
        MainCategory,
        on_delete=models.SET_NULL,
        null=True, 
        blank=True, 
        related_name='categories'
    )

    class Meta(BaseModel.Meta):
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class SubCategory(BaseModel):
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True, 
        related_name='subcategories'
    )
    brand = models.ForeignKey(
        Brand, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='subcategories'
    )
    name = models.CharField(max_length=100)

    class Meta(BaseModel.Meta):
        verbose_name_plural = 'Sub Categories'
        unique_together = ['category', 'name']

    def __str__(self):
        return f"- {self.name}"


class Tag(BaseModel):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    class Meta:
        # Don't inherit BaseModel.Meta to avoid ordering by created_at if not needed
        pass

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProductFeatures(BaseModel):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    image = models.ImageField(upload_to='products/images/')
    alt_text = models.CharField(max_length=150, blank=True)
    is_featured = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.alt_text}"


class Product(BaseModel):
    PRODUCT_TYPE_CHOICES = [
        ('physical', 'Physical Product'),
        ('digital', 'Digital Product'),
        ('service', 'Service'),
        ('subscription', 'Subscription'),
    ]
    
    WEIGHT_UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('g', 'Gram'),
        ('lb', 'Pound'),
        ('oz', 'Ounce'),
    ]
    
    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('INR', 'Indian Rupee')
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ] 

    sku = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    short_description = models.TextField(blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    features = models.ManyToManyField(ProductFeatures, blank=True)
    images = models.ManyToManyField(ProductImage, blank=True, related_name='products')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='draft')
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True) 
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weight_unit = models.CharField(max_length=2, choices=WEIGHT_UNIT_CHOICES, default='kg')
    dimensions = models.CharField(max_length=100, blank=True, null=True)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, default='physical')
    video_url = models.URLField(blank=True, null=True)
    warranty = models.CharField(max_length=100, blank=True, null=True)

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['brand', 'category']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"PROD-{uuid.uuid4().hex[:8].upper()}"
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=50)
    sku = models.CharField(max_length=50, unique=True, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['product', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name}"
    
    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"VAR-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class ProductVariantPrice(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'), 
        ('vendor', 'Vendor'), 
        ('stockist', 'Stockist'), 
        ('reseller', 'Reseller')
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variant_prices')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='prices')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='variant_prices')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='vendor')
    discount = models.IntegerField(default=0)
    gst_percentage = models.IntegerField(default=0)
    gst_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Changed to Decimal
    actual_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)

    stockist_price=models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    stockist_gst=models.IntegerField(default=0)
    stockist_discount=models.IntegerField(default=0)
    stockist_actual_price=models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)

    reseller_price=models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    reseller_gst=models.IntegerField(default=0)
    reseller_discount=models.IntegerField(default=0)
    reseller_actual_price=models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)


    class Meta:
        unique_together = ['variant', 'role', 'user','actual_price']
        indexes = [
            models.Index(fields=['variant', 'role']),
        ]

    def __str__(self):
        return f"{self.product.name}"
    
    def save(self, *args, **kwargs):
        # Calculate actual price with discount
        

        if self.discount > 0:
            discount_amount = (self.price * Decimal(self.discount)) / Decimal(100)
            self.actual_price = self.price - discount_amount
        else:
            self.actual_price = self.price

        # Calculate GST tax
        if self.gst_percentage > 0:
            gst_amount = (self.actual_price * Decimal(self.gst_percentage)) / Decimal(100)
            self.gst_tax = gst_amount
            self.actual_price += gst_amount
        else:
            self.gst_tax = Decimal(0)

        super().save(*args, **kwargs)


class ProductVariantBulkPrice(models.Model):
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='bulk_prices')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='bulk_prices')
    max_quantity = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)])  # %
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)])  # %
    final_price = models.DecimalField(max_digits=10, decimal_places=2, editable=False, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['variant', 'max_quantity']),
        ]

    def save(self, *args, **kwargs):
 
        base = self.price 
        discount_amount = (base * (self.discount / Decimal(100))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        price_after_discount = base - discount_amount
        gst_amount = (price_after_discount * (self.gst_percentage / Decimal(100))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.final_price = (price_after_discount + gst_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        super().save(*args, **kwargs)


# Role-Based Products - Consolidated into a single model
class RoleBasedProduct(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('vendor', 'Vendor'),
        ('stockist', 'Stockist'),
        ('reseller', 'Reseller'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='role_based_products')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_based_products')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    variants = models.ManyToManyField(ProductVariant, blank=True, related_name='role_based_products')
    is_featured = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'user', 'role']
        indexes = [
            models.Index(fields=['product', 'role', 'is_featured']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - product={self.product.id} - rolebase={self.id}"


class ProductCommission(models.Model):
    COMMISSION_TYPE_CHOICES = [
        ('flat', 'Flat'),
        ('percent', 'Percentage')
    ]

    # Link to role-based product
    role_product = models.ForeignKey(
        'RoleBasedProduct',
        on_delete=models.CASCADE,
        related_name='commissions'
    )

    # Link to specific product variant
    variant = models.ForeignKey(
        'ProductVariant',
        on_delete=models.CASCADE,
        related_name='variant_commissions',
        default=None
    )

    commission_type = models.CharField(
        max_length=10,
        choices=COMMISSION_TYPE_CHOICES,
        default='flat'
    )

    reseller_commission_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stockist_commission_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    admin_commission_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['role_product', 'variant']  # ✅ unique per product + variant
        indexes = [
            models.Index(fields=['role_product', 'variant']),
        ]

    def __str__(self):
        return f"{self.role_product.product.name} - {self.variant.name} Commission"


class StockInventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventories')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='inventories', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventories')
    total_quantity = models.IntegerField(default=0)
    notes= models.TextField(blank=True, null=True)
    manufacture_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    is_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'variant', 'user','batch_number']
        indexes = [
            models.Index(fields=['product', 'variant']),
            models.Index(fields=['user', 'created_at']),
        ]
        verbose_name_plural = "Stock inventories"

    def __str__(self):
        return f"{self.product.name} - {self.total_quantity} units"
    
    def adjust_stock(self, change_quantity: int, action="ADJUST", reference_id=None):
        """
        Adjust stock and create history record.
        change_quantity can be positive (add) or negative (deduct).
        """
        old_qty = self.total_quantity
        new_qty = old_qty + change_quantity

        # ✅ Prevent negative stock
        if new_qty < 0:
            raise ValueError(f"Insufficient stock for {self.product.name} (Variant ID: {self.variant_id})")

        # Update running balance
        self.total_quantity = new_qty
        self.save(update_fields=["total_quantity", "updated_at"])

        # Create linked history entry
        StockInventoryHistory.objects.create(
            stock_inventory=self,
            user=self.user,
            old_quantity=old_qty,
            change_quantity=change_quantity,
            new_quantity=new_qty,
            action=action,
            reference_id=reference_id,
        )
        if change_quantity > 0 and self.user.role == 'stockist':
            self._reset_transfer_due_orders()

        return self.total_quantity
    
    def _reset_transfer_due_orders(self):
        """
        Clear transfer_due_at for pending stock orders
        when stock is replenished.
        """
        from orders.models import OrderRequest
        pending_orders = OrderRequest.objects.filter(
            target_user=self.user,
            status="pending",
            transfer_due_at__isnull=False,
        )

        if pending_orders.exists():
            count = pending_orders.update(transfer_due_at=None)
            print(f"✅ Cleared transfer_due_at for {count} pending orders of user {self.user.username}")
    
class StockInventoryHistory(models.Model):
    stock_inventory = models.ForeignKey(
        StockInventory, on_delete=models.CASCADE, related_name="history"
    )   
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stock_history")

    old_quantity = models.IntegerField()
    change_quantity = models.IntegerField()  # +ve (add) or -ve (deduct)
    new_quantity = models.IntegerField()

    action = models.CharField(
        max_length=50,
        choices=[
            ("ADD", "Stock Added"),
            ("REMOVE", "Stock Removed"),
            ("ORDER", "Stock Deducted for Order"),
            ("RETURN", "Stock Returned"),
            ("ADJUST", "Manual Adjustment"),
            ("EXPIRED", "Stock Expired"),
            ("REPLACEMENT_STOCK_DEDUCTED", "Stock Deducted For Replacement"),
            ("REPLACEMENTDONE", "Stock Replaced Successfully"),
            ("EXCHANGED_STOCK_ADDED", "Stock Exchanged Successfully"),
            ("REQUEST_REJECTED_STOCK_RESTORED", "Stock Exchanged Request Rejected - Stock Restored"),
            ("CUSTOMER_PURCHASE", "Customer Purchase"),
        ],
        default="ADJUST",
    )
    reference_id = models.CharField(max_length=100, null=True, blank=True)  # e.g., Order ID
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["stock_inventory", "user"]),
            models.Index(fields=["user", "created_at"]),
        ]
        verbose_name_plural = "Stock Inventory History"

    def __str__(self):
        return f"| {self.change_quantity} | New: {self.new_quantity}"





class StockTransferRequest(models.Model):
    """Unified model for Expiry, Damaged, and Wrong Product returns/replacements."""

    class RequestType(models.TextChoices):
        EXPIRED = 'expired', 'Expired Product Return'
        DAMAGED = 'damaged', 'Damaged Product Return'
        WRONG_PRODUCT = 'wrong_product', 'Wrong Product Return'
        DEFECTIVE_PRODUCT = 'defective', 'Defective Product Return'
        OTHER = 'other', 'Other Issue'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        APPROVED = 'approved', 'Approved & Processing'
        REJECTED = 'rejected', 'Rejected / Cancelled'
        IN_TRANSIT = 'in_transit', 'Return in Transit'
        IN_DISPATCHING = 'dispatched', 'Dispatching In Progress'
        RECEIVED = 'received', 'Returned Item Received'


    request_id = models.CharField(max_length=20, unique=True, editable=False)
    request_type = models.CharField(max_length=25, choices=RequestType.choices, default=RequestType.DAMAGED)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Relationship fields
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='raised_transfer_requests', null=True, blank=True)
    raised_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_transfer_requests', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='transfer_requests', null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='transfer_requests', null=True, blank=True)

    quantity = models.PositiveIntegerField()
    batch_number = models.CharField(max_length=100)

    # Details
    reason = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    # Expiry-related fields
    expiry_date = models.DateField(null=True, blank=True)
    remaining_days = models.IntegerField(null=True, blank=True)

    # Stock tracking
    original_stock_deducted = models.BooleanField(default=False)
    replacement_stock_added = models.BooleanField(default=False)

    # Resolution and tracking
    is_resolved = models.BooleanField(default=False)
    user_notes = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # delivery details 
    delivery_date = models.DateField(null=True, blank=True)

    # Transport & Dispatch Info
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    delivery_note = models.TextField(blank=True, null=True)
    new_batch_number = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['request_type', 'status']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = "Stock Transfer Request"
        verbose_name_plural = "Stock Transfer Requests"

    def save(self, *args, **kwargs):
        """Auto-generate request ID & handle timestamps."""
        if not self.request_id:
            self.request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"

        if self.status == self.Status.APPROVED and not self.approved_date:
            from django.utils import timezone
            self.approved_date = timezone.now()

        if self.status == self.Status.RECEIVED and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
            self.is_resolved = True  # auto mark resolved when completed

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.request_id}  - {self.status}"


class ExpiryTracker(models.Model):
    """Track products nearing expiry - Each user sees their own expiring products"""

    class ExpiryStatus(models.TextChoices):
        EXPIRING_SOON = 'expiring_soon', 'Expiring Soon (30-16 days)'
        CRITICAL = 'critical', 'Critical (15-1 days)'
        EXPIRED = 'expired', 'Expired'

    stock_item = models.ForeignKey(StockInventory, on_delete=models.CASCADE, related_name='expiry_trackers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expiry_trackers')
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    remaining_days = models.IntegerField()
    status = models.CharField(max_length=20, choices=ExpiryStatus.choices,default=ExpiryStatus.EXPIRING_SOON)
    can_request_return = models.BooleanField(default=False)
    stock_quantity = models.IntegerField(default=0)
    is_resolved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['stock_item', 'user','batch_number']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['remaining_days']),
        ]
        ordering = ['remaining_days']

    def __str__(self):
        return f"{self.stock_item.id} ({self.status}) - {self.remaining_days} days left"
    
    def save(self, *args, **kwargs):
        if not self.user_id:
            self.user = self.stock_item.user
        if not self.batch_number:
            self.batch_number = self.stock_item.batch_number
        super().save(*args, **kwargs)


class RequestImage(models.Model):
    """Unified image storage for all requests"""
    transfer_request = models.ForeignKey(StockTransferRequest, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='return_request_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.transfer_request.request_id}"