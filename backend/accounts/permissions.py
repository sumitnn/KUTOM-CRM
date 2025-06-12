from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request,view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsVendorRole(BasePermission):
    def has_permission(self, request,view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'vendor')
    

class IsStockistRole(BasePermission):
    def has_permission(self, request,view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'stockist')
    

class IsAdminOrResellerRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, 'role', None) == 'admin' or getattr(request.user, 'role', None) == 'reseller'
        )
    
class IsAdminOrStockistRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, 'role', None) == 'admin' or getattr(request.user, 'role', None) == 'stockist'
        )
    
class IsAdminOrVendorRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, 'role', None) == 'admin' or getattr(request.user, 'role', None) == 'vendor'
        )