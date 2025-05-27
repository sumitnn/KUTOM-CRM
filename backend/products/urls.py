from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet)
router.register(r'variants', ProductVariantViewSet)
router.register(r'product-images', ProductImageViewSet)




urlpatterns = [
    path('', include(router.urls)),
]