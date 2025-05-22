from django.contrib import admin
from .models import User, Profile,Wallet
# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email',"role", 'is_active')  
    list_editable = ('is_active',"role")
    search_fields = ['email', 'username']

# class WalletAdmin(admin.ModelAdmin):
#     list_display = ('id', )  
#     list_editable = ('is_active',"role")
#     search_fields = ['email', 'username']

admin.site.register(User, UserAdmin)
admin.site.register(Profile)
admin.site.register(Wallet)