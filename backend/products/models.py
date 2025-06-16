from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator
from accounts.models import User
import uuid

# Create your models here.
class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='brand')
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='brands/logos/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Brands'

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='category')
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories',
    )
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        full_name = self.name
        if self.parent:
            full_name = f"{self.parent.name} → {self.name}"
        return full_name

# Tag Model
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

# Product Subcategory Mapping
class ProductSubCategory(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='subcategory_mappings')
    subcategory = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='product_mappings')

    class Meta:
        unique_together = ['product', 'subcategory']
        verbose_name_plural = 'Product Subcategories'

    def __str__(self):
        return f"{self.product.name} - {self.subcategory.name}"

# Base model for shared product fields
class BaseProductInfo(models.Model):
    sku = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=100, blank=True)
    active = models.BooleanField(default=True)
    approved_by_admin = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.sku:
            base = slugify(self.name)[:10] if self.name else "STK"
            unique_id = uuid.uuid4().hex[:6].upper()
            self.sku = f"{base}-{unique_id}"
        super().save(*args, **kwargs)

# Main Product Model (SPU)
class Product(BaseProductInfo):
    description = models.TextField(blank=True)
    brand_name = models.CharField(max_length=100, blank=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    tags = models.ManyToManyField(Tag, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    subcategories = models.ManyToManyField(Category, through='ProductSubCategory', related_name='products_in_subcategory')
    other_details = models.TextField(blank=True)

    def __str__(self):
        return self.name or self.sku

# Product Pricing Model
class ProductPricing(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='pricing_tiers')
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        unique_together = ['product', 'quantity']
        verbose_name_plural = 'Product Pricing Tiers'
        ordering = ['quantity']

    def __str__(self):
        return f"{self.product.name} - {self.quantity} units: {self.price} Rs"

# Size Model (Replaces ProductVariant)
class ProductSize(BaseProductInfo):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sizes')
    size = models.CharField(max_length=50, blank=True)  # e.g., "500ml", "L", "250g"
    unit = models.CharField(max_length=20, blank=True)  # e.g., "ml", "g", "kg"
    quantity = models.PositiveIntegerField(default=0)
    threshold = models.PositiveIntegerField(default=5)
    is_default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Auto-generate name from size and unit if not provided
        if not self.name and (self.size or self.unit):
            self.name = f"{self.size}{self.unit}".strip()
        
        if self.is_default:
            ProductSize.objects.filter(product=self.product).exclude(pk=self.pk).update(is_default=False)

        super().save(*args, **kwargs)

    @property
    def display_price(self):
        # Use the product's pricing tiers or fall back to a default logic
        if self.product.pricing_tiers.exists():
            # For simplicity, return the price of the first pricing tier
            return self.product.pricing_tiers.first().price
        return 0  # Fallback if no pricing tiers exist

    @property
    def in_stock(self):
        return self.quantity > 0 and self.active

    @property
    def low_stock(self):
        return self.quantity <= self.threshold

    def __str__(self):
        return f"{self.product.name} - {self.name or self.sku}"

# Product Image Model
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    size = models.ForeignKey(ProductSize, on_delete=models.SET_NULL, null=True, blank=True, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    alt_text = models.CharField(max_length=150, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.product.name} Image #{self.id}"


# Notification Model
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    size = models.ForeignKey(ProductSize, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        choices=[
            ('LOW_STOCK', 'Low Stock'),
            ('PRODUCT_APPROVED', 'Product Approved'),
            ('PRODUCT_REJECTED', 'Product Rejected'),
            ('GENERAL', 'General'),
        ],
        default='GENERAL'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:50]}"