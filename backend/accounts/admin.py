from django.contrib import admin
from .models import User, Profile, Wallet, WalletTransaction, TopUpRequest
# Register your models here.

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'balance')
    search_fields = ['user__email', "id"]
    ordering = ['user']  

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet__id', "wallet__user__email", 'description', "transaction_status", "amount")
    search_fields = ["wallet__id", 'wallet__user__email']
    ordering = ['-transaction_status']  # ordering by transaction status

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
    date_hierarchy = 'created_at'  # Add date hierarchy

class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', "role", 'is_active')  
    list_editable = ('is_active', "role")
    search_fields = ['email', 'username']
    ordering = ['username']  #  ordering by username

admin.site.register(User, UserAdmin)
admin.site.register(Profile)