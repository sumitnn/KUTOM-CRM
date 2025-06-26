# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile,Wallet,Company,ProfileApprovalStatus,Address
import datetime

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