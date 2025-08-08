from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from accounts.models import User
import uuid

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='brands/logos/', blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='brands')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class MainCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    image = models.ImageField(upload_to='main_categories/', null=True, blank=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='main_categories'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Main Categories"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    main_category=models.ForeignKey(MainCategory,on_delete=models.SET_NULL,null=True, blank=True, related_name='categories')
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='categories')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['-created_at']

    def __str__(self):
        return self.name



class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL,null=True, blank=True, related_name='subcategories')
    brand= models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Sub Categories'
        ordering = ['-created_at']
        unique_together = ['category', 'name']

    def __str__(self):
        return f"- {self.name}"



class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tags')

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Product(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ] 
    
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
        ('INR', 'Indian Rupee'),
        ('JPY', 'Japanese Yen'),
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    
    # New fields from frontend data
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weight_unit = models.CharField(max_length=2, choices=WEIGHT_UNIT_CHOICES, default='kg')
    dimensions = models.CharField(max_length=100, blank=True, null=True)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, default='physical')
    shipping_info = models.TextField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    warranty = models.CharField(max_length=100, blank=True, null=True)
    content_embeds = models.TextField(blank=True, null=True)
    features = models.JSONField(default=list)  
    
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"PROD-{uuid.uuid4().hex[:8].upper()}"
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class ProductSize(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sizes')
    size = models.CharField(max_length=50)
    unit = models.CharField(max_length=20)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.product.name} - {self.size}{self.unit}"

    def save(self, *args, **kwargs):
        if self.is_default:
            ProductSize.objects.filter(product=self.product).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    alt_text = models.CharField(max_length=150, blank=True)
    is_featured = models.BooleanField(default=True)
    is_default= models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.product.name}"

class ProductPriceTier(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_tiers')
    size = models.ForeignKey(ProductSize, on_delete=models.CASCADE, related_name='price_tiers')
    min_quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ['min_quantity']
        unique_together = ['size', 'min_quantity']

    def __str__(self):
        return f"{self.size.product.name} - {self.min_quantity}+ units: {self.price}"


# admin products 
class AdminProduct(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    short_description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weight_unit = models.CharField(max_length=10, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    product_type = models.CharField(max_length=20, blank=True)
    currency = models.CharField(max_length=3, blank=True)
    sku = models.CharField(max_length=50, unique=True, blank=True)
    slug = models.SlugField(max_length=255, blank=True)

    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_products")
    original_vendor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    source_product_id = models.IntegerField(null=True, blank=True)

    resale_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_available = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Admin Copy)"
    
    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"PROD-{uuid.uuid4().hex[:8].upper()}"
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class AdminProductSize(models.Model):
    admin_product = models.ForeignKey(AdminProduct, on_delete=models.CASCADE, related_name='sizes')
    size = models.CharField(max_length=50)
    unit = models.CharField(max_length=20)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.admin_product.name} - {self.size}{self.unit}"

class AdminProductImage(models.Model):
    admin_product = models.ForeignKey(AdminProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='admin_products/images/')
    alt_text = models.CharField(max_length=150, blank=True)
    is_featured = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.admin_product.name}"


class Stock(models.Model):
    STATUS_CHOICES = [
        ('in_stock', 'In Stock'),
        ('out_of_stock', 'Out of Stock')
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stocks')
    size = models.ForeignKey(ProductSize, on_delete=models.SET_NULL, null=True, blank=True)

    old_quantity = models.PositiveIntegerField(default=0)
    new_quantity = models.PositiveIntegerField(default=0)

    quantity = models.PositiveIntegerField(default=0)
    rate = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_stock')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='stocks')

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'size')

    def __str__(self):
        return f"{self.product.name} - {self.quantity} units"
    
    def save(self, *args, **kwargs):
        if self.pk:  # Only apply logic on update
            try:
                previous = Stock.objects.get(pk=self.pk)
                self.old_quantity = previous.quantity
            except Stock.DoesNotExist:
                self.old_quantity = 0
            print("stock update model ")

            # Update quantity based on previous and new
            self.quantity = self.old_quantity + self.new_quantity
            self.total_price = self.quantity * self.rate
            self.status = 'out_of_stock' if self.quantity <= 10 else 'in_stock'

        super().save(*args, **kwargs)



