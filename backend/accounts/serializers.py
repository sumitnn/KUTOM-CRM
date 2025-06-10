from rest_framework import serializers
from .models import *




class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']



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


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name']

    def validate_name(self, value):
        if not value.isalpha():
            raise serializers.ValidationError("State name should only contain alphabetic characters.")
        return value

    def validate_code(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("State code should not exceed 3 characters.")
        return value

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'state', 'name', 'is_active', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value.isalpha():
            raise serializers.ValidationError("District name should only contain alphabetic characters.")
        return value
    
class UserSerializer(serializers.ModelSerializer):
    state = serializers.PrimaryKeyRelatedField(queryset=State.objects.all(), required=False, allow_null=True, write_only=True)
    district = serializers.PrimaryKeyRelatedField(queryset=District.objects.all(), required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role', 'username', 'state', 'district', 'is_default_user']
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

        
        state_data = validated_data.pop('state', None)  # Getting state id or instance
        district_data = validated_data.pop('district', None)  # Getting district id or instance
        is_default_user = validated_data.pop('is_default_user', False)

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

        # Create an associated address
        address = Address.objects.create(
            user=user,
            state=state,
            district=district
        )

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