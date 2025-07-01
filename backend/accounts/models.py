from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .manager import UserManager
import uuid



# Create your models here.

class User(AbstractBaseUser, PermissionsMixin):
    USER_ACTIVE_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('new_user', 'New User'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50,blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_default_user = models.BooleanField(default=False)
    is_user_active = models.CharField(
        max_length=10,
        choices=USER_ACTIVE_CHOICES,
        default='new_user'
    )
    vendor_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    stockist_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    reseller_id = models.CharField(max_length=20, null=True, blank=True, unique=True)

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

    phone = models.CharField(max_length=10, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    # New fields
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)

    facebook = models.URLField(max_length=255, blank=True)
    twitter = models.URLField(max_length=255, blank=True)
    instagram = models.URLField(max_length=255, blank=True)
    youtube = models.URLField(max_length=255, blank=True)

    bio = models.TextField(blank=True)
    whatsapp_number = models.CharField(max_length=10, blank=True)

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
    adhaar_card_number = models.CharField(max_length=12, blank=True, null=True)
    pancard_number = models.CharField(max_length=10, blank=True, null=True)
    kyc_status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ], default='PENDING')


    kyc_verified = models.BooleanField(default=False)
    kyc_verified_at = models.DateTimeField(null=True, blank=True)
    kyc_rejected_reason = models.TextField(blank=True, null=True)
    completion_percentage = models.FloatField(default=0.0)
    
    

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
    street_address = models.CharField(max_length=255,null=True,blank=True)
    city = models.CharField(max_length=100,blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)
    postal_code = models.CharField(max_length=6, blank=True, null=True)
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
    full_name = models.CharField(max_length=20)
    email = models.EmailField()
    phone = models.CharField(max_length=10)
    rejected_reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='new', choices=[('new', 'New Record'),('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.role} ({self.status})"
    

class Company(models.Model):
    BUSINESS_TYPE_CHOICES = [
        ('proprietorship', 'Proprietorship'),
        ('individual', 'Individual'),
        ('business', 'Business'),
        ('partnership', 'Partnership'),
        ('llp', 'Limited Liability Partnership (LLP)'),
        ('private_limited', 'Private Limited Company'),
        ('public_limited', 'Public Limited Company'),
        ('other', 'Other'),
    ]

  
    BUSINESS_CATEGORY_CHOICES = [
        ('production', 'Production'),
        ('manufacturer', 'Manufacturing'),
        ('trading', 'Trading'),
        ('wholesaler', 'Wholesale'),
        ('restaurant', 'Restaurant'),
        ('service_provider', 'Service Provider'),
        ('ecommerce', 'E-Commerce'),
        ('other', 'Other'),
    ]           

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company')
    
    # Company Identification

    company_name = models.CharField(max_length=50,null=True, blank=True)
    company_email = models.EmailField(null=True, blank=True)
    company_phone = models.CharField(max_length=15,null=True, blank=True)
    designation = models.CharField(max_length=50,null=True, blank=True)
    
    # Business Details
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES,default="other")
    business_category = models.CharField(max_length=20, choices=BUSINESS_CATEGORY_CHOICES,default="other")
    business_description = models.TextField(blank=True,null=True)
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
    registered_address = models.TextField(null=True, blank=True)
    operational_address = models.TextField(blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)
    pincode = models.CharField(max_length=6,null=True, blank=True)
    
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






APPROVAL_SECTIONS = ['user_details', 'bank_details', 'business_details', 'documents', 'address', 'contact']
class ProfileApprovalStatus(models.Model):
    APPROVAL_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pending', 'Pending'),
    ]


    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile_approval_status')

    # Status and reason fields
    user_details = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    user_details_reason = models.TextField(blank=True)

    bank_details = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    bank_details_reason = models.TextField(blank=True)

    business_details = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    business_details_reason = models.TextField(blank=True)

    documents = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    documents_reason = models.TextField(blank=True)

    address = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    address_reason = models.TextField(blank=True)

    contact = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    contact_reason = models.TextField(blank=True)

    last_updated = models.DateTimeField(auto_now=True)

    def calculate_completion(self):
        approved_count = sum(
            getattr(self, section) == 'approved' for section in APPROVAL_SECTIONS
        )
        return round((approved_count / len(APPROVAL_SECTIONS)) * 100, 2)

    def __str__(self):
        return f"ApprovalStatus({self.user.email})"