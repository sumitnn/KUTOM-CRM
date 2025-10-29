from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Profile, Wallet,  WalletTransaction,
    TopupRequest, WithdrawalRequest, State, District, Address,
    StockistAssignment, BroadcastMessage, Notification,
    Company, ProfileApprovalStatus, ActivityLog
)


# ==========================
# Custom User Admin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "email", 
        "phone", 
        "username", 
        "role", 
        "status",
        "vendor_id", 
        "stockist_id", 
        "reseller_id",
        "is_active", 
        "is_staff", 
        "is_profile_completed", 
        "completion_percentage",
        "created_at",
    )
    list_filter = (
        "role", 
        "status",
        "is_active", 
        "is_staff", 
        "is_profile_completed",
    )
    search_fields = (
        "email", 
        "phone", 
        "username", 
        "vendor_id", 
        "stockist_id", 
        "reseller_id",
    )
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "last_login")  # ✅ Add here

    fieldsets = (
        (None, {"fields": ("email", "phone", "username", "password")}),
        ("Identifiers", {"fields": ("vendor_id", "stockist_id", "reseller_id")}),
        ("Status", {"fields": ("status", "rejected_reason", "completion_percentage", "is_profile_completed")}),
        ("Roles", {"fields": ("role",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_default_user", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),  # removed created_at from here
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "phone", "username", "role", "password1", "password2", "is_active", "is_staff"),
        }),
    )


# ==========================
# Related Models
# ==========================
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "gender", "kyc_status", "kyc_verified", "created_at")
    list_filter = ("gender", "kyc_status", "kyc_verified")
    search_fields = ("full_name", "user__email", "user__phone")


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "current_balance", "payout_balance")
    search_fields = ("user__email", "user__phone")





@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ("wallet", "transaction_type", "transaction_status", "amount", "is_refund", "created_at")
    list_filter = ("transaction_type", "transaction_status", "is_refund")
    search_fields = ("wallet__user__email", "order_id", "user_id")


@admin.register(TopupRequest)
class TopupRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "payment_method", "status", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("user__email", "user__phone")


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "payment_method", "status", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("user__email", "user__phone")


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_union_territory")
    search_fields = ("name", "code")
    list_filter = ("is_union_territory",)


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name", "state", "is_active")
    list_filter = ("state", "is_active")
    search_fields = ("name", "state__name")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "street_address", "city", "state", "district", "postal_code", "is_primary")
    list_filter = ("state", "district", "is_primary")
    search_fields = ("user__email", "street_address", "city")


@admin.register(StockistAssignment)
class StockistAssignmentAdmin(admin.ModelAdmin):
    list_display = ("reseller", "stockist", "assigned_at")
    search_fields = ("reseller__email", "stockist__email")
    


@admin.register(BroadcastMessage)
class BroadcastMessageAdmin(admin.ModelAdmin):
    list_display = ("title", "priority", "visible_to", "is_active", "start_time", "end_time")
    list_filter = ("priority", "visible_to", "is_active")
    search_fields = ("title", "content")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("title", "message", "user__email")


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("company_name", "user", "business_type", "business_category", "is_verified", "created_at")
    list_filter = ("business_type", "business_category", "is_verified")
    search_fields = ("company_name", "company_email", "company_phone", "user__email")


@admin.register(ProfileApprovalStatus)
class ProfileApprovalStatusAdmin(admin.ModelAdmin):
    list_display = ("user", "user_details", "documents", "business_details", "company_documents", "bank_details", "last_updated")
    list_filter = ("user_details", "documents", "business_details", "company_documents", "bank_details")
    search_fields = ("user__email", "user__phone")



@admin.register(ActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'method', 'url', 'status_code', 'ip_address', 'created_at')
    list_filter = ('method', 'status_code', 'created_at')
    search_fields = ('user__email', 'url')