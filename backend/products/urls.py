from django.urls import path
from .views import *

urlpatterns = [
    # Product URLs
    path('products/', views.product_list_create, name='product-list-create'),
    path('products/<int:pk>/', views.product_detail, name='product-detail'),

    # Product Variants URLs
    path('products/<int:product_pk>/variants/', views.product_variants, name='product-variants'),
    path('products/<int:product_pk>/variants/<int:pk>/', views.variant_detail, name='variant-detail'),

    # Product Images URLs
    path('products/<int:product_pk>/images/', views.product_images, name='product-images'),
    path('products/<int:product_pk>/images/<int:pk>/', views.image_detail, name='image-detail'),

    # Brand URLs
    path('brands/', views.brand_list_create, name='brand-list-create'),
    path('brands/<int:pk>/', views.brand_detail, name='brand-detail'),

    # Category URLs
    path('categories/', views.category_list_create, name='category-list-create'),
    path('categories/<int:pk>/', views.category_detail, name='category-detail'),
]