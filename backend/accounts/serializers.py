from rest_framework import serializers
from .models import *
from rest_framework.exceptions import ValidationError
from .utils import create_notification
from django.db import transaction


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'
        read_only_fields = ['wallet', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['id', 'current_balance', 'payout_balance']
        read_only_fields = ['user', 'current_balance', 'payout_balance']




class TopupRequestSerializer(serializers.ModelSerializer):
    approved_by = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = TopupRequest
        fields = [
            'id', 'amount', 'user', 'payment_method', 'screenshot', 
            'payment_details', 'approved_by', 'rejected_reason', 
            'reviewed_at', 'note', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']
        
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def get_approved_by(self, obj):
        if obj.approved_by:
            return obj.approved_by.username
        return "Not Approved Yet"
    
    def get_user(self, obj):
        try:
            user = obj.user
            return UserListSerializer(user).data
        except User.DoesNotExist:
            return None


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    wallet = WalletSerializer(read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'amount', 'payment_method', 'status', 'payment_details', 
            'wallet', 'created_at', 'screenshot', 'rejected_reason','transaction_id'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'wallet','transaction_id']

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data.get('amount')
        

        if amount is None or amount <= 0:
            raise ValidationError({"status": False, "message": "Amount must be greater than zero"})

        # Get the user's wallet
        wallet = getattr(user, "wallet", None)
        if wallet is None:
            raise ValidationError({"status": False, "message": "Wallet not found"})

        # Choose balance field based on role
        balance_field = 'payout_balance' if user.role in ["stockist", "reseller"] else 'current_balance'

        if getattr(wallet, balance_field) < amount:
            raise ValidationError({"status": False, "message": "Insufficient wallet balance"})

        with transaction.atomic():
            # Deduct from wallet
            setattr(wallet, balance_field, getattr(wallet, balance_field) - amount)
            wallet.save()

            # Attach wallet and user
            validated_data['wallet'] = wallet
            validated_data['user'] = user

            withdrawal = super().create(validated_data)

            # Create wallet transaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='DEBIT',
                amount=amount,
                description=f"Withdrawal request #{withdrawal.id}",
                transaction_status='PENDING'
            )

            # Notify admin
            admin_user = User.objects.filter(role="admin").first()
            if admin_user:
                create_notification(
                    user=admin_user,
                    title="New Withdrawal Request",
                    message=f"A new withdrawal request of {amount} has been made by {user.username}.",
                    notification_type='withdrawal request',
                    related_url=''
                )

        return withdrawal


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name', 'code', 'is_union_territory']


class DistrictSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)
    
    class Meta:
        model = District
        fields = ['id', 'name', 'state', 'state_name', 'is_active']

    def validate_name(self, value):
        if not value.replace(' ', '').isalpha():
            raise serializers.ValidationError("District name should only contain alphabetic characters and spaces.")
        return value


class StockistSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'stockist_id']


class UserSerializer(serializers.ModelSerializer):
    state = serializers.PrimaryKeyRelatedField(queryset=State.objects.all(), required=False, allow_null=True, write_only=True)
    district = serializers.PrimaryKeyRelatedField(queryset=District.objects.all(), required=False, allow_null=True, write_only=True)
    stockist = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='stockist'), 
        required=False, 
        allow_null=True, 
        write_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'phone', 'role', 'username', 
            'state', 'district', 'stockist', 'is_default_user'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        """Ensure the email is unique except for the current user."""
        user_qs = User.objects.filter(email=value)
        if self.instance:
            user_qs = user_qs.exclude(pk=self.instance.pk)
        if user_qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Ensure password meets basic requirements."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create a user with a hashed password and associated address."""
        state_data = validated_data.pop('state', None)  
        district_data = validated_data.pop('district', None)  
        is_default_user = validated_data.pop('is_default_user', False)
        stockist = validated_data.pop('stockist', None)

        # Create the user
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_default_user = is_default_user
        user.save()

        # Create address if state/district provided
        if state_data or district_data:
            Address.objects.create(
                user=user,
                state=state_data,
                district=district_data
            )

        # Create stockist assignment if applicable
        if stockist and user.role == 'reseller':
            StockistAssignment.objects.create(
                reseller=user,
                stockist=stockist,
                state=state_data
            )

        return user

    def update(self, instance, validated_data):
        """Update user and optionally update password."""
        instance.email = validated_data.get('email', instance.email)
        instance.role = validated_data.get('role', instance.role)
        instance.username = validated_data.get('username', instance.username)
        instance.phone = validated_data.get('phone', instance.phone)

        if 'password' in validated_data:
            instance.set_password(validated_data['password'])

        instance.save()
        return instance


class AddressSerializer(serializers.ModelSerializer):
    state = StateSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), 
        source='state', 
        write_only=True, 
        required=False
    )
    district_id = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(), 
        source='district', 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Address
        fields = [
            'id', 'street_address', 'city', 'state', 'district', 
            'state_id', 'district_id', 'postal_code', 'country', 'is_primary'
        ]


class BasicUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'phone']


class ProfileSerializer(serializers.ModelSerializer):
    user = BasicUserProfileSerializer(read_only=True)
    address = serializers.SerializerMethodField()
    date_of_birth = serializers.DateField(
        input_formats=['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', 'iso-8601'],
        required=False,
        allow_null=True
    )

    class Meta:
        model = Profile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'kyc_verified', 'kyc_verified_at', 'created_at', 'updated_at']

    def get_address(self, obj):
        address = Address.objects.filter(user=obj.user).first()
        if address:
            return AddressSerializer(address).data
        return None

    def update(self, instance, validated_data):
        address_data = self.context.get('request').data.get('address', {})
        
        # Update profile fields
        for attr, value in validated_data.items():
            if value is not None or attr in ['profile_picture']:
                setattr(instance, attr, value)

        # Update or create address
        if address_data:
            address, created = Address.objects.get_or_create(user=instance.user)
            for attr, value in address_data.items():
                setattr(address, attr, value)
            address.save()

        instance.save()
        return instance


class BroadcastMessageSerializer(serializers.ModelSerializer):
    visible_to_display = serializers.CharField(source='get_visible_to_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = BroadcastMessage
        fields = '__all__'
        read_only_fields = ['admin', 'created_at', 'updated_at']


class UserPaymentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "upi_id", 'bank_upi', 'account_holder_name', 'account_number',
            'ifsc_code', 'bank_name', 'passbook_pic'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'title', 'message', 'notification_type',
            'is_read', 'related_url', 'created_at'
        ]
        read_only_fields = ['created_at']


class UserAddressSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Address
        fields = "__all__"


class UserProfileSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = "__all__"
        
    def get_created_at(self, obj):
        return obj.created_at.date() if obj.created_at else None

    def get_updated_at(self, obj):
        return obj.updated_at.date() if obj.updated_at else None


class CompanySerializer(serializers.ModelSerializer):
    state = StateSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), 
        source='state', 
        write_only=True, 
        required=False
    )
    district_id = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(), 
        source='district', 
        write_only=True, 
        required=False
    )
    
    joining_date = serializers.DateField(format="%Y-%m-%d", required=False, allow_null=True)
    verified_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M", required=False, allow_null=True)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_created_at(self, obj):
        return obj.created_at.date() if obj.created_at else None

    def get_updated_at(self, obj):
        return obj.updated_at.date() if obj.updated_at else None


class UserListSerializer(serializers.ModelSerializer):
    address = UserAddressSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)
    company = CompanySerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'role', 'role_display', 'username', 'phone', 'status', 'status_display',
            'address', 'profile', 'company', 'reseller_id', 'stockist_id', 'vendor_id',
            'is_active', 'is_profile_completed', 'completion_percentage', 'created_at'
        ]


class ProfileApprovalStatusSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ProfileApprovalStatus
        fields = '__all__'
        read_only_fields = ['user', 'last_updated']

    def get_completion_percentage(self, obj):
        return obj.calculate_completion()


class ProfileApprovalStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileApprovalStatus
        fields = [
            'user_details', 'user_details_reason',
            'documents', 'documents_reason',
            'business_details', 'business_details_reason',
            'company_documents', 'company_documents_reason',
            'bank_details', 'bank_details_reason',
        ]


class CurrentUserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_display', 'status', 'status_display']
        read_only_fields = fields


class AdminWithdrawalRequestSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    wallet = WalletSerializer(read_only=True)
    approved_by = CurrentUserSerializer(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user', 'amount', 'payment_method', 'payment_method_display', 'status',
            'payment_details', 'wallet', 'approved_by', 'created_at',
            'updated_at', 'screenshot', 'rejected_reason','transaction_id'
        ]
        read_only_fields = [
            'id', 'user', 'wallet', 'approved_by', 'created_at', 'updated_at'
        ]


class StockistAssignmentSerializer(serializers.ModelSerializer):
    reseller = UserListSerializer(read_only=True)
    stockist = UserListSerializer(read_only=True)
   

    class Meta:
        model = StockistAssignment
        fields = ['id', 'reseller', 'stockist', 'assigned_at']


class NewUserRegistrationSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "phone", "role",
            "is_active", "is_profile_completed", "completion_percentage"
        ]
        read_only_fields = [
            "id", "is_active", "is_profile_completed", "completion_percentage"
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", None)

        if full_name and not validated_data.get("username"):
            validated_data["username"] = full_name

        user = User.objects.create(**validated_data)
        user.is_active = False
        user.status = "new_user"
        user.save()  
        return user


class NewProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class NewAddressSerializer(serializers.ModelSerializer):
    state = StateSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)

    class Meta:
        model = Address
        fields = "__all__"
        read_only_fields = ["id", "user"]


class NewCompanySerializer(serializers.ModelSerializer):
    state = StateSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class CASEAddressSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source='state.name', read_only=True)
    district = serializers.CharField(source='district.name', read_only=True)
    
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), 
        source='state', 
        write_only=True, 
        required=False
    )
    district_id = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(), 
        source='district', 
        write_only=True, 
        required=False
    )

    class Meta:
        model = Address
        fields = [
            'id', 'street_address', 'city', 'state', 'district', 
            'state_id', 'district_id', 'postal_code', 'country', 'is_primary'
        ]


class NewUserFullDetailSerializer(serializers.ModelSerializer):
    profile = NewProfileSerializer(read_only=True)
    address = CASEAddressSerializer(read_only=True)
    company = NewCompanySerializer(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "phone", "username", "role", "role_display", 
            "status", "status_display", "vendor_id", "stockist_id", "reseller_id",
            "is_active", "is_staff", "is_default_user", "is_profile_completed", 
            "completion_percentage", "created_at", "profile", "address", "company","unique_role_id"
        ]
        read_only_fields = ["id", "created_at"]


class UserStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['status', 'rejected_reason']

    def validate_status(self, value):
        if value not in [choice[0] for choice in User.Status_CHOICES]:
            raise serializers.ValidationError("Invalid status")
        return value
    
class AssignedResellerSerializer(serializers.ModelSerializer):
    rolebased_id = serializers.SerializerMethodField()
    state = serializers.CharField(source="state.name", read_only=True)
    district = serializers.CharField(source="district.name", read_only=True)

    class Meta:
        model = Address
        fields = [
            "user", "street_address", "city", "state", "district",
            "postal_code", "country", "rolebased_id"
        ]

    def get_rolebased_id(self, obj):
        user = obj.user
        return user.reseller_id

    def to_representation(self, instance):
        """Override to include user details cleanly"""
        data = super().to_representation(instance)
        user = instance.user
        data["user"] = {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role,
        }
        return data