from django.contrib import admin
from .models import User, Profile
# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email',"role", 'is_active')  
    list_editable = ('is_active',"role")
    search_fields = ['email', 'username']

admin.site.register(User, UserAdmin)
admin.site.register(Profile)