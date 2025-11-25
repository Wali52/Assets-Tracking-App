from rest_framework import permissions

# Assuming role definitions are consistent across the project
ROLE_ADMIN = "Admin"
ROLE_EMPLOYEE = "Employee"

# --- Existing UserAccessPermission (keeping your version) ---
class UserAccessPermission(permissions.BasePermission):
    """
    Custom permission to restrict access to the User ViewSet based on the user's role.
    """

    def has_permission(self, request, view):
        user = request.user

        # 1. Super Admins
        if user.is_superuser:
            return True

        # 2. Org Admins (Admin role)
        if user.is_authenticated and user.role == ROLE_ADMIN:
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
        if user.role == ROLE_ADMIN and obj.organization_id == user.organization_id:
            return True

        # 3. Employees can only view/edit their own user object
        if user.role == ROLE_EMPLOYEE:
            # Allow Employees to view/edit their own object only
            return obj == user
            
        return False

# --- NEW: Generic Organizational Management Permission (for Asset, Department, etc.) ---
class OrgAccessPermission(permissions.BasePermission):
    """
    Permission for models that should only be managed by Super Admin or Org Admin.
    Employees are generally denied list/create/update/delete access.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
            
        return user.is_superuser or user.role == ROLE_ADMIN

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True
            
        # Org Admin can manage objects within their organization
        if user.role == ROLE_ADMIN:
            return obj.organization_id == user.organization_id
            
        return False # Employees cannot manage these objects

# --- REFINED: Specific Assignment Permission ---
class AssignmentPermission(permissions.BasePermission):
    """
    Specific permission for the Assignment model.
    - Super Admin / Admin: Full access to manage (create, set due date, fine, return).
    - Employee: Can only READ their OWN assignments. No write access (create/update/delete/return).
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
            
        # Admins have full access to Assignment actions
        if user.is_superuser or user.role == ROLE_ADMIN:
            return True
            
        # Employees are restricted
        if user.role == ROLE_EMPLOYEE:
            # Employees can only access 'list' and 'retrieve' (Read-only)
            return view.action in ['list', 'retrieve'] 
            
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Super Admin bypass
        if user.is_superuser:
            return True

        # Org Admin can manage any assignment in their organization
        if user.role == ROLE_ADMIN:
            return obj.organization_id == user.organization_id
            
        # Employee can only interact with assignments where they are the assigned employee
        if user.role == ROLE_EMPLOYEE:
            is_their_assignment = obj.employee == user
            
            # Allow SAFE_METHODS (GET, HEAD, OPTIONS) only if it's their assignment
            if request.method in permissions.SAFE_METHODS:
                return is_their_assignment
            
        return False