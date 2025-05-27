from rest_framework import viewsets
from .models import Brand
from .serializers import *
from accounts.permissions import IsAdminOrResellerRole
from rest_framework.permissions import IsAuthenticated



class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticated, IsAdminOrResellerRole]
    pagination_class=None


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('display_order', 'name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrResellerRole]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminOrResellerRole]

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all().order_by('-is_default')
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated, IsAdminOrResellerRole]

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all().order_by('display_order')
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated, IsAdminOrResellerRole]