# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile,Wallet,Company,ProfileApprovalStatus,Address, NewAccountApplication,CommissionWallet
import datetime
from .utils import generate_unique_role_id


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created and getattr(instance, "role", None) == "stockist" or getattr(instance, "role", None) == "reseller":
        CommissionWallet.objects.create(user=instance)


@receiver(post_save, sender=User)
def create_user_address(sender, instance, created, **kwargs):
    if created:
        Address.objects.create(user=instance)


@receiver(post_save, sender=User)
def create_profile_approval_status(sender, instance, created, **kwargs):
    if created:
        ProfileApprovalStatus.objects.create(user=instance)


@receiver(post_save, sender=User)
def create_vendor_company(sender, instance, created, **kwargs):
    if created and instance.role == 'vendor':
        Company.objects.create(user=instance)


@receiver(post_save, sender=ProfileApprovalStatus)
def update_profile_completion(sender, instance, **kwargs):
    user = instance.user

    if not hasattr(user, 'profile'):
        return

    profile = user.profile
    completion = instance.calculate_completion()
    profile.completion_percentage = completion

    role = user.role

    if completion >= 100:
        # Mark KYC as approved
        profile.kyc_verified = True
        profile.kyc_status = "APPROVED"
        profile.kyc_verified_at = datetime.datetime.now()
        user.is_user_active = "active"
        NewAccountApplication.objects.filter(
            email=profile.user.email).update(status='approved')

    elif completion < 15:
        # Reset KYC status
        profile.kyc_verified = False
        profile.kyc_status = "PENDING"
        profile.kyc_verified_at = None
        user.is_user_active = "new_user"

        # Clear role-based IDs if previously assigned
        if role == 'vendor':
            user.vendor_id = None
        elif role == 'stockist':
            user.stockist_id = None
        elif role == 'reseller':
            user.reseller_id = None

        NewAccountApplication.objects.filter(
            email=profile.user.email).update(status='pending')

        

    elif completion > 15:
        # Assign role-based IDs if not already set
        if role == 'vendor' and not user.vendor_id:
            user.vendor_id = generate_unique_role_id('vendor')
            user.is_user_active = "active"
        elif role == 'stockist' and not user.stockist_id:
            user.stockist_id = generate_unique_role_id('stockist')
            user.is_user_active = "active"
        elif role == 'reseller' and not user.reseller_id:
            user.reseller_id = generate_unique_role_id('reseller')
            user.is_user_active = "active"

    profile.save()
    user.save()