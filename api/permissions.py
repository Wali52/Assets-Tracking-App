# from rest_framework import permissions

# class UserAccessPermission(permissions.BasePermission):
#     """
#     Custom permission to restrict access to the User ViewSet based on the user's role.

#     Rules:
#     - Super Admins can do anything (bypasses tenant check).
#     - Org Admins can do anything within their organization.
#     - Employees:
#         - Can only view/edit/delete their own record (detail view).
#         - Are explicitly denied the ability to list all users (list view).
#     """

#     def has_permission(self, request, view):
#         user = request.user

#         # 1. Super Admins (Can do anything, but the MultiTenantMixin handles the queryset)
#         if user.is_superuser:
#             return True

#         # 2. Org Admins (Can view/list/create within their organization)
#         if user.is_authenticated and user.role == "Admin":
#             return True

#         # 3. Employees/Other authenticated users: Only allow safe methods on detail view.
#         if user.is_authenticated:
#             # Employees cannot list all users (deny GET on the list view)
#             if view.action == 'list':
#                 return False
            
#             # Allow safe methods (GET, HEAD, OPTIONS) on detail, but the object-level check
#             # will ensure they only access their own profile.
#             return request.method in permissions.SAFE_METHODS
        
#         return False # Deny all unauthenticated access

#     def has_object_permission(self, request, view, obj):
#         user = request.user

#         # 1. Super Admins bypass
#         if user.is_superuser:
#             return True

#         # 2. Org Admins can access any object within their organization
#         if user.role == "Admin" and obj.organization_id == user.organization_id:
#             return True

#         # 3. Employees can only view/edit their own user object
#         if user.role == "Employee":
#             # Allow Employees to view/edit their own object only
#             return obj == user
            
#         return False


from rest_framework import permissions

# --- Existing UserAccessPermission (keeping your version) ---
class UserAccessPermission(permissions.BasePermission):
    """
    Custom permission to restrict access to the User ViewSet based on the user's role.
    ... (your existing implementation)
    """

    def has_permission(self, request, view):
        user = request.user

        # 1. Super Admins
        if user.is_superuser:
            return True

        # 2. Org Admins (Assuming 'Admin' role in your system matches 'OrgAdmin' in the requirements)
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
            
        return user.is_superuser or user.role == "Admin"

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True
            
        # Org Admin can manage objects within their organization
        if user.role == "Admin":
            return obj.organization_id == user.organization_id
            
        return False # Employees cannot manage these objects

# --- NEW: Specific Assignment Permission ---
class AssignmentPermission(permissions.BasePermission):
    """
    Specific permission for the Assignment model.
    - Super Admin / Admin: Full access to manage (create, set due date, fine).
    - Employee: Can only read/update (return) their OWN assignments.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
            
        # Super Admins and Org Admins (Admin) have full access to Assignment actions
        if user.is_superuser or user.role == 'Admin':
            return True
            
        # Employees are restricted on the list/create view
        if user.role == 'Employee':
            # Employees can only access list/retrieve/partial_update (for returning)
            return view.action in ['list', 'retrieve', 'partial_update']
            
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Super Admin bypass
        if user.is_superuser:
            return True

        # Org Admin can manage any assignment in their organization
        if user.role == 'Admin':
            return obj.organization_id == user.organization_id
            
        # Employee can only interact with assignments where they are the assigned employee
        if user.role == 'Employee':
            is_their_assignment = obj.employee == user
            
            # Allow safe methods (GET, HEAD, OPTIONS) only if it's their assignment
            if request.method in permissions.SAFE_METHODS:
                return is_their_assignment
            
            # Allow partial update (POST to return-asset action) if it's their assignment
            if view.action == 'partial_update': 
                # This allows them to update fields like 'returned_at', but the serializer
                # should restrict what fields they can actually change.
                return is_their_assignment
                
        return False