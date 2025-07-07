# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile,Wallet,Company,ProfileApprovalStatus,Address
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
    if hasattr(instance.user, 'profile'):
        completion = instance.calculate_completion()
        profile = instance.user.profile
        profile.completion_percentage = completion
        profile.save()

        user = instance.user

        if completion > 15:
            if user.role == 'vendor' and not user.vendor_id:
                user.vendor_id = generate_unique_role_id('vendor')
                user.save(update_fields=['vendor_id'])
            elif user.role == 'stockist' and not user.stockist_id:
                user.stockist_id = generate_unique_role_id('stockist')
                user.save(update_fields=['stockist_id'])
            elif user.role == 'reseller' and not user.reseller_id:
                user.reseller_id = generate_unique_role_id('reseller')
                user.save(update_fields=['reseller_id'])