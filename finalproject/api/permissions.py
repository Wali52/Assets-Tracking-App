from rest_framework import permissions
from rest_framework.permissions import BasePermission

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
    Permissions for Assignment model:
    - Admins: Full access within their organization.
    - Employees: Can read their assignments, PATCH 'status' for return requests, and upload fine proof.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False

        # Admins have full access
        if user.is_superuser or user.role == ROLE_ADMIN:
            return True

        # Employees
        if user.role == ROLE_EMPLOYEE:
            if view.action in ['list', 'retrieve']:
                return True

            # Allow PATCH (partial_update) for 'Request Return'
            if view.action == 'partial_update' and request.method == 'PATCH':
                return True

            # ✅ ALLOW employees to POST fine proof
            if view.action == 'upload_fine_proof' and request.method == 'POST':
                return True

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Superuser bypass
        if user.is_superuser:
            return True

        # Admin can manage any assignment in their org
        if user.role == ROLE_ADMIN:
            return obj.organization_id == user.organization_id

        # Employee can only interact with their own assignments
        if user.role == ROLE_EMPLOYEE:
            is_their_assignment = obj.employee == user

            # Allow SAFE_METHODS if it's their assignment
            if request.method in permissions.SAFE_METHODS and is_their_assignment:
                return True

            # PATCH for 'Request Return'
            if request.method == 'PATCH' and view.action == 'partial_update' and is_their_assignment:
                if list(request.data.keys()) == ['status']:
                    is_currently_active = obj.status in ['Active', 'Overdue']
                    is_requesting_return = request.data.get('status') == 'Requested Return'
                    return is_currently_active and is_requesting_return

            # ✅ POST for 'upload_fine_proof'
            if request.method == 'POST' and view.action == 'upload_fine_proof' and is_their_assignment:
                return True

        return False
# new ----

class MustChangePasswordPermission(BasePermission):
    message = "You must change your password before accessing the system."

    def has_permission(self, request, view):
        user = request.user
        return not user.must_change_password