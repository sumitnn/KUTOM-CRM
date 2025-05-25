from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from .models import Brand, Category
from .serializers import BrandSerializer, CategorySerializer
from .models import Product, ProductImage, ProductVariant
from .serializers import (
    ProductReadSerializer,
    ProductWriteSerializer,
    ProductVariantSerializer,
    ProductImageSerializer
)
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def product_list_create(request):
    """Handle product listing and creation"""
    try:
        if request.method == 'GET':
            products = Product.objects.select_related('brand', 'category').prefetch_related(
                'images', 'variants'
            ).order_by('-created_at')
            serializer = ProductReadSerializer(products, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = ProductWriteSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            product = serializer.save()
            response_serializer = ProductReadSerializer(product)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Product list/create error: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing your request."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def product_detail(request, pk):
    """Handle product retrieval, update and deletion"""
    try:
        product = get_object_or_404(
            Product.objects.select_related('brand', 'category').prefetch_related('images', 'variants'),
            pk=pk
        )
        
        if request.method == 'GET':
            serializer = ProductReadSerializer(product)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ProductWriteSerializer(
                product, 
                data=request.data, 
                partial=partial,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            updated_product = serializer.save()
            response_serializer = ProductReadSerializer(updated_product)
            return Response(response_serializer.data)
        
        elif request.method == 'DELETE':
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        logger.error(f"Product detail error for ID {pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing your request."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def product_variants(request, product_pk):
    """Handle variant listing and creation for a product"""
    try:
        product = get_object_or_404(Product, pk=product_pk)
        
        if request.method == 'GET':
            variants = product.variants.all()
            serializer = ProductVariantSerializer(variants, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = ProductVariantSerializer(
                data=request.data,
                context={'product': product, 'request': request}
            )
            serializer.is_valid(raise_exception=True)
            variant = serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Product variants error for product ID {product_pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing variants."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def variant_detail(request, product_pk, pk):
    """Handle variant operations"""
    try:
        variant = get_object_or_404(
            ProductVariant.objects.filter(product_id=product_pk),
            pk=pk
        )
        
        if request.method == 'GET':
            serializer = ProductVariantSerializer(variant)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ProductVariantSerializer(
                variant,
                data=request.data,
                partial=partial,
                context={'product': variant.product, 'request': request}
            )
            serializer.is_valid(raise_exception=True)
            updated_variant = serializer.save()
            return Response(ProductVariantSerializer(updated_variant).data)
        
        elif request.method == 'DELETE':
            variant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        logger.error(f"Variant detail error for ID {pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing the variant."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def product_images(request, product_pk):
    """Handle image listing and creation for a product"""
    try:
        product = get_object_or_404(Product, pk=product_pk)
        
        if request.method == 'GET':
            images = product.images.order_by('display_order')
            serializer = ProductImageSerializer(images, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = ProductImageSerializer(
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            image = serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Product images error for product ID {product_pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing images."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def image_detail(request, product_pk, pk):
    """Handle image operations"""
    try:
        image = get_object_or_404(
            ProductImage.objects.filter(product_id=product_pk),
            pk=pk
        )
        
        if request.method == 'GET':
            serializer = ProductImageSerializer(image)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ProductImageSerializer(
                image,
                data=request.data,
                partial=partial,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            updated_image = serializer.save()
            return Response(ProductImageSerializer(updated_image).data)
        
        elif request.method == 'DELETE':
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        logger.error(f"Image detail error for ID {pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing the image."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Brand and Category views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def brand_list_create(request):
    """Handle brand listing and creation"""
    try:
        if request.method == 'GET':
            brands = Brand.objects.all().order_by('name')
            serializer = BrandSerializer(brands, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = BrandSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            brand = serializer.save()
            return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Brand list/create error: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing your request."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def brand_detail(request, pk):
    """Handle brand retrieval, update and deletion"""
    try:
        brand = get_object_or_404(Brand, pk=pk)

        if request.method == 'GET':
            serializer = BrandSerializer(brand)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = BrandSerializer(brand, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            updated_brand = serializer.save()
            return Response(BrandSerializer(updated_brand).data)

        elif request.method == 'DELETE':
            brand.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        logger.error(f"Brand detail error for ID {pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing your request."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def category_list_create(request):
    """Handle category listing and creation"""
    try:
        if request.method == 'GET':
            categories = Category.objects.all().order_by('display_order', 'name')
            serializer = CategorySerializer(categories, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = CategorySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            category = serializer.save()
            return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Category list/create error: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing your request."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def category_detail(request, pk):
    """Handle category retrieval, update and deletion"""
    try:
        category = get_object_or_404(Category, pk=pk)

        if request.method == 'GET':
            serializer = CategorySerializer(category)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = CategorySerializer(category, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            updated_category = serializer.save()
            return Response(CategorySerializer(updated_category).data)

        elif request.method == 'DELETE':
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        logger.error(f"Category detail error for ID {pk}: {str(e)}")
        return Response(
            {"detail": "An error occurred while processing your request."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )