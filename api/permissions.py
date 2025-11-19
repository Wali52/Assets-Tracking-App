from rest_framework import permissions

class UserAccessPermission(permissions.BasePermission):
    """
    Custom permission to restrict access to the User ViewSet based on the user's role.

    Rules:
    - Super Admins can do anything (bypasses tenant check).
    - Org Admins can do anything within their organization.
    - Employees:
        - Can only view/edit/delete their own record (detail view).
        - Are explicitly denied the ability to list all users (list view).
    """

    def has_permission(self, request, view):
        user = request.user

        # 1. Super Admins (Can do anything, but the MultiTenantMixin handles the queryset)
        if user.is_superuser:
            return True

        # 2. Org Admins (Can view/list/create within their organization)
        if user.is_authenticated and user.role == "Admin":
            return True

        # 3. Employees/Other authenticated users: Only allow safe methods on detail view.
        if user.is_authenticated:
            # Employees cannot list all users (deny GET on the list view)
            if view.action == 'list':
                return False
            
            # Allow safe methods (GET, HEAD, OPTIONS) on detail, but the object-level check
            # will ensure they only access their own profile.
            return request.method in permissions.SAFE_METHODS
        
        return False # Deny all unauthenticated access

    def has_object_permission(self, request, view, obj):
        user = request.user

        # 1. Super Admins bypass
        if user.is_superuser:
            return True

        # 2. Org Admins can access any object within their organization
        if user.role == "Admin" and obj.organization_id == user.organization_id:
            return True

        # 3. Employees can only view/edit their own user object
        if user.role == "Employee":
            # Allow Employees to view/edit their own object only
            return obj == user
            
        return False