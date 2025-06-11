from django.contrib import admin
from .models import User, Profile, Wallet, WalletTransaction, TopUpRequest, State, District,Address,StockistAssignment


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'balance')
    search_fields = ['user__email', 'id']


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet_id', 'wallet_user_email', 'description', 'transaction_status', 'amount')
    search_fields = ['wallet__id', 'wallet__user__email']
    
    def wallet_id(self, obj):
        return obj.wallet.id
    wallet_id.short_description = 'Wallet ID'

    def wallet_user_email(self, obj):
        return obj.wallet.user.email
    wallet_user_email.short_description = 'User Email'


@admin.register(TopUpRequest)
class TopUpRequestAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'amount',
        'status',
        'approved_by',
        'created_at',
        'reviewed_at',
    )
    list_filter = ('status', 'created_at', 'reviewed_at')
    search_fields = ('user__username', 'approved_by__username', 'rejected_reason')
    readonly_fields = ('created_at', 'reviewed_at')
    ordering = ('-created_at',)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'role', 'is_active','is_default_user')
    list_editable = ('is_active', 'role')
    search_fields = ['email', 'username']


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'full_name', 'phone')
    search_fields = ['full_name', 'user__email']


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'is_union_territory')
    search_fields = ['name', 'code']


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'state', 'is_active')
    search_fields = ['name', 'state__name']
    list_filter = ('state', 'is_active')

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        'get_user_email',  
        'street_address',
        'city',
        'district',
        'state',
        'postal_code',
        'country',
        'is_primary',
    )

    search_fields = ('user__email',) 

    # Optimizations
    list_select_related = ('user', 'state')  
    autocomplete_fields = ('user', 'state')  

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
    get_user_email.admin_order_field = 'user__email'  # Allow ordering by email
    get_user_email.short_description = 'Email'  # Custom label for the column

@admin.register(StockistAssignment)
class StockistAssignmentAdmin(admin.ModelAdmin):
    list_display = ('reseller', 'stockist', 'assigned_at')
    search_fields = ('reseller__username', 'stockist__username')  

    readonly_fields = ('assigned_at',)  


    def get_readonly_fields(self, request, obj=None):
        if obj:  
            return self.readonly_fields + ('reseller', 'stockist')
        return self.readonly_fields