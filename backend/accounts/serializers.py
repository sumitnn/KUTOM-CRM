from rest_framework import serializers
from .models import *
from rest_framework.exceptions import ValidationError
from .utils import create_notification

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'
        read_only_fields = ['wallet', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Wallet
        fields = ['id', 'balance']
        read_only_fields = ['user', 'balance']




class TopupRequestSerializer(serializers.ModelSerializer):
    approved_by=serializers.SerializerMethodField()
    class Meta:
        model = TopupRequest
        fields = ['id', 'amount', 'payment_method', 'screenshot','payment_details','approved_by','rejected_reason','reviewed_at', 'note', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
        
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    def get_approved_by(self, obj):
        if obj.approved_by:
            return obj.approved_by.username
        return "Not Approved Yet"

class WithdrawalRequestSerializer(serializers.ModelSerializer):
    wallet = WalletSerializer(read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = ['id', 'amount', 'payment_method', 'status', 'payment_details', 'wallet', 'created_at','screenshot', 'rejected_reason']
        read_only_fields = ['id', 'status', 'created_at', 'wallet']

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']

        if amount <= 0:
            raise ValidationError({
                "status": False,
                "message": "Amount must be greater than zero"
            })

        if user.wallet.balance < amount:
            raise ValidationError({
                "status": False,
                "message": "Insufficient wallet balance"
            })

        # Deduct from wallet
        wallet = user.wallet
        wallet.balance -= amount
        wallet.save()

        # Attach wallet and user to the withdrawal request
        validated_data['wallet'] = wallet
        validated_data['user'] = user

        withdrawal = super().create(validated_data)

        # Create transaction for withdrawal
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='DEBIT',
            amount=amount,
            description=f"Withdrawal request #{withdrawal.id}",
            transaction_status='PENDING'
        )
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
        fields = ['id', 'name']


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name']

    def validate_name(self, value):
        if not value.isalpha():
            raise serializers.ValidationError("District name should only contain alphabetic characters.")
        return value
    
class StockistSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields = ['id', 'email', 'username', 'role']

class UserSerializer(serializers.ModelSerializer):
    state = serializers.PrimaryKeyRelatedField(queryset=State.objects.all(), required=False, allow_null=True, write_only=True)
    district = serializers.PrimaryKeyRelatedField(queryset=District.objects.all(), required=False, allow_null=True, write_only=True)
    stockist=serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='stockist'), 
        required=False, 
        allow_null=True, 
        write_only=True
    )
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role', 'username', 'state', 'district','stockist', 'is_default_user']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        """Ensure the email is unique except for the current user."""
        user_qs = User.objects.filter(email=value)
        if self.instance:
            user_qs = user_qs.exclude(pk=self.instance.pk)  # Exclude current user
        if user_qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Ensure password meets basic requirements."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

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

        # Ensure that state_data and district_data are ids, not model instances
        if state_data and isinstance(state_data, State):
            state = state_data
        else:
            try:
                state = State.objects.get(id=state_data)  
            except State.DoesNotExist:
                state=None

        if district_data and isinstance(district_data, District):
            district = district_data
        else:
            try:
                district = District.objects.get(id=district_data)  
            except District.DoesNotExist:
                district = None
        
        if stockist and isinstance(stockist, User):
            try:
                stockist = stockist
            except User.DoesNotExist:
                stockist = None

        # Create an associated address
        address = Address.objects.create(
            user=user,
            state=state,
            district=district
        )
        # create stockist assignment 
        StockistAssignment.objects.create(reseller=user,stockist=stockist,state=state) 

        return user

    def update(self, instance, validated_data):
        """Update user and optionally update password."""
        instance.email = validated_data.get('email', instance.email)
        instance.role = validated_data.get('role', instance.role)
        instance.username = validated_data.get('username', instance.username)

        if 'password' in validated_data:
            instance.set_password(validated_data['password'])

        instance.save()
        return instance
    

class AddressSerializer(serializers.ModelSerializer):
    state = StateSerializer()
    district = DistrictSerializer()
    
    class Meta:
        model = Address
        fields = ['id', 'street_address', 'city', 'state', 'district', 'postal_code', 'country', 'is_primary']

class BasicUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']

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

    def to_internal_value(self, data):
        data = data.copy()
        
        # Handle null values
        for field in ['date_of_birth', 'profile_picture']:
            if field in data and data[field] in ('null', 'None'):
                data[field] = None
                
        ret = super().to_internal_value(data)
        request = self.context.get('request')
        
        # Handle file uploads
        if request and hasattr(request, 'FILES'):
            for field in request.FILES:
                ret[field] = request.FILES[field]
        
        # Handle address data
        address_data = {}
        address_fields = ['street_address', 'city', 'postal_code', 'country']
        
        for field in address_fields:
            key = f'address[{field}]'
            if key in data:
                address_data[field] = data[key]
        
        # Handle state and district foreign keys
        foreign_key_fields = {
            'state': State,
            'district': District
        }
        
        for field, model in foreign_key_fields.items():
            key = f'address[{field}]'
            if key in data and data[key]:
                try:
                    address_data[field] = model.objects.get(id=data[key])
                except model.DoesNotExist:
                    raise serializers.ValidationError({
                        field: f'Invalid {field} ID'
                    })
        
        if address_data:
            ret['address'] = address_data
            
        return ret

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        # Update profile fields
        for attr, value in validated_data.items():
            if value is not None or attr in ['profile_picture']:
                setattr(instance, attr, value)

        # Update or create address
        if address_data:
            Address.objects.update_or_create(
                user=instance.user,
                defaults=address_data
            )

        instance.save()
        return instance


class AddressWithUserAndProfileSerializer(serializers.ModelSerializer):
    user = ProfileSerializer(read_only=True)

    class Meta:
        model = Address
        fields = [
            'id',
            'street_address',
            'city',
            'state',
            'district',
            'postal_code',
            'country',
            'is_primary',
            'user'
        ]


class BroadcastMessageSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source='admin.username', read_only=True)

    class Meta:
        model = BroadcastMessage
        fields = '__all__'
        read_only_fields = ['admin', 'created_at', 'updated_at']


class UserPaymentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "upi_id",
            'bank_upi',
            'account_holder_name',
            'account_number',
            'ifsc_code',
            'bank_name',
            'passbook_pic',
        ]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'title', 'message', 'notification_type',
            'is_read', 'related_url', 'created_at'
        ]
        read_only_fields = ['created_at']


class NewAccountApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewAccountApplication
        fields = '__all__'
        read_only_fields = ['status', 'created_at']

    def validate(self, data):
        email = data.get('email')
        phone = data.get('phone')

        # Check email
        if email:
            existing_email_app = NewAccountApplication.objects.filter(email=email).first()
            if existing_email_app:
                status = existing_email_app.status
                if status in ['new', 'pending']:
                    raise serializers.ValidationError({
                        'email': "An application with this email is already in progress and awaiting admin approval."
                    })
                elif status == 'approved':
                    raise serializers.ValidationError({
                        'email': "An application with this email has already been approved. Please use a different email."
                    })
                elif status == 'rejected':
                    raise serializers.ValidationError({
                        'email': "previous application with this email was rejected. Please contact support for assistance."
                    })

        # Check phone
        if phone:
            existing_phone_app = NewAccountApplication.objects.filter(phone=phone).first()
            if existing_phone_app:
                status = existing_phone_app.status
                if status in ['new', 'pending']:
                    raise serializers.ValidationError({
                        'phone': "An application with this phone number is already in progress and awaiting admin approval."
                    })
                elif status == 'approved':
                    raise serializers.ValidationError({
                        'phone': "An application with this phone number has already been approved. Please use a different phone number."
                    })
                elif status == 'rejected':
                    raise serializers.ValidationError({
                        'phone': "previous application with this phone number was rejected. Please contact support for assistance."
                    })

        return data
    


class ApplicationWithUserSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = NewAccountApplication
        fields = ['id','role','created_at','status','rejected_reason','phone','email','full_name','user']

    def get_user(self, obj):
        try:
            user = User.objects.get(email=obj.email)
            return UserListSerializer(user).data
        except User.DoesNotExist:
            return None



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
    state = serializers.PrimaryKeyRelatedField(queryset=State.objects.all(), required=False, allow_null=True)
    district = serializers.PrimaryKeyRelatedField(queryset=District.objects.all(), required=False, allow_null=True)

    joining_date = serializers.DateField(format="%Y-%m-%d", required=False, allow_null=True)
    verified_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M", required=False, allow_null=True)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ['created_at', 'updated_at']
    
    def get_created_at(self, obj):
        return obj.created_at.date() if obj.created_at else None

    def get_updated_at(self, obj):
        return obj.updated_at.date() if obj.updated_at else None


class UserListSerializer(serializers.ModelSerializer):
    address = UserAddressSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)
    company = CompanySerializer(read_only=True)



    class Meta:
        model = User
        fields = [
            'id', 'email', 'role', 'username', 
            'address', 'profile','company',"reseller_id","stockist_id","vendor_id"
        ]



# create serializers
class AddressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        extra_kwargs = {
            'profile': {'read_only': True}
        }

class CompanyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True}
        }

class ProfileCreateSerializer(serializers.ModelSerializer):
    address = AddressCreateSerializer(required=False)
    company = CompanyCreateSerializer(required=False)
    
    class Meta:
        model = Profile
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True}
        }


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
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
        read_only_fields = fields


class AdminWithdrawalRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    wallet = WalletSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user', 'amount', 'payment_method', 'status',
            'payment_details', 'wallet', 'approved_by', 'created_at',
            'updated_at', 'screenshot'
        ]
        read_only_fields = [
            'id', 'user', 'wallet', 'approved_by', 'created_at',
            'updated_at'
        ]

    def validate_status(self, value):
        if value not in ['pending', 'approved', 'rejected']:
            raise serializers.ValidationError("Invalid status")
        return value