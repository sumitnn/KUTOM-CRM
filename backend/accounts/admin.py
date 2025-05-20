from django.contrib import admin
from .models import User, Profile
# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email',"role", 'is_active')  

admin.site.register(User, UserAdmin)
admin.site.register(Profile)