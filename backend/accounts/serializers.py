from rest_framework import serializers
from .models import *
from rest_framework.exceptions import ValidationError


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
        fields = ['id', 'amount', 'payment_method', 'status', 'payment_details', 'wallet', 'created_at']
        read_only_fields = ['id', 'status', 'created_at', 'wallet']

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']

        # Check amount validity
        if amount <= 0:
            raise ValidationError({
                "status": False,
                "message": "Amount must be greater than zero"
            })

        # Check wallet balance
        if user.wallet.balance < amount:
            raise ValidationError({
                "status": False,
                "message": "Insufficient wallet balance"
            })

        # Assign user's wallet automatically
        validated_data['wallet'] = user.wallet
        validated_data['user'] = user

        return super().create(validated_data)


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

        if NewAccountApplication.objects.filter(email=email, status='pending').exists():
            raise serializers.ValidationError({
                'email': "You already have a pending application with this email."
            })

        if NewAccountApplication.objects.filter(phone=phone, status='pending').exists():
            raise serializers.ValidationError({
                'phone': "You already have a pending application with this phone number."
            })

        return data
    


class UserAddressSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Address
        fields = [
            'street_address', 'city', 'postal_code', 'country',
            'is_primary', 'state_name', 'district_name', 'state', 'district'
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField()
    class Meta:
        model = Profile
        fields = [
            'full_name', 'date_of_birth', 'phone', 'profile_picture',
            'gender', 'facebook', 'twitter', 'instagram', 'youtube',
            'bio', 'whatsapp_number', 'bank_upi', 'upi_id',
            'account_holder_name', 'passbook_pic', 'ifsc_code', 'bank_name',
            'account_number', 'adhaar_card_pic', 'pancard_pic',
            'kyc_other_document', 'adhaar_card_number', 'pancard_number',
            'kyc_status', 'kyc_verified', 'kyc_verified_at', 'kyc_rejected_reason',
            'created_at', 'updated_at'
        ]
        
    def get_created_at(self, obj):
        return obj.created_at.date() if obj.created_at else None

class UserListSerializer(serializers.ModelSerializer):
    address = UserAddressSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)



    class Meta:
        model = User
        fields = [
            'id', 'email', 'role', 'username', 'is_default_user', 'is_active',
            'address', 'profile',
        ]

