from rest_framework import viewsets
from .models import Brand
from .serializers import *
from accounts.permissions import IsAdminRole,IsAdminOrVendorRole,IsVendorRole,IsAdminStockistResellerRole
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum,Q
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from datetime import datetime
from accounts.utils import create_notification
from django.db import transaction
from rest_framework.exceptions import NotFound

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
            admin_user=User.objects.filter(role='admin').first()
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
            admin_user=User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="Brand Details Updated",
                    message=f"brand '{serializer.data['name']}' has been updated by {request.user.username}.",
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
            admin_user=User.objects.filter(role='admin').first()
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
            return Response({"message": "Not authorized to update this category.","status":False}, status=status.HTTP_403_FORBIDDEN)

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
            admin_user=User.objects.filter(role='admin').first()
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
                return Response({"message": "No subcategories found for this category.","status":False}, status=404)

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
            return Response({"message": "Not authorized to create subcategory.","status":False}, status=status.HTTP_403_FORBIDDEN)

        cat_id = request.data.get('category')
        name = request.data.get('name', '').strip().lower()
        brand_id= request.data.get('brand')

        if not cat_id:
            return Response({"message": "Subcategory must have a parent category.","status":False}, status=status.HTTP_400_BAD_REQUEST)
        
        if not brand_id:
            return Response({"message": "Subcategory must have a brand.","status":False}, status=status.HTTP_400_BAD_REQUEST)

        if SubCategory.objects.filter(category_id=cat_id, name__iexact=name,brand_id=brand_id).exists():
            return Response({"message": "A Subcategory with this name already exists under this category.", "status": False}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubCategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            admin_user=User.objects.filter(role='admin').first()
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

        serializer = SubCategorySerializer(subcategory, data=request.data.get("data",{}), partial=True, context={'request': request})
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



class ProductListNotApprovedAPIView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrVendorRole]
        return [IsAdminOrVendorRole]

    def get(self, request):
        products = Product.objects.filter(approved_by_Admin=False)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    def post(self, request):

        print("Request Data:", request.data)  
        serializer = ProductSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ProductListCreateAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrVendorRole()]
        return [IsAuthenticated()]

    def get(self, request):
        # Get query parameters
        search = request.query_params.get('search', None)
        category = request.query_params.get('category', None)
        product_type = request.query_params.get('type', None)
        featured = request.query_params.get('featured', None)
        
        # Start with all products
        products = Product.objects.all()
        
        # Apply filters if provided
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        if category:
            products = products.filter(category_id=category)
            
        if product_type:
            products = products.filter(product_type=product_type)
            
        if featured:
            products = products.filter(is_featured=True)

        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        # Truncate short_description if too long
        if 'short_description' in data and len(data['short_description']) > 450:
            data['short_description'] = data['short_description'][:450]


        # Safely load JSON fields
        for field in ['tags', 'features', 'sizes', 'price_tiers']:
            if field in data:
                value = data.get(field)
                if isinstance(value, str):
                    try:
                        if field =="features":
                             data[field] =value
                        else:

                            data[field] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return Response(
                            {field: "Invalid JSON format"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        # Create product
        serializer = ProductSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            product = serializer.save(owner=request.user)

            if 'tags' in data and isinstance(data['tags'], list):
                tag_ids = []
                for tag_name in data['tags']:
                    tag_obj, _ = Tag.objects.get_or_create(name=tag_name, defaults={'owner': request.user})
                    tag_ids.append(tag_obj.id)
                product.tags.set(tag_ids)

            # Save main images
            if 'image' in request.FILES:
                image_list = request.FILES.getlist('image')
                if image_list:
                    ProductImage.objects.create(
                        product=product,
                        image=image_list[0], 
                        is_featured=True,
                        is_default=True
                    )

            # Save additional images
            if 'additional_images' in request.FILES:
                for img in request.FILES.getlist('additional_images'):
                    ProductImage.objects.create(
                        product=product,
                        image=img,
                        is_featured=True,
                        is_default=False
                    )
         
            
            # Save sizes and track them by index
            saved_sizes = []
            if 'sizes' in data and isinstance(data['sizes'], list):
                for size_data in data['sizes']:
                    size_serializer = ProductSizeSerializer(data={**size_data, "product": product.id})
                    if size_serializer.is_valid():
                        size_instance = size_serializer.save()
                        saved_sizes.append(size_instance)
                    else:
                        return Response(size_serializer.errors, status=400)

            # Save price tiers with size reference using sizeIndex
            if 'price_tiers' in data and isinstance(data['price_tiers'], list):
                for tier_data in data['price_tiers']:
                    size_index = tier_data.get('sizeIndex')
                    if size_index is None or size_index >= len(saved_sizes):
                        return Response(
                            {"price_tiers": f"Invalid sizeIndex: {size_index}"},
                            status=400
                        )

                    tier_serializer = ProductPriceTierSerializer(data=tier_data)
                    if tier_serializer.is_valid():
                        tier_serializer.save(
                            product=product,
                            size=saved_sizes[size_index]
                        )
                    else:
                        return Response(tier_serializer.errors, status=400)
                    
            admin_user=User.objects.filter(role='admin').first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="New Product Created",
                    message=f"A new product '{product.name}' has been created. by {request.user.username}.",
                    notification_type="product",
                    related_url=f"/products/{product.id}/"
                )

            return Response(
                ProductSerializer(product, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class AdminProductDetailView(generics.RetrieveUpdateAPIView):
    queryset = AdminProduct.objects.all()
    
    serializer_class = AdminProductDetailSerializer
    permission_classes = [IsAdminStockistResellerRole] 


class ProductCommissionDetail(APIView):
    permission_classes = [IsAdminRole]
    
    def get_object(self, product_id):
        try:
            return ProductCommission.objects.get(admin_product_id=product_id)
        except ProductCommission.DoesNotExist:
            
            raise NotFound(detail="Invalid product ID or commission not found")

    def get(self, request, product_id, format=None):
        commission = self.get_object(product_id)
        serializer = AdminProductCommissionSerializer(commission)
        return Response(serializer.data)

    def patch(self, request, product_id, format=None):
        
        commission = self.get_object(product_id)
        serializer = AdminProductCommissionSerializer(
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


class ProductDetailAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get_object(self, pk):
        return get_object_or_404(Product.objects.prefetch_related(
            'images', 'sizes', 'price_tiers', 'tags'
        ), pk=pk)

    def get(self, request, pk):
        
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        product = self.get_object(pk)
        data = request.data.copy()

        self.check_object_permissions(request, product)

        # Truncate short_description if too long
        if 'short_description' in data and len(data['short_description']) > 450:
            data['short_description'] = data['short_description'][:450]

        # Safely load JSON fields
        for field in ['tags', 'features', 'sizes', 'price_tiers']:
            if field in data:
                value = data.get(field)
                if isinstance(value, str):
                    try:
                        if field == "features":
                            data[field] = value
                        else:
                            data[field] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return Response(
                            {field: "Invalid JSON format"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        
        with transaction.atomic():  # Ensure full update or rollback
            serializer = ProductSerializer(
                product,
                data=data,
                partial=True,
                context={'request': request}
            )

            if serializer.is_valid():
                product = serializer.save()
                product.status = "draft"
                product.save()

                # Handle tags update
                if 'tags' in data and isinstance(data['tags'], list):
                    tag_ids = []
                    for tag_name in data['tags']:
                        tag_obj, _ = Tag.objects.get_or_create(
                            name=tag_name, defaults={'owner': request.user}
                        )
                        tag_ids.append(tag_obj.id)
                    product.tags.set(tag_ids)

                # Handle featured image update
                if 'image' in request.FILES:
                    old_images = product.images.filter(is_default=True)
                    for img in old_images:
                        img.image.delete(save=False)
                    old_images.delete()

                    image_list = request.FILES.getlist('image')
                    if image_list:
                        ProductImage.objects.create(
                            product=product,
                            image=image_list[0],
                            is_featured=True,
                            is_default=True
                        )

                # Handle additional images
                if 'additional_images' in request.FILES:
                    old_additional_images = product.images.filter(is_default=False)
                    for img in old_additional_images:
                        img.image.delete(save=False)
                    old_additional_images.delete()

                    for img in request.FILES.getlist('additional_images'):
                        ProductImage.objects.create(
                            product=product,
                            image=img,
                            is_featured=True,
                            is_default=False
                        )

                # Delete old sizes
                product.sizes.all().delete()

                # Handle sizes
                saved_sizes = []
                if 'sizes' in data and isinstance(data['sizes'], list):
                    temp_sizes = []
                    for size_data in data['sizes']:
                        size_data = size_data.copy()
                        size_data['product'] = product.id
                        original_default = size_data.pop('is_default', False)

                        size_serializer = ProductSizeSerializer(data=size_data)
                        if size_serializer.is_valid():
                            size_instance = size_serializer.save()
                            temp_sizes.append((size_instance, original_default))
                        else:
                            return Response(
                                {'sizes': size_serializer.errors},
                                status=status.HTTP_400_BAD_REQUEST
                            )

                    for size_instance, original_default in temp_sizes:
                        if original_default:
                            size_instance.is_default = True
                            size_instance.save()
                        saved_sizes.append(size_instance)
                
                # Handle price tiers
                if 'price_tiers' in data and isinstance(data['price_tiers'], list):
                    product.price_tiers.all().delete()
                    for tier_data in data['price_tiers']:
                        size_index = tier_data.get('sizeIndex')
                        if size_index is None or size_index >= len(saved_sizes):
                            return Response(
                                {"price_tiers": f"Invalid sizeIndex: {size_index}"},
                                status=400
                            )

                        tier_data = tier_data.copy()
                        tier_serializer = ProductPriceTierSerializer(data=tier_data)
                        if tier_serializer.is_valid():
                            tier_serializer.save(
                                product=product,
                                size=saved_sizes[size_index]
                            )
                        else:
                            return Response(
                                {'price_tiers': tier_serializer.errors},
                                status=status.HTTP_400_BAD_REQUEST
                            )

                # Optional: Admin notification
                admin_user = User.objects.filter(role='admin').first()
                if admin_user:
                    create_notification(
                        user=admin_user,
                        title="Product Updated",
                        message=f"Product '{product.name}' was updated by {request.user.username}.",
                        notification_type="product",
                        related_url=f"/products/{product.id}/"
                    )

                return Response(
                    ProductSerializer(product, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductStatusUpdateView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get_object(self, pk):
        return get_object_or_404(Product, pk=pk)

    def put(self, request, pk):
        product = self.get_object(pk)
        self.check_object_permissions(request, product)
        
        # Get status from request data
        new_status = request.data.get('status')
        if request.user.role=='admin':
            if new_status not in ['draft', 'published']:
                return Response(
                    {'message': 'Status must be either "draft" or "published"', "status": False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            product.status = new_status
            product.save()
            create_notification(
                    user=product.owner,
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
        
        # Update is_featured based on status
        product.is_featured = (new_status == 'active')
        product.save()

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
        status_param = request.query_params.get('status')
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)

        if not status_param:
            return Response(
                {'message': 'Status query parameter is required.', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            return Response(
                {'message': 'Invalid page or page_size parameter.', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Define queryset based on status
        if status_param == 'draft':
            products = Product.objects.filter(status='draft')
        elif status_param == 'published':
            products = Product.objects.filter(status='published')
        elif status_param == 'active':
            products = Product.objects.filter(status='published', is_featured=True)
        elif status_param == 'inactive':
            products = Product.objects.filter(status='published', is_featured=False)
        else:
            return Response(
                {'message': 'Invalid status parameter.', "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = page_size
        paginated_products = paginator.paginate_queryset(products, request)
        
        serializer = ProductSerializer(
            paginated_products,
            many=True,
            context={'request': request}
        )
        
        return paginator.get_paginated_response(serializer.data)

class MyProductListAPIView(APIView):
    permission_classes = [IsAdminOrVendorRole]

    def get(self, request):
        products = Product.objects.filter(owner=request.user)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
class ProductStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        products = Product.objects.filter(owner=user)

        labels = []
        data = []

        for product in products:
            labels.append(product.name or product.sku)
            total_quantity = (
                Product.objects
                .filter(product=product)
                .aggregate(total=Sum('quantity'))['total'] or 0
            )
            data.append(total_quantity)

        return Response({
            'labels': labels,
            'data': data,
        })
    



class VendorActiveProductListView(generics.ListAPIView):
    serializer_class = ProductDropdownSerializer
    permission_classes = [IsVendorRole]
    pagination_class=None

    def get_queryset(self):
        return Product.objects.filter(is_featured=True, owner=self.request.user)

class AdminActiveProductListView(generics.ListAPIView):
    serializer_class = AdminProductDropdownSerializer
    permission_classes = [IsAdminStockistResellerRole]
    pagination_class=None

    def get_queryset(self):
        return AdminProduct.objects.filter(is_active=True)



# View to fetch all sizes for a selected product
class ProductSizeListByProductView(generics.ListAPIView):
    serializer_class = ProductSizeSerializer
    permission_classes = [IsVendorRole]
    pagination_class=None

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductSize.objects.filter(product_id=product_id, is_active=True)
    
class AdminProductSizeListByProductView(generics.ListAPIView):
    serializer_class = AdminProductSizeSerializer
    permission_classes = [IsAdminStockistResellerRole]
    pagination_class=None

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return AdminProductSize.objects.filter(product_id=product_id, is_active=True)

class StockListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsVendorRole()]
        return super().get_permissions()

    def get(self, request):
        user = request.user
        queryset = Stock.objects.filter(owner=user)

        product = request.query_params.get('product')
        status_param = request.query_params.get('status')

        if product:
            queryset = queryset.filter(product=product)

        if status_param:
            today = datetime.now().date()
            if status_param == "new_stock":
                queryset = queryset.filter(created_at__date=today)
            elif status_param == "in_stock":
                queryset = queryset.filter(status='in_stock').exclude(created_at__date=today)
            elif status_param == "out_of_stock":
                queryset = queryset.filter(status='out_of_stock')


        serializer = StockSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StockSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsVendorRole]


class AdminProductPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminStockListView(generics.ListAPIView):
    serializer_class = AdminProductSerializer
    pagination_class = AdminProductPagination
    permission_classes = [IsAdminStockistResellerRole]

    def get_queryset(self):
        queryset = AdminProduct.objects.all().order_by('-created_at')
        status = self.request.query_params.get('status')
        if status in ['in_stock', 'out_of_stock']:
            queryset = queryset.filter(stock_status=status)
        return queryset
    
class AdminProductListView(generics.ListAPIView):
    serializer_class = AdminProductListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'sku', 'short_description']
    filterset_fields = {
        'brand': ['exact'],
        'category': ['exact'],
        'subcategory': ['exact'],
        'is_active': ['exact'],
        'stock_status': ['exact'],
    }
    
    def get_queryset(self):
        queryset = AdminProduct.objects.select_related(
            'brand', 'category', 'subcategory'
        ).prefetch_related('images').filter(is_active=True)
        
        # Additional filters from query params
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        subcategory = self.request.query_params.get('subcategory', None)
        brand = self.request.query_params.get('brand', None)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(short_description__icontains=search) |
                Q(sku__icontains=search)
            )
        
        if category:
            queryset = queryset.filter(category_id=category)
        
        if subcategory:
            queryset = queryset.filter(subcategory_id=subcategory)
        
        if brand:
            queryset = queryset.filter(brand_id=brand)
            
        return queryset.order_by('-created_at')