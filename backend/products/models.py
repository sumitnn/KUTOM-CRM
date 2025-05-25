from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
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

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            
            while Brand.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
                
            self.slug = slug
        super().save(*args, **kwargs)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories',
        help_text="Optional. Set this if this category is a subcategory."
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

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
                
            self.slug = slug
        super().save(*args, **kwargs)


class Product(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    
    VISIBILITY_CHOICES = (
        ('visible', 'Visible'),
        ('hidden', 'Hidden'),
    )
    
    STOCK_STATUS_CHOICES = (
        ('in_stock', 'In Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('backorder', 'Backordered'),
        ('pre_order', 'Pre-Order'),
        ('discontinued', 'Discontinued'),
    )
    
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )
    

    # Basic Information
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=500, blank=True)
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='products'
    )
    brand = models.ForeignKey(
        Brand, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='products'
    )
    sku = models.CharField(max_length=150, unique=True, help_text="Stock Keeping Unit")
    
    # Status and Visibility
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='visible')
    is_featured = models.BooleanField(default=False)
    
    # Pricing
    mrp = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Maximum Retail Price"
    )
    selling_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    cost_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        default=0,
        validators=[MinValueValidator(0)]
    )
    discount_type = models.CharField(
        max_length=10, 
        choices=DISCOUNT_TYPE_CHOICES, 
        blank=True, 
        null=True
    )
    tax = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        blank=True,
        null=True
    )
    currency = models.CharField(max_length=3, default='INR')
    
    # Inventory
    stock_quantity = models.IntegerField(default=0)
    stock_status = models.CharField(
        max_length=20, 
        choices=STOCK_STATUS_CHOICES, 
        default='in_stock'
    )
    min_order_quantity = models.PositiveIntegerField(default=1)
    max_order_quantity = models.PositiveIntegerField(blank=True, null=True)
    
    # Shipping
    weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Weight in kilograms"
    )
    length = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    width = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    height = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    free_shipping = models.BooleanField(default=False)
    shipping_class = models.CharField(max_length=50, blank=True, null=True)
    
    # Additional Fields
    color_specification = models.JSONField(blank=True, null=True)
    pincode_availability = models.JSONField(blank=True, null=True)
    tags = models.JSONField(blank=True, null=True)
    
    # Ratings
    average_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00
    )
    total_reviews = models.PositiveIntegerField(default=0)
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        limit_choices_to={'role': 'vendor'},  
        verbose_name='Vendor/Owner'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Products'  
        indexes = [
            models.Index(fields=['name', 'sku']),
            models.Index(fields=['status', 'is_featured']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
                
            self.slug = slug
        super().save(*args, **kwargs)

    def is_in_stock(self):
        return self.stock_quantity > 0 and self.stock_status == 'in_stock'

    def get_discount_percentage(self):
        if self.mrp and self.mrp > self.selling_price:
            discount = ((self.mrp - self.selling_price) / self.mrp) * 100
            return round(discount, 2)
        return 0

    def get_net_profit(self):
        if self.cost_price:
            return self.selling_price - self.cost_price
        return None


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(upload_to='products/images/')
    alt_text = models.CharField(max_length=100, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order']
        verbose_name_plural = 'Product Images'

    def __str__(self):
        return f"Image for {self.product.name}"



class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    sku = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique stock keeping unit for this variant"
    )
    name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Variant name (e.g., 'Red, Large')"
    )
    
    # Inventory
    quantity = models.PositiveIntegerField(default=0)
    threshold = models.PositiveIntegerField(
        default=5,
        help_text="Low stock warning level"
    )
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Leave blank to use product's base price"
    )

    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Cost price for this variant"
    )
    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Selling price for this variant"
    )

    mrp = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Maximum Retail Price for this variant"
    )

    # Images
    image = models.ImageField(
        upload_to='variants/images/',
        blank=True,
        null=True,
        help_text="Optional image for this variant"
    )
    
    
    # Attributes (stored as JSON for efficiency)
    attributes = models.JSONField(
        default=dict,
        help_text="Key-value pairs of variant attributes (e.g., {'color': 'red', 'size': 'xl'})"
    )
    
    active = models.BooleanField(
        default=True,
        help_text="Is this variant available for sale?"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'sku']
        indexes = [
            models.Index(fields=['product', 'active']),
            models.Index(fields=['sku']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.name or self.sku}"

    def save(self, *args, **kwargs):
        # Auto-generate variant name from attributes if not provided
        if not self.name and self.attributes:
            self.name = ', '.join(
                f"{k}:{v}" for k, v in self.attributes.items()
            )
        
        # Ensure only one default variant per product
        if self.is_default:
            ProductVariant.objects.filter(
                product=self.product
            ).exclude(pk=self.pk).update(is_default=False)
        
        super().save(*args, **kwargs)

    @property
    def display_price(self):
        """Get the effective price (variant price or fallback to product price)"""
        return self.price if self.price is not None else self.product.selling_price

    @property
    def in_stock(self):
        """Check if variant is available for purchase"""
        return self.quantity > 0 and self.active

    @property
    def low_stock(self):
        """Check if stock is below threshold"""
        return self.quantity <= self.threshold

    def get_attribute_display(self, attribute_name):
        """Get formatted attribute value"""
        return self.attributes.get(attribute_name, '').title()