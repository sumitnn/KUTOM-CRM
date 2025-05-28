from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator
from accounts.models import User

# Create your models here.
class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    owner=models.ForeignKey(User,on_delete=models.SET_NULL,null=True, blank=True,related_name='brand')
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
    owner=models.ForeignKey(User,on_delete=models.SET_NULL,null=True, blank=True,related_name='category')
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




class BaseProductInfo(models.Model):
    sku = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique stock keeping unit"
    )
    name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name of product or variant"
    )
    image = models.ImageField(
        upload_to='products/images/',
        blank=True,
        null=True
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    mrp = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )


    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Product(BaseProductInfo):
    description = models.TextField(blank=True)
    owner=models.ForeignKey(User,on_delete=models.SET_NULL,null=True, blank=True,related_name='product')

    class Meta:
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['active']),
        ]

    def __str__(self):
        return self.name or self.sku


class ProductVariant(BaseProductInfo):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )

    quantity = models.PositiveIntegerField(default=0)
    threshold = models.PositiveIntegerField(default=5)
    attributes = models.JSONField(
        default=dict,
        help_text="e.g., {'color': 'Red', 'size': 'XL'}"
    )
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', 'sku']
        indexes = [
            models.Index(fields=['product', 'active']),
            models.Index(fields=['sku']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.name or self.sku}"

    def save(self, *args, **kwargs):
        if not self.name and self.attributes:
            self.name = ', '.join(f"{k}:{v}" for k, v in self.attributes.items())

        if self.is_default:
            ProductVariant.objects.filter(
                product=self.product
            ).exclude(pk=self.pk).update(is_default=False)

        super().save(*args, **kwargs)

    @property
    def display_price(self):
        return self.price or self.product.selling_price

    @property
    def in_stock(self):
        return self.quantity > 0 and self.active

    @property
    def low_stock(self):
        return self.quantity <= self.threshold

    def get_attribute_display(self, attr):
        return str(self.attributes.get(attr, '')).title()


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    alt_text = models.CharField(max_length=150, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.product.name} - Image {self.id}"
