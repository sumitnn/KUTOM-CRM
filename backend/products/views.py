from rest_framework import viewsets
from .models import Brand, MainCategory, Category, SubCategory, Product, ProductVariant, ProductImage, ProductVariantPrice, ProductVariantBulkPrice, RoleBasedProduct, ProductCommission, StockInventory, Tag, ProductFeatures
from .serializers import *
from accounts.permissions import IsAdminRole, IsAdminOrVendorRole, IsVendorRole, IsAdminStockistResellerRole
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Q
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from datetime import datetime
from accounts.utils import create_notification
from django.db import transaction
from rest_framework.exceptions import NotFound
import json
from decimal import Decimal
from accounts.models import User
from .models import ProductCommission
from django.core.paginator import Paginator

class BrandListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = request.query_params.get('search', '').strip().lower()

        brands = Brand.objects.all()
        if search_query:
            brands = brands.filter(Q(name__icontains=search_query))
        brands = brands.select_related('owner')
        serializer = BrandSerializer(brands, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user_role = getattr(request.user, 'role', None)

        if user_role not in ['admin', 'vendor']:
            return Response(
                {"message": "You do not have permission to create a brand.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        brand_name = request.data.get('name', '').strip().lower()

        if Brand.objects.filter(name__iexact=brand_name).exists():
            return Response(
                {"message": "A brand with this name already exists.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['name'] = brand_name

        serializer = BrandSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="New Brand Created",
                    message=f"A new brand '{serializer.data['name']}' has been created By {request.user.username}.",
                    notification_type="brand",
                    related_url=f"/brands/{serializer.data['id']}/"
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BrandDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, pk):
        return get_object_or_404(Brand, pk=pk)

    def has_permission(self, request, brand):
        user_role = getattr(request.user, 'role', None)
        return user_role == 'admin' or brand.owner == request.user

    def get(self, request, pk):
        brand = self.get_object(pk)
        serializer = BrandSerializer(brand, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        brand = self.get_object(pk)

        if not self.has_permission(request, brand):
            return Response(
                {"detail": "You do not have permission to update this brand."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BrandSerializer(
            brand,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="Brand Details Updated",
                    message=f"Brand '{serializer.data['name']}' has been updated by {request.user.username}.",
                    notification_type="brand update",
                    related_url=f"/brands/{serializer.data['id']}/"
                )
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        brand = self.get_object(pk)

        if not self.has_permission(request, brand):
            return Response(
                {"detail": "You do not have permission to delete this brand."},
                status=status.HTTP_403_FORBIDDEN
            )

        brand.delete()
        return Response(
            {"detail": "Brand deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )


class MainCategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, pk=None):
        if pk:
            category = get_object_or_404(MainCategory, pk=pk)
            serializer = MainCategorySerializer(category, context={'request': request})
            return Response(serializer.data)
        else:
            search_query = request.query_params.get('search', '').strip()
            queryset = MainCategory.objects.all()
                
            if search_query:
                queryset = queryset.filter(name__icontains=search_query)
            serializer = MainCategorySerializer(queryset, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ["admin", "vendor"]:
            return Response({"message": "Not authorized to create main category.", "status": False}, status=status.HTTP_403_FORBIDDEN)

        cat_name = request.data.get('name', '').strip().lower()
        if MainCategory.objects.filter(name__iexact=cat_name).exists():
            return Response({"message": "A Main Category with this name already exists.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MainCategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="New Main Category Created",
                    message=f"A new main category '{serializer.data['name']}' has been created By {request.user.username}.",
                    notification_type="main category",
                    related_url=f""
                )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Main Category id is required for update."}, status=status.HTTP_400_BAD_REQUEST)
        
        category = get_object_or_404(MainCategory, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"message": "Not authorized to update this category.", "status": False}, status=status.HTTP_403_FORBIDDEN)

        serializer = MainCategorySerializer(category, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Main Category id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        category = get_object_or_404(MainCategory, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response({"detail": "Not authorized to delete this category."}, status=status.HTTP_403_FORBIDDEN)

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            category = get_object_or_404(Category, pk=pk)
            serializer = CategorySerializer(category, context={'request': request})
            return Response(serializer.data)
        else:
            search_query = request.query_params.get('search', '').strip()
            queryset = Category.objects.all()
                
            if search_query:
                queryset = queryset.filter(name__icontains=search_query)

            serializer = CategorySerializer(queryset, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ["admin", "vendor"]:
            return Response(
                {"message": "Not authorized to create category.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        cat_name = request.data.get('name', '').strip().lower()
        if Category.objects.filter(name__iexact=cat_name).exists():
            return Response(
                {"message": "A Category with this name already exists.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="New Category Created",
                    message=f"A new category '{serializer.data['name']}' has been created By {request.user.username}.",
                    notification_type="category",
                    related_url=f""
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        if not pk:
            return Response(
                {"detail": "Category id is required for update."},
                status=status.HTTP_400_BAD_REQUEST
            )

        category = get_object_or_404(Category, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response(
                {"message": "Not authorized to update this category.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )
        update_data = request.data.get("data", request.data)

        serializer = CategorySerializer(
            category,
            data=update_data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response(
                {"detail": "Category id is required for delete."},
                status=status.HTTP_400_BAD_REQUEST
            )

        category = get_object_or_404(Category, pk=pk)

        if not (request.user.role == "admin" or category.owner == request.user):
            return Response(
                {"detail": "Not authorized to delete this category."},
                status=status.HTTP_403_FORBIDDEN
            )

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubcategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            category = get_object_or_404(Category, pk=pk)
            subcategories = SubCategory.objects.filter(category=category).order_by('name')

            if not subcategories.exists():
                return Response({"message": "No subcategories found for this category.", "status": False}, status=404)

            serializer = SubCategorySerializer(subcategories, many=True, context={'request': request})
            return Response(serializer.data)
        else:
            search_query = request.query_params.get('search', '').strip()
            queryset = SubCategory.objects.all()  
            if search_query:
                queryset = queryset.filter(name__icontains=search_query)
            serializer = SubCategorySerializer(queryset, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ["admin", "vendor"]:
            return Response({"message": "Not authorized to create subcategory.", "status": False}, status=status.HTTP_403_FORBIDDEN)

        cat_id = request.data.get('category')
        name = request.data.get('name', '').strip().lower()
        brand_id = request.data.get('brand')

        if not cat_id:
            return Response({"message": "Subcategory must have a parent category.", "status": False}, status=status.HTTP_400_BAD_REQUEST)
        
        if not brand_id:
            return Response({"message": "Subcategory must have a brand.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        if SubCategory.objects.filter(category_id=cat_id, name__iexact=name, brand_id=brand_id).exists():
            return Response({"message": "A Subcategory with this name already exists under this category.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubCategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="New Sub-Category Created",
                    message=f"A new Sub-category '{serializer.data['name']}' has been created By {request.user.username}.",
                    notification_type="subcategory",
                    related_url=f""
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if not pk:
            return Response({"detail": "Subcategory id is required for update."}, status=status.HTTP_400_BAD_REQUEST)

        subcategory = get_object_or_404(SubCategory, pk=pk)

        if not (request.user.role == "admin" or subcategory.owner == request.user):
            return Response({"detail": "Not authorized to update this subcategory."}, status=status.HTTP_403_FORBIDDEN)

        serializer = SubCategorySerializer(subcategory, data=request.data.get("data", {}), partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"detail": "Subcategory id is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        subcategory = get_object_or_404(SubCategory, pk=pk)

        if not (request.user.role == "admin" or subcategory.owner == request.user):
            return Response({"detail": "Not authorized to delete this subcategory."}, status=status.HTTP_403_FORBIDDEN)

        subcategory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def parse_json_field(data, field, default=None):
    """Parse a field that comes as a list with a JSON string inside."""
    if field not in data:
        return default or []
    raw_value = data.get(field)
    if isinstance(raw_value, list) and raw_value:
        raw_value = raw_value[0]  # take first element
    if isinstance(raw_value, str) and raw_value.startswith("["):
        try:
            return json.loads(raw_value)
        except json.JSONDecodeError:
            return default or []
    return default or []


class ProductListCreateAPIView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminOrVendorRole()]
        return [IsAuthenticated()]

    def get(self, request):
        search = request.query_params.get("search")
        category = request.query_params.get("category")
        product_type = request.query_params.get("type")
        featured = request.query_params.get("featured")

        # Get role-based products for the current user
        if request.user.role == "admin":
            role_products = RoleBasedProduct.objects.filter(role="vendor")
        else:
            role_products = RoleBasedProduct.objects.filter(user=request.user)
        
        if search:
            role_products = role_products.filter(
                Q(product__name__icontains=search) |
                Q(product__description__icontains=search) |
                Q(product__sku__icontains=search) |
                Q(product__tags__name__icontains=search)
            ).distinct()

        if category:
            role_products = role_products.filter(product__category_id=category)

        if product_type:
            role_products = role_products.filter(product__product_type=product_type)

        if featured and featured.lower() in ["1", "true", "yes"]:
            role_products = role_products.filter(is_featured=True)

        serializer = RoleBasedProductSerializer(
            role_products, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
      
        data = request.data
        
        if "short_description" in data and len(data["short_description"]) > 450:
            data["short_description"] = data["short_description"][:450]
        
        serializer = ProductCreateSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            product = serializer.save()

        # Notify admin
        admin_user = User.objects.filter(role="admin").first()
        if admin_user:
            create_notification(
                user=admin_user,
                title="New Product Created",
                message=f"A new product '{product.name}' was created by {request.user.username}.",
                notification_type="product",
                related_url=f"/products/{product.id}/",
            )

        return Response(
            ProductSerializer(product, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProductDetailAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get_object(self, pk, user):
       
        """Get the role-based product for the current user"""
        
        if user.role == "admin":
            # Admins can always access the product
            try:
                return RoleBasedProduct.objects.get(id=pk)
            except RoleBasedProduct.DoesNotExist:
                raise NotFound("Product not found ")
        else:
            try:
                return RoleBasedProduct.objects.get(
                    product_id=pk, 
                    user=user,
                    role=user.role
                )
            except RoleBasedProduct.DoesNotExist:
                raise NotFound("Product not found or you don't have permission to access it")

    def get(self, request, pk):
        role_product = self.get_object(pk, request.user)
        serializer = RoleBasedProductSerializer(role_product, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if user has permission to update this product
        role_based_product = RoleBasedProduct.objects.filter(product=product, user=request.user).first()
        if not role_based_product and not request.user.role == "admin":
            return Response({"error": "You don't have permission to update this product"}, 
                           status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        if "short_description" in data and len(data["short_description"]) > 450:
            data["short_description"] = data["short_description"][:450]
        
        print(data)

        serializer = ProductUpdateSerializer(
            product, 
            data=data, 
            context={"request": request},
            partial=True  # Allow partial updates
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            product = serializer.save()


        # Notify admin about product update
        admin_user = User.objects.filter(role="admin").first()
        if admin_user:
            create_notification(
                user=admin_user,
                title="Product Updated",
                message=f"Product '{product.name}' was updated by {request.user.username}.",
                notification_type="product",
                related_url=f"/products/{product.id}/",
            )

        return Response(
            ProductSerializer(product, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        role_product = self.get_object(pk, request.user)
        product = role_product.product
        
        # Delete the role-based product entry
        role_product.delete()
        
        # If no other role-based products reference this product, delete the product itself
        if not RoleBasedProduct.objects.filter(product=product).exists():
            product.delete()
            
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductStatusUpdateView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get_object(self, pk):
        return get_object_or_404(Product, pk=pk)

    def put(self, request, pk):
        product = self.get_object(pk)
        
        
        # Check if user has permission to update this product
        if request.user.role != "admin" and not RoleBasedProduct.objects.filter(product=product, user=request.user).exists():
            return Response(
                {"message": "You don't have permission to update this product", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )


        new_status = request.data.get('status')
        
        if request.user.role == 'admin':
            if new_status not in ['draft', 'published']:
                return Response(
                    {'message': 'Status must be either "draft" or "published"', "status": False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            product.status = new_status
            product.save()
            product_owner=RoleBasedProduct.objects.get(product=product, role="vendor")
            
            create_notification(
                user=product_owner.user,
                title="Product Request Status Updated by Admin",
                message=f"Product '{product.name}' status was updated to {new_status} by Admin.",
                notification_type="product request",
                related_url=f"/products/{product.id}/"
            )
                
            return Response(
                {
                    'message': 'Product status updated successfully.',
                    "status": True
                },
                status=status.HTTP_200_OK
            )

        if new_status not in ['active', 'inactive']:
            return Response(
                {'message': 'Status must be either "active" or "inactive"', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update is_featured based on status for role-based product
        role_product = RoleBasedProduct.objects.get(product=product, user=request.user)
        role_product.is_featured = (new_status == 'active')
        role_product.save()

        return Response(
            {
                'message': 'Product feature status updated successfully.',
                "status": True
            },
            status=status.HTTP_200_OK
        )


class ProductByStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        status_param = request.query_params.get("status")
        featured = request.query_params.get("featured")
        page_size = request.query_params.get("page_size", 10)

        if not status_param:
            return Response(
                {"message": "Status query parameter is required.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get role-based products for the current user with proper DISTINCT ON ordering
        if request.user.role == 'admin':
            role_products = (
                RoleBasedProduct.objects
                .filter(product__isnull=False)
                .distinct('product')
            )
        else:
            products_id = Product.objects.filter(owner=request.user).values_list('id', flat=True)
            role_products = RoleBasedProduct.objects.filter(
                product_id__in=products_id, 
                user=request.user, 
                role=request.user.role
            ).order_by('product')

        if status_param == "active":
            role_products = role_products.filter(is_featured=True)
        elif status_param == "inactive":
            role_products = role_products.filter(is_featured=False)
        elif status_param in ["draft", "published"]:
            role_products = role_products.filter(product__status=status_param)

        if featured and featured.lower() in ["1", "true", "yes"]:
            role_products = role_products.filter(is_featured=True)

        # Apply final ordering for consistent pagination
        role_products = role_products

        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = int(page_size)
        paginated_products = paginator.paginate_queryset(role_products, request)

        serializer = RoleBasedProductSerializer(
            paginated_products, many=True, context={"request": request}
        )

        return paginator.get_paginated_response(serializer.data)


class MyProductListAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]
    
    def get(self, request):
        # Get all filter parameters
        page_number = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 10)
        search_term = request.GET.get('search', '').strip()
        featured_filter = request.GET.get('featured', 'all')
        category_filter = request.GET.get('category', 'all')
        brand_filter = request.GET.get('brand', 'all')
        sort_field = request.GET.get('sort_by', 'name')
        sort_direction = request.GET.get('sort_direction', 'asc')
        

        # Convert to proper types
        try:
            page_number = int(page_number)
            page_size = int(page_size)
        except (ValueError, TypeError):
            page_number = 1
            page_size = 10
        
        # Base queryset
        role_products = RoleBasedProduct.objects.filter(
            user=request.user, 
            role=request.user.role
        ).select_related('product', 'product__category', 'product__brand', 'product__subcategory')
        
        # Search filter
        if search_term:
            role_products = role_products.filter(
                Q(product__name__icontains=search_term) |
                Q(product__description__icontains=search_term) |
                Q(product__sku__icontains=search_term)
            )
        
        # Featured filter
        if featured_filter != 'all' and featured_filter != '':
            is_featured = featured_filter == 'featured'
            role_products = role_products.filter(is_featured=is_featured)
        
        # Category filter
        if category_filter != 'all' and category_filter != '':
            role_products = role_products.filter(product__category_id=category_filter)
        
        # Brand filter
        if brand_filter != 'all' and brand_filter != '':
            role_products = role_products.filter(product__brand_id=brand_filter)
        
        # Sorting
        sort_prefix = '-' if sort_direction.lower() == 'desc' else ''
        field_mapping = {
            'name': 'product__name',
            'price': 'price',
            'created_at': 'product__created_at',
            'updated_at': 'product__updated_at',
            'status': 'product__status',
            'quantity': 'product__total_quantity',  # Assuming you have this field
        }
        db_sort_field = field_mapping.get(sort_field, 'product__name')
        role_products = role_products.order_by(f'{sort_prefix}{db_sort_field}')
        
        # Count
        total_count = role_products.count()
        
        # Pagination
        paginator = Paginator(role_products, page_size)
        try:
            paginated_role_products = paginator.page(page_number)
        except:
            paginated_role_products = paginator.page(1)
        
        # Serialize
        serializer = ADMINRoleBasedProductSerializer(
            paginated_role_products, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': total_count,
            'total_pages': paginator.num_pages,
            'current_page': page_number,
            'next': paginated_role_products.has_next(),
            'previous': paginated_role_products.has_previous(),
            'results': serializer.data
        })

class ProductCommissionAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]
    
    def get(self, request, product_id):
        try:
            commission = ProductCommission.objects.get(
                role_product__product_id=product_id,
                role_product__user=request.user
            )
            serializer = ProductCommissionSerializer(commission)
            return Response(serializer.data)
        except ProductCommission.DoesNotExist:
            return Response({
                'reseller_commission_value': '0.00',
                'stockist_commission_value': '0.00',
                'admin_commission_value': '0.00',
                'commission_type': 'percentage'
            })
    
    def put(self, request, product_id):
       
 
        try:
            role_product = RoleBasedProduct.objects.get(
                id=product_id,
                user=request.user
            )
            
            commission= ProductCommission.objects.filter(
                role_product=role_product
            ).last()
            
            if commission:
                serializer = ProductCommissionSerializer(commission, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(ProductCommissionSerializer(commission).data)
            
        except RoleBasedProduct.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ProductPriceUpdateAPIView(APIView):
    permission_classes = [IsAdminRole]
    
    def put(self, request, product_id, variant_id):

        try:
            updated = ProductVariantPrice.objects.filter(id=variant_id).update(price=request.data.get('price'))

            if updated == 0:
                return Response(
                    {"error": "No matching ProductVariantPrice found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response({"success": True})
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ProductFeaturedStatusAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]
    
    def put(self, request, product_id):
        try:
            role_product = RoleBasedProduct.objects.get(
                id=product_id,
                user=request.user
            )
            role_product.is_featured = request.data.get('is_featured', False)
            role_product.save()
            
            return Response({'success': True, 'is_featured': role_product.is_featured})
        except RoleBasedProduct.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ProductStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_products = RoleBasedProduct.objects.filter(user=user)
        products = [rp.product for rp in role_products]

        labels = []
        data = []

        for product in products:
            labels.append(product.name or product.sku)
            # Calculate total quantity from inventory
            total_quantity = StockInventory.objects.filter(
                product=product, user=user
            ).aggregate(total=Sum('total_quantity'))['total'] or 0
            data.append(total_quantity)

        return Response({
            'labels': labels,
            'data': data,
        })


class ActiveProductListView(generics.ListAPIView):
    serializer_class = ProductDropdownSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        role_products = RoleBasedProduct.objects.filter(
            user=self.request.user, 
            role=self.request.user.role,
            is_featured=True
        )
        return [rp.product for rp in role_products]


class ProductVariantListByProductView(generics.ListAPIView):
    serializer_class = ProductVariantMiniSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductVariant.objects.filter(product_id=product_id, is_active=True)


class StockListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        user = request.user
        queryset = StockInventory.objects.filter(user=user)
        

        product = request.query_params.get('product')
        variant = request.query_params.get('variant')
        status=request.query_params.get('status')

        if product:
            queryset = queryset.filter(product=product)

        if variant:
            queryset = queryset.filter(variant=variant)
        if status =="new_stock":
            queryset = queryset.filter(created_at__date=datetime.now().date())
        elif status =="in_stock":
            queryset = queryset.filter(total_quantity__gt=5)
        elif status =="out_of_stock":
            queryset = queryset.filter(total_quantity__lte=5)

        serializer = StockInventorySerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StockInventorySerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = StockInventory.objects.all()
    serializer_class = StockInventorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StockInventory.objects.filter(user=self.request.user)


class AdminProductPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminProductListView(generics.ListAPIView):
    serializer_class = ADMINRoleBasedProductSerializer
    pagination_class = AdminProductPagination
    permission_classes = [IsAdminStockistResellerRole]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['product__name', 'product__sku', 'product__short_description']
    filterset_fields = {
        'product__brand': ['exact'],
        'product__category': ['exact'],
        'product__subcategory': ['exact'],
        'product__is_active': ['exact'],
        'product__status': ['exact'],
    }

    def get_queryset(self):
        queryset = RoleBasedProduct.objects.filter(
            role="admin",
            product__status="published"
        ).select_related(
            'product__brand', 'product__category', 'product__subcategory', 'user'
        ).prefetch_related(
            'product__images', 'product__role_based_products__commission'
        )

        # 🔎 filters
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        subcategory = self.request.query_params.get('subcategory')
        brand = self.request.query_params.get('brand')

        if search:
            queryset = queryset.filter(
                Q(product__name__icontains=search) |
                Q(product__short_description__icontains=search) |
                Q(product__sku__icontains=search)
            )

        if category:
            queryset = queryset.filter(product__category_id=category)

        if subcategory:
            queryset = queryset.filter(product__subcategory_id=subcategory)

        if brand:
            queryset = queryset.filter(product__brand_id=brand)

        return queryset.order_by('-created_at')


class ProductCommissionDetail(APIView):
    permission_classes = [IsAdminRole]
    
    def get_object(self, product_id):
        try:
            role_product = RoleBasedProduct.objects.get(
                product_id=product_id, 
                role='admin'
            )
            return ProductCommission.objects.get(role_product=role_product)
        except (RoleBasedProduct.DoesNotExist, ProductCommission.DoesNotExist):
            raise NotFound(detail="Invalid product ID or commission not found")

    def get(self, request, product_id, format=None):
        commission = self.get_object(product_id)
        serializer = ProductCommissionSerializer(commission)
        return Response(serializer.data)

    def patch(self, request, product_id, format=None):
        commission = self.get_object(product_id)
        serializer = ProductCommissionSerializer(
            commission, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except ValueError as e:
                return Response(
                    {'detail': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StockHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, stock_id):
        
        try:
            stock = StockInventory.objects.filter(id=stock_id, user=request.user).first()
            if not stock:
                return Response({"error": "Stock not found"}, status=status.HTTP_404_NOT_FOUND)

            history = StockInventoryHistory.objects.filter(stock_inventory=stock).order_by('-created_at')
            serializer = StockInventoryHistorySerializer(history, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)