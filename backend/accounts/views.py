from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .serializers import *
from .utils import get_tokens_for_user  
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import User, Profile, ProfileApprovalStatus
from .permissions import IsAdminRole, IsVendorRole, IsStockistRole, IsAdminOrStockistRole
from rest_framework import generics
from django.shortcuts import get_object_or_404
from decimal import Decimal, InvalidOperation
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from datetime import datetime
from rest_framework.decorators import api_view
from django.db.models import Sum, Q, Count
from datetime import timedelta, timezone
from orders.models import Order, OrderItem
from rest_framework.pagination import PageNumberPagination
from products.models import *
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.utils.timezone import make_aware
from django.db.models import Sum, F, DecimalField, ExpressionWrapper
from .utils import create_notification
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class RegisterView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "User registered successfully",
                "success": True
            }, status=status.HTTP_201_CREATED)
        return Response({"message": serializer.errors, "success": False}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                "message": "Email and password are required",
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email, is_active=False).exists():
            return Response({
                "message": "You can't log in now. Please wait for admin approval.",
                "success": False
            }, status=status.HTTP_403_FORBIDDEN)

        user = authenticate(request, email=email, password=password)

        if user is not None:
            tokens = get_tokens_for_user(user)
            role = getattr(user, 'role', None)
            username = getattr(user, 'username', None)
            email = getattr(user, 'email', None)

            # Safely fetch profile completion
            profile_completion = getattr(user, 'completion_percentage', 0)
            profile_pic = None
            if hasattr(user, 'profile'):
                profile_pic = getattr(user.profile, 'profile_picture', None)

            return Response({
                "message": "Login successful",
                "success": True,
                "tokens": tokens,
                "user": {
                    "username": username,
                    "email": email,
                    "role": role,
                    "profile_completed": profile_completion,
                    "profile_pic": profile_pic.url if profile_pic else None,
                    "id": user.id
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "Invalid email or password",
                "success": False
            }, status=status.HTTP_401_UNAUTHORIZED)


class GetUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = CurrentUserSerializer(user)
        return Response(serializer.data)


class UpdateUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            user_to_update = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Only admin or the user themselves can update
        if request.user != user_to_update and request.user.role != 'admin':
            return Response({"success": False, "message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(user_to_update, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "User data updated successfully"
            }, status=status.HTTP_200_OK)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class UpdateUserStatusAPIView(APIView):
    permission_classes = [IsAdminRole]
    
    def put(self, request, pk):
        status_type = request.data.get("status")

        if not status_type:
            return Response({"success": False, "message": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Map status types to actual status values
        status_mapping = {
            "suspended": "inactive_user",
            "active": "active_user",
            "pending": "pending_user",
            "rejected": "rejected_user"
        }
        
        new_status = status_mapping.get(status_type, "new_user")
        user.status = new_status
        user.save()
        
        return Response({
            "success": True,
            "message": "User status updated successfully"
        }, status=status.HTTP_200_OK)


class ListUsersView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        role = request.GET.get("role")
        status_type = request.GET.get("status")
        search = request.GET.get("search")
        search_type = request.GET.get("search_type")

        users = User.objects.exclude(role__in=['admin', 'superuser']).select_related('profile')

        if role in ["vendor", "stockist", "reseller"]:
            users = users.filter(role=role)
        
        if status_type:
            status_mapping = {
                "active": "active_user",
                "suspended": "inactive_user",
                "pending": "pending_user",
                "rejected": "rejected_user",
                "new": "new_user"
            }
            users = users.filter(status=status_mapping.get(status_type, "new_user"))

        if search:
            if search_type == "email":
                users = users.filter(Q(email__icontains=search))
            elif search_type == "phone":
                users = users.filter(Q(phone__icontains=search))
            elif search_type == "name":
                users = users.filter(Q(username__icontains=search))
            else:
                users = users.filter(
                    Q(email__icontains=search) |
                    Q(phone__icontains=search) |
                    Q(username__icontains=search)
                )

        serializer = NewUserFullDetailSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeleteUserAPIView(APIView):
    permission_classes = [IsAdminRole]

    def delete(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"message": "User not found", "success": False}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response({"message": "You cannot delete yourself", "success": False}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({"message": "User deleted successfully", "success": True}, status=status.HTTP_204_NO_CONTENT)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"message": "Refresh token is required", "success": False}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful", "success": True}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e), "success": False}, status=status.HTTP_400_BAD_REQUEST)


class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet


class WalletUpdateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        user_email = request.data.get("user_email")
        transaction_type = request.data.get("transaction_type")
        amount = request.data.get("amount")
        description = request.data.get("description", "")
        transaction_status = request.data.get("transaction_status", "SUCCESS")

        if not all([user_email, transaction_type, amount]):
            return Response({"message": "User email, transaction type and amount are required", "success": False}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=user_email)
            wallet = Wallet.objects.get(user=user)
            amount = Decimal(str(amount))
        except User.DoesNotExist:
            return Response({"message": "User not found", "success": False}, status=status.HTTP_404_NOT_FOUND)
        except Wallet.DoesNotExist:
            return Response({"message": "Wallet not found", "success": False}, status=status.HTTP_404_NOT_FOUND)
        except (InvalidOperation, ValueError):
            return Response({"message": "Invalid amount", "success": False}, status=status.HTTP_400_BAD_REQUEST)

        if transaction_type == "CREDIT":
            wallet.current_balance += amount
        elif transaction_type == "DEBIT":
            if wallet.current_balance < amount:
                return Response({"message": "Insufficient wallet balance", "success": False}, status=status.HTTP_400_BAD_REQUEST)
            wallet.current_balance -= amount
        else:
            return Response({"message": "Invalid transaction type", "success": False}, status=status.HTTP_400_BAD_REQUEST)

        wallet.save()

        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=transaction_type,
            amount=amount,
            transaction_status=transaction_status,
            description=description,
        )

        return Response({
            "message": "Wallet updated successfully",
            "success": True,
            "new_balance": wallet.current_balance
        }, status=status.HTTP_200_OK)


class WalletTransactionListView(generics.ListAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = WalletTransaction.objects.filter(wallet__user=self.request.user)
        
        transaction_type = self.request.query_params.get('type')
        status = self.request.query_params.get('status')
        start_date = self.request.query_params.get('fromDate')
        end_date = self.request.query_params.get('toDate')
        
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if status:
            queryset = queryset.filter(transaction_status=status)
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                pass
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                pass
                
        return queryset.order_by('-created_at')


class WalletSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            wallet = Wallet.objects.get(user=user)
        except Wallet.DoesNotExist:
            return Response({'error': 'Wallet not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        

        # Calculate total sales from orders where user is the seller
        total_sales = Order.objects.filter(
            seller=user,
            status='delivered'
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')

        total_withdrawals = WithdrawalRequest.objects.filter(
            user=user,
            status='approved'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        data = {
            'current_balance': wallet.current_balance,
            'payout_balance': wallet.payout_balance,
            'commission_balance': wallet.payout_balance,
            'total_sales': total_sales,
            'total_withdrawals': total_withdrawals
        }

        return Response(data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://localhost:3000/reset-password/{uid}/{token}"

            # In production, send email here
            print(f"Password reset link for {email}: {reset_link}")

            return Response({"detail": "Password reset link has been sent to your email."})
        except User.DoesNotExist:
            return Response({"detail": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        uidb64 = request.data.get("userid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not all([uidb64, token, new_password]):
            return Response({"detail": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"detail": "Password reset successfully."})
            else:
                return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response({"detail": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password changed successfully."})


class StateListView(generics.ListAPIView):
    queryset = State.objects.all()
    serializer_class = StateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class DistrictListView(generics.ListAPIView):
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        state_id = self.kwargs.get('state_id')
        return District.objects.filter(state_id=state_id)


class StockistsByStateAPIView(APIView):
    def get(self, request, state_id):
        stockists = User.objects.filter(
            role='stockist', 
            addresses__state_id=state_id
        ).distinct()
        
        if not stockists.exists():
            return Response({"error": "No stockists found for this state."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = StockistSerializer(stockists, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


def clean_null_strings(data):
    cleaned = {}
    for key, value in data.items():
        if value == "null":
            cleaned[key] = None
        else:
            cleaned[key] = value
    return cleaned


class ProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = NewUserFullDetailSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        try:
            user = request.user
            data = clean_null_strings(request.data.copy())
            response_data = {}
            

            # Handle profile update
            if any(key in data for key in ['full_name', 'date_of_birth', 'gender', 'bio']):
                profile, created = Profile.objects.get_or_create(user=user)
                profile_serializer = ProfileSerializer(
                    profile, data=data, context={'request': request}, partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                    response_data['profile'] = profile_serializer.data
                else:
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle address update
            if any(key in data for key in ['street_address', 'city', 'postal_code', 'country']):
                if 'state' in data:
                    data['state_id'] = data.pop('state')
                if 'district' in data:
                    data['district_id'] = data.pop('district')
                    data['is_primary'] = True  

                address, created = Address.objects.get_or_create(user=user)
                address_serializer = AddressSerializer(address, data=data, partial=True)
                if address_serializer.is_valid():
                    address_serializer.save()
                    response_data['address'] = address_serializer.data
                else:
                    return Response(address_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Handle company update
            if any(key in data for key in ['company_name', 'business_type', 'gst_number']):
                company, created = Company.objects.get_or_create(user=user)
                company_serializer = CompanySerializer(company, data=data, partial=True)
                if company_serializer.is_valid():
                    company_serializer.save()
                    response_data['company'] = company_serializer.data
                else:
                    return Response(company_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # handle bank details update    
            if 'payment' in data or any(key in data for key in ['upi_id', 'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'passbook_pic']):
                profile, created = Profile.objects.get_or_create(user=user)
                payment_fields = ['upi_id', 'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'passbook_pic']
                
                for field in payment_fields:
                    if field in data:
                        setattr(profile, field, data[field])
                
                profile.save()
                response_data['profile'] = ProfileSerializer(profile, context={'request': request}).data

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssignedResellersView(APIView):
    permission_classes = [IsStockistRole]

    def get(self, request):
        assigned_reseller_ids = StockistAssignment.objects.filter(
            stockist=request.user
        ).values_list('reseller_id', flat=True)

        addresses = Address.objects.filter(user__id__in=assigned_reseller_ids)
        serializer = AddressWithUserAndProfileSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BroadcastMessageListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, 'role', None)
        visible_to_filter = Q(visible_to="all")
        
        if role == 'stockist':
            visible_to_filter |= Q(visible_to="stockist")
        elif role == 'reseller':
            visible_to_filter |= Q(visible_to="reseller")
        elif role == 'vendor':
            visible_to_filter |= Q(visible_to="vendor")

        messages = BroadcastMessage.objects.filter(
            is_active=True
        ).filter(visible_to_filter).order_by('-created_at')
        
        serializer = BroadcastMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BroadcastMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(admin=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BroadcastMessageDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            message = BroadcastMessage.objects.get(pk=pk)
        except BroadcastMessage.DoesNotExist:
            return Response({"message": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        message.delete()
        return Response({"message": "Announcement deleted."}, status=status.HTTP_204_NO_CONTENT)

    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            message = BroadcastMessage.objects.get(pk=pk)
        except BroadcastMessage.DoesNotExist:
            return Response({"message": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BroadcastMessageSerializer(message, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TopUpRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = TopupRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return TopupRequest.objects.all().order_by('-created_at')
        return TopupRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TopUpRequestUpdateView(generics.UpdateAPIView):
    queryset = TopupRequest.objects.all()
    serializer_class = TopupRequestSerializer
    permission_classes = [IsAdminRole]

    def update(self, request, *args, **kwargs):
        topup = self.get_object()
        status_action = request.data.get("status")
        reason = request.data.get("rejected_reason", "")

        if status_action not in ["approved", "rejected", "completed", "pending"]:
            return Response(
                {"message": "Invalid status action.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        topup.status = status_action
        topup.reviewed_at = datetime.now()
        
        if status_action == "approved":
            topup.approved_by = request.user
            # Add funds to user's wallet
            wallet, created = Wallet.objects.get_or_create(user=topup.user)
            wallet.current_balance += topup.amount
            wallet.save()
            
            # Create wallet transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='CREDIT',
                amount=topup.amount,
                description=f"Top-up request #{topup.id} approved",
                transaction_status='SUCCESS'
            )
        
        elif status_action == "rejected" and reason:
            topup.rejected_reason = reason

        topup.save()
        return Response({"message": "Top-up status updated successfully."}, status=status.HTTP_200_OK)


class WithdrawalRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return WithdrawalRequest.objects.all().order_by('-created_at')
        return WithdrawalRequest.objects.filter(user=user).order_by('-created_at')


class UserPaymentDetailsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPaymentDetailsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        days = int(request.query_params.get('days', 30))
        
        date_from = make_aware(datetime.now() - timedelta(days=days))

        # Wallet info
        wallet, created = Wallet.objects.get_or_create(user=user)
   
        
        wallet_data = {
            'balance': wallet.current_balance,
            'payout_balance': wallet.payout_balance,
            'commission_balance': wallet.payout_balance,
            'total_sales': self.get_total_sales(user, date_from),
            'total_withdrawals': self.get_total_withdrawals(user, date_from),
        }

        # Product stats based on role
        if user.role == "vendor":
            product_stats = self.get_vendor_product_stats(user)
        elif user.role == "reseller":
            product_stats = self.get_reseller_product_stats(user)
        elif user.role == "stockist":
            product_stats = self.get_stockist_product_stats(user)
        else:
            product_stats = {}

        # Order stats
        order_stats = {
            'total': Order.objects.filter(seller=user, created_at__gte=date_from).count(),
            'pending': Order.objects.filter(seller=user, status='pending', created_at__gte=date_from).count(),
            'delivered': Order.objects.filter(seller=user, status='delivered', created_at__gte=date_from).count(),
            'cancelled': Order.objects.filter(seller=user, status='cancelled', created_at__gte=date_from).count(),
        }

        return Response({
            'wallet': wallet_data,
            'products': product_stats,
            'orders': order_stats,
        })

    def get_total_sales(self, user, date_from):
        return Order.objects.filter(
            seller=user,
            status='delivered',
            created_at__gte=date_from
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')

    def get_total_withdrawals(self, user, date_from):
        return WithdrawalRequest.objects.filter(
            user=user,
            status='approved',
            created_at__gte=date_from
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    def get_vendor_product_stats(self, user):
        role_products = RoleBasedProduct.objects.filter(user=user, role='vendor')
        return {
            'total': role_products.count(),
            'active': role_products.filter(is_featured=True).count(),
        }

    def get_reseller_product_stats(self, user):
        role_products = RoleBasedProduct.objects.filter(user=user, role='reseller')
        return {
            'total': role_products.count(),
            'active': role_products.filter(is_featured=True).count(),
        }

    def get_stockist_product_stats(self, user):
        role_products = RoleBasedProduct.objects.filter(user=user, role='stockist')
        return {
            'total': role_products.count(),
            'active': role_products.filter(is_featured=True).count(),
        }


class TodayNotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = datetime.now().date()
        notifications = Notification.objects.filter(
            user=request.user,
            created_at__date=today
        )[:10]

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NewUserCreationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = NewUserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'message': 'Invalid data',
                'errors': serializer.errors,
                'status': False
            }, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
                
        # Notify admin
        admin_users = User.objects.filter(role="admin")
        for admin_user in admin_users:
            create_notification(
                user=admin_user,
                title="New Account Application",
                message=f"New account opening application received from {user.email}",
                notification_type='new_application',
                related_url=''
            )

        return Response({
            'message': 'Application submitted successfully',
            'status': True
        }, status=status.HTTP_201_CREATED)


class NewUserApplicationListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')
        search_type = request.query_params.get('search_type')
        role_type = request.query_params.get('role')

        users = User.objects.exclude(role__in=["superuser", "admin"]).order_by('-created_at')

        if status_filter=="new":
            users = users.filter(status="new_user")
        elif status_filter=="pending":
            users = users.filter(status="pending_user")
        elif status_filter=="active":
            users = users.filter(status="active_user")
        elif status_filter=="rejected":
            users = users.filter(status="rejected_user")
        elif status_filter=="suspended":
            users = users.filter(status="inactive_user")
        else:
            users = users.filter(status="new_user")

        if role_type:
            users = users.filter(role=role_type)

        if search and search_type:
            if search_type == "email":
                users = users.filter(email__icontains=search)
            elif search_type == "name":
                users = users.filter(username__icontains=search)
            elif search_type == "phone":
                users = users.filter(phone__icontains=search)

        serializer = NewUserFullDetailSerializer(users, many=True)
        return Response(serializer.data)


class ApproveApplicationView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        default_passwords = {
            "stockist": "KutomS@123",
            "vendor": "KutomV@123",
            "reseller": "KutomR@123"
        }
        
        default_password = default_passwords.get(user.role, "Kutom@123")
        user.set_password(default_password)
        user.is_active = True
        user.status = "pending_user"
        user.save()

        create_notification(
            user=user,
            title="Account Approved",
            message="Your account has been approved by admin. You can now login.",
            notification_type='account_approval',
            related_url=''
        )

        return Response({'message': 'Application approved successfully'}, status=status.HTTP_200_OK)


class RejectNewUserApplicationView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user.status = 'rejected_user'
        user.rejected_reason = request.data.get('reason', 'No reason provided')
        user.save()

        create_notification(
            user=user,
            title="Application Rejected",
            message=f"Your application was rejected. Reason: {user.rejected_reason}",
            notification_type='account_rejection',
            related_url=''
        )

        return Response({'message': 'Application rejected successfully'}, status=status.HTTP_200_OK)


class UpdateApprovalStatusView(APIView):
    permission_classes = [IsAdminRole]

    def put(self, request, user_id):
        try:
            approval = ProfileApprovalStatus.objects.get(user__id=user_id)
        except ProfileApprovalStatus.DoesNotExist:
            return Response({'message': 'Approval status not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileApprovalStatusUpdateSerializer(approval, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            create_notification(
                user=approval.user,
                title="Profile Approval Status Updated",
                message="Your profile approval status has been updated by admin.",
                notification_type='profile_approval',
                related_url=''
            )

            return Response({
                'message': 'Approval status updated successfully',
                'completion': approval.calculate_completion()
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetProfileApprovalStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            if request.user.role != 'admin' and str(request.user.id) != user_id:
                return Response({'message': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            approval = ProfileApprovalStatus.objects.get(user__id=user_id)
            serializer = ProfileApprovalStatusSerializer(approval)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ProfileApprovalStatus.DoesNotExist:
            return Response({'message': 'Approval status not found'}, status=status.HTTP_404_NOT_FOUND)


class VerifyUserKYCView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, user_id):
        from .utils import generate_unique_role_id
        try:
            profile = Profile.objects.get(user__id=user_id)
        except Profile.DoesNotExist:
            return Response({"message": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if profile.kyc_verified:
            return Response({"message": "KYC is already verified."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            approval = ProfileApprovalStatus.objects.get(user=profile.user)
            if approval.calculate_completion() < 60:
                return Response({
                    "message": "60% profile completion is required for KYC verification.",
                    "status": False
                }, status=status.HTTP_400_BAD_REQUEST)
        except ProfileApprovalStatus.DoesNotExist:
            return Response({"message": "Approval status not found."}, status=status.HTTP_404_NOT_FOUND)

        profile.kyc_verified = True
        profile.kyc_status = "APPROVED"
        profile.kyc_verified_at = datetime.now()
        profile.save()
        # update user model also 
        user=User.objects.get(id=profile.user.id)
        if user.role == 'vendor' and not user.vendor_id:
            user.vendor_id = generate_unique_role_id('vendor')
        elif user.role == 'stockist' and not user.stockist_id:
            user.stockist_id = generate_unique_role_id('stockist')
        elif user.role == 'reseller' and not user.reseller_id:
            user.reseller_id = generate_unique_role_id('reseller')
        
        user.status='active_user'
        user.is_profile_completed=True
        user.save()

        create_notification(
            user=profile.user,
            title="KYC Verified",
            message="Your KYC has been successfully verified.",
            notification_type='kyc_verification',
            related_url=''
        )

        return Response({"message": "KYC verified successfully."}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)


class AdminWithdrawalRequestListAPIView(generics.ListAPIView):
    serializer_class = AdminWithdrawalRequestSerializer
    permission_classes = [IsAdminRole]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = WithdrawalRequest.objects.all().order_by('-created_at')
        
        status_filter = self.request.query_params.get('status')
        payment_method = self.request.query_params.get('payment_method')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if date_from and date_to:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__range=[date_from, date_to])
            except ValueError:
                pass
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search) |
                Q(payment_details__icontains=search)
            )
            
        return queryset


class AdminWithdrawalRequestDetailAPIView(APIView):
    permission_classes = [IsAdminRole]

    def get_object(self, pk):
        try:
            return WithdrawalRequest.objects.get(pk=pk)
        except WithdrawalRequest.DoesNotExist:
            return None

    def get(self, request, pk):
        withdrawal = self.get_object(pk)
        if not withdrawal:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AdminWithdrawalRequestSerializer(withdrawal)
        return Response(serializer.data)

    def patch(self, request, pk):
        withdrawal = self.get_object(pk)
        if not withdrawal:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        screenshot = request.data.get("screenshot")
        if screenshot:
            withdrawal.screenshot = screenshot
            new_status = "approved"
        else:
            return Response({"detail": "Screenshot required for approval."}, status=status.HTTP_400_BAD_REQUEST)
        if not screenshot:
            new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        withdrawal.status = new_status
        withdrawal.approved_by = request.user
        withdrawal.save()

        if new_status == 'rejected':
            # Refund amount to user's wallet
            wallet = withdrawal.wallet
            wallet.current_balance += withdrawal.amount
            wallet.save()

            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='CREDIT',
                amount=withdrawal.amount,
                description=f"Refund for rejected withdrawal #{withdrawal.id}",
                transaction_status='REFUND'
            )

        create_notification(
            user=withdrawal.user,
            title=f"Withdrawal Request {new_status.capitalize()}",
            message=f"Your withdrawal request #{withdrawal.id} has been {new_status}.",
            notification_type='withdrawal_update',
            related_url=''
        )

        serializer = AdminWithdrawalRequestSerializer(withdrawal)
        return Response(serializer.data)
    
class MarkDefaultStockistView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, user_id):
        
        try:
            user = User.objects.get(id=user_id, role='stockist')

            # If marking as default, first unmark any existing default stockist
            if request.data.get('is_default', False):
                User.objects.filter(role='stockist', is_default_user=True).update(is_default_user=False)

            user.is_default_user = request.data.get('is_default', False)
            user.save()

            return Response({
                'success': True,
                'message': f'Stockist successfully {"marked as" if user.is_default_user else "unmarked from"} default user',
                'is_default_user': user.is_default_user
            })

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Stockist not found'
            }, status=404)
        
class StockistListExcludingDefaultView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        stockists = User.objects.filter(role='stockist', is_default_user=False).values(
            "id", "username", "email", "is_default_user"
        )
        return Response({
            "success": True,
            "stockists": list(stockists)
        })
    
class StockistAssignmentView(APIView):
    permission_classes = [IsAdminRole]
    
    def get(self, request, reseller_id=None):
        if reseller_id:
            # Get assigned stockist for a specific reseller
            try:
                assignment = StockistAssignment.objects.get(reseller_id=reseller_id)
                stockist_data = {
                    "id": assignment.stockist.id,
                    "username": assignment.stockist.username,
                    "email": assignment.stockist.email,
                    "vendor_id": assignment.stockist.vendor_id,
                    "assigned_at": assignment.assigned_at
                }
                return Response({
                    "success": True,
                    "stockist": stockist_data
                })
            except StockistAssignment.DoesNotExist:
                return Response({
                    "success": True,
                    "stockist": None
                })
        else:
            # Get all assignments
            assignments = StockistAssignment.objects.select_related('reseller', 'stockist').all()
            assignment_data = []
            for assignment in assignments:
                assignment_data.append({
                    "reseller_id": assignment.reseller.id,
                    "reseller_name": assignment.reseller.username,
                    "reseller_email": assignment.reseller.email,
                    "stockist_id": assignment.stockist.id,
                    "stockist_name": assignment.stockist.username,
                    "stockist_email": assignment.stockist.email,
                    "assigned_at": assignment.assigned_at
                })
            return Response({
                "success": True,
                "assignments": assignment_data
            })
    
    @transaction.atomic
    def post(self, request):
        reseller_id = request.data.get('reseller_id')
        stockist_id = request.data.get('stockist_id')
        
        if not reseller_id or not stockist_id:
            return Response({
                "success": False,
                "message": "Reseller ID and Stockist ID are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reseller = User.objects.get(id=reseller_id, role='reseller')
            stockist = User.objects.get(id=stockist_id, role='stockist')
            
            # Check if reseller already has an assignment
            existing_assignment = StockistAssignment.objects.filter(reseller=reseller).first()
            if existing_assignment:
                existing_assignment.stockist = stockist
                existing_assignment.save()
                message = "Stockist assignment updated successfully"
            else:
                StockistAssignment.objects.create(reseller=reseller, stockist=stockist)
                message = "Stockist assigned successfully"
            
            return Response({
                "success": True,
                "message": message
            })
            
        except User.DoesNotExist:
            return Response({
                "success": False,
                "message": "Reseller or Stockist not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, reseller_id):
        try:
            assignment = StockistAssignment.objects.get(reseller_id=reseller_id)
            assignment.delete()
            return Response({
                "success": True,
                "message": "Stockist assignment removed successfully"
            })
        except StockistAssignment.DoesNotExist:
            return Response({
                "success": False,
                "message": "Assignment not found"
            }, status=status.HTTP_404_NOT_FOUND)
    