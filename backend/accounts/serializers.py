from rest_framework import serializers
from .models import *







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



class TopUpRequestSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    approved_by = serializers.StringRelatedField(read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = TopUpRequest
        fields = '__all__'
        read_only_fields = [
            'status', 'approved_by', 'reviewed_at',
            'created_at', 'rejected_reason', 'role'
        ]

    def get_role(self, obj):
        return getattr(obj.user, 'role', None)

class NewTopUpRequestSerializer(serializers.ModelSerializer):
    screenshot = serializers.ImageField(required=True)
    
    class Meta:
        model = TopUpRequest
        fields = [
            'id',
            'amount',
            'screenshot',
            'note',
            'status',
            'rejected_reason',
            'created_at',
            'reviewed_at',
            'approved_by',
        ]
        read_only_fields = [
            'id', 
            'status', 
            'created_at', 
            'reviewed_at', 
            'approved_by',
            'rejected_reason',
        ]
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def create(self, validated_data):
        # Automatically set the user from request context
        validated_data['user'] = self.context['request'].user
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

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'full_name', 'date_of_birth', 'phone', 'profile_picture', 'gender', 'bio',
            'facebook', 'twitter', 'instagram', 'youtube', 'whatsapp_number', 'address'
        ]

    def get_address(self, obj):
        address = Address.objects.filter(user=obj.user).first()
        if address:
            return AddressSerializer(address).data
        return None

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)

        # Update Profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle the address data if provided
        if address_data is not None:
            Address.objects.update_or_create(
                user=instance.user,
                defaults=address_data
            )

        instance.save()
        return instance
    

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='profile.full_name', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    gender = serializers.CharField(source='profile.gender', read_only=True)
    profile_picture = serializers.ImageField(source='profile.profile_picture', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'phone',
            'gender',
            'profile_picture'
        ]


class AddressWithUserAndProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

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