from rest_framework import serializers
from .models import User, Profile, Wallet, WalletTransaction, TopUpRequest, State, District
from .models import State, District

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role',"username"]
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
        """Create a user with a hashed password """
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
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
        fields = ['id', 'name', 'code', 'is_union_territory', 'created_at', 'updated_at']

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