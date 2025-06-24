from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .manager import UserManager
import uuid



# Create your models here.

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50,blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_default_user = models.BooleanField(default=False)

    # Role field
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('vendor', 'Vendor'),
        ('reseller', 'Reseller'),
        ('stockist', 'Stockist'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)

    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    # New fields
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)

    facebook = models.URLField(max_length=255, blank=True)
    twitter = models.URLField(max_length=255, blank=True)
    instagram = models.URLField(max_length=255, blank=True)
    youtube = models.URLField(max_length=255, blank=True)

    bio = models.TextField(blank=True)
    whatsapp_number = models.CharField(max_length=15, blank=True)

    # 🔐 NEW: UPI & Bank info (stored in profile)
    bank_upi = models.CharField(max_length=255, blank=True, null=True)
    upi_id = models.CharField(max_length=255, blank=True, null=True)
    account_holder_name = models.CharField(max_length=100, blank=True, null=True)
    passbook_pic = models.FileField(upload_to='passbook/', blank=True, null=True)
    ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=20, blank=True, null=True)

    # KYC fields
    adhaar_card_pic = models.FileField(upload_to='adhaarcard/', blank=True, null=True)
    pancard_pic = models.FileField(upload_to='pancard/', blank=True, null=True)
    kyc_other_document = models.FileField(upload_to='kyc_other_documents/', blank=True, null=True)
    adhaar_card_number = models.CharField(max_length=100, blank=True, null=True)
    pancard_number = models.CharField(max_length=50, blank=True, null=True)
    kyc_status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ], default='PENDING')


    kyc_verified = models.BooleanField(default=False)
    kyc_verified_at = models.DateTimeField(null=True, blank=True)
    kyc_rejected_reason = models.TextField(blank=True, null=True)
    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
    

class Wallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} Wallet - ₹{self.balance}"
    

class WalletTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    ]
    TRANSACTION_STATUS_CHOICES=[
        ("REFUND","Refund"),
        ("FAILED","Failed"),
        ("SUCCESS","Success"),
        ("PENDING","Pending"),
        ("RECEIVED","Received"),
    ]

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=6, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    transaction_status=models.CharField(max_length=10,choices=TRANSACTION_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.wallet.user.username} - {self.transaction_type} - ₹{self.amount}"

class TopupRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('upi', 'UPI'),
        ('bank', 'Bank Transfer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topup_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    screenshot = models.ImageField(upload_to='topup_screenshots/')
    note = models.TextField(blank=True, null=True)
    payment_details=models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(blank=True, null=True, help_text="Reason for rejection if applicable")
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='topup_approved_by')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Topup #{self.id} - {self.user.email} - {self.amount}"

class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('upi', 'UPI'),
        ('bank', 'Bank Transfer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawal_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    wallet= models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='withdrawal_requests')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    payment_details=models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Withdrawal #{self.id} - {self.user.email} - {self.amount}"


class State(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=3, blank=True, help_text="State code (e.g., MH for Maharashtra)")
    is_union_territory = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'State'
        verbose_name_plural = 'States'

    def __str__(self):
        return self.name


class District(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='districts')
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['state__name', 'name']
        unique_together = ['state', 'name']
        verbose_name = 'District'
        verbose_name_plural = 'Districts'

    def __str__(self):
        return f"{self.name}, {self.state.name}"
    

class Address(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name="address")
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100,blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=100, default='India')
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street_address}, {self.city}, {self.state}, {self.country}"

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"



class StockistAssignment(models.Model):
    reseller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assigned_stockists")
    stockist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stockist_for_resellers")
    assigned_at = models.DateTimeField(auto_now_add=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Reseller {self.reseller.username} assigned to Stockist {self.stockist.username}"

    class Meta:
        verbose_name = "Stockist Assignment"
        verbose_name_plural = "Stockist Assignments"


class BroadcastMessage(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    VISIBLE_CHOICES = [
        ('all', 'All'),
        ('vendor', 'Vendor'),
        ('reseller', 'Reseller'),
        ('stockist', 'Stockist'),
    ]

    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='broadcast_messages')
    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    visible_to=models.CharField(max_length=10, choices=VISIBLE_CHOICES, default='all')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.priority})"
    

class Notification(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, default='system')
    is_read = models.BooleanField(default=False)
    related_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
class NewAccountApplication(models.Model):
    ROLE_CHOICES = (
        ('vendor', 'Vendor'),
        ('reseller', 'Reseller'),
        ('stockist', 'Stockist'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    rejected_reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='new', choices=[('new', 'New Record'),('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.role} ({self.status})"
    

class Company(models.Model):
    BUSINESS_TYPE_CHOICES = [
        ('proprietorship', 'Proprietorship'),
        ('partnership', 'Partnership'),
        ('llp', 'Limited Liability Partnership (LLP)'),
        ('pvt_ltd', 'Private Limited Company'),
        ('ltd', 'Public Limited Company'),
        ('other', 'Other'),
    ]
    
    BUSINESS_CATEGORY_CHOICES = [
        ('manufacturer', 'Manufacturer'),
        ('wholesaler', 'Wholesaler'),
        ('retailer', 'Retailer'),
        ('distributor', 'Distributor'),
        ('service_provider', 'Service Provider'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company')
    
    # Company Identification

    company_name = models.CharField(max_length=255)
    company_email = models.EmailField()
    company_phone = models.CharField(max_length=15)
    designation = models.CharField(max_length=100, help_text="User's designation in the company")
    
    # Business Details
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES)
    business_category = models.CharField(max_length=20, choices=BUSINESS_CATEGORY_CHOICES)
    business_description = models.TextField(blank=True)
    joining_date = models.DateField(null=True, blank=True)
    
    # Registration Numbers
    gst_number = models.CharField(max_length=15, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    business_registration_number = models.CharField(max_length=50, blank=True, null=True)
    food_license_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Document Images
    gst_certificate = models.FileField(upload_to='company_documents/gst/', blank=True, null=True)
    pan_card = models.FileField(upload_to='company_documents/pan/', blank=True, null=True)
    business_registration_doc = models.FileField(upload_to='company_documents/registration/', blank=True, null=True)
    food_license_doc = models.FileField(upload_to='company_documents/fssai/', blank=True, null=True)
    
    # Address Details
    registered_address = models.TextField()
    operational_address = models.TextField(blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)
    pincode = models.CharField(max_length=10)
    
    # Verification Status
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)
    
    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ['company_name']

    def __str__(self):
        return f"{self.company_name}"


# def generate_vendor_id(self):
#         """
#         Generates a vendor ID in format VIXXXX where XXXX is incremental
#         Returns the generated ID without saving the model
#         """
#         if self.vendor_id:
#             return self.vendor_id  # Already has an ID
            
#         # Get the highest existing vendor ID number
#         last_vendor = Company.objects.exclude(vendor_id__isnull=True).order_by('-vendor_id').first()
        
#         if last_vendor and last_vendor.vendor_id:
#             try:
#                 last_number = int(last_vendor.vendor_id[2:])
#             except (ValueError, IndexError):
#                 last_number = 0
#         else:
#             last_number = 0
            
#         new_id = f"VI{str(last_number + 1).zfill(4)}"
#         self.vendor_id = new_id
#         return new_id