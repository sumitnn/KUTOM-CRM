from django.db import models


# Create your models here.
class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
    
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories',
        help_text="Optional. Set this if this category is a subcategory."
    )

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        full_name = self.name
        if self.parent:
            full_name = f"{self.parent.name} → {self.name}"
        return full_name


class Product(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    name = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)  # Original price
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    stock = models.PositiveIntegerField(default=0)
    # image = models.ImageField(upload_to='product_images/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def is_in_stock(self):
        return self.stock > 0

