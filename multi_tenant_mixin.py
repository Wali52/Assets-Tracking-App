# # from rest_framework import permissions
# # from rest_framework.exceptions import PermissionDenied
# # from django.db import models

# # class MultiTenantMixin:
# #     """
# #     Mixin to enforce multi-tenancy and set organization/user ownership 
# #     on model instances automatically.
    
# #     This mixin ensures that:
# #     1. Querysets are automatically filtered by the authenticated user's organization 
# #        (the core multi-tenancy security).
# #     2. When creating new objects, the user's organization and their user instance 
# #        (as the creator/assigner) are automatically injected into the model fields.
    
# #     NOTE: This requires the authenticated user (self.request.user) to be linked 
# #     to an Organization via a Foreign Key field named 'organization'.
# #     """
    
# #     # 1. Multi-Tenancy Filtering (Read/List/Retrieve)
# #     def get_queryset(self):
# #         # SECURITY CHECK 1: Ensure user is authenticated
# #         if not self.request.user.is_authenticated:
# #              # In a production environment, this should return queryset.none() 
# #              # or raise PermissionDenied. For initial testing, we let it pass.
# #              return super().get_queryset() 
        
# #         queryset = super().get_queryset()

# #         # Check if the model has an 'organization' ForeignKey field (most models do)
# #         if hasattr(self.queryset.model, 'organization'):
# #             try:
# #                 # This is the core multi-tenancy filter:
# #                 # It ensures only records belonging to the user's organization are returned.
# #                 return queryset.filter(organization=self.request.user.organization)
# #             except AttributeError:
# #                 # User is authenticated but is not linked to an organization (error state).
# #                 return queryset.none()
        
# #         # For models without an organization FK (like Organization itself), return default.
# #         return queryset

# #     # 2. Ownership Injection (Create/Update)
# #     def perform_create(self, serializer):
# #         if not self.request.user.is_authenticated:
# #             raise PermissionDenied("Authentication required to create records.")

# #         # Prepare fields to automatically inject during creation
# #         injection_kwargs = {}

# #         # a) Inject Organization (Tenant)
# #         if hasattr(serializer.Meta.model, 'organization'):
# #             try:
# #                 injection_kwargs['organization'] = self.request.user.organization
# #             except AttributeError:
# #                 # User must be linked to an organization to create data within it.
# #                 raise PermissionDenied("User is not assigned to an organization.")
        
# #         # b) Inject Creator/Assigner (User)
# #         # Check if the model has a field that tracks the user creating/assigning the record
# #         user_field_map = {
# #             'created_by_user': self.request.user,  # Used in Asset
# #             'assigned_by_user': self.request.user, # Used in Assignment
# #             # 'employee': self.request.user # Reserved for self-assignment logic, not for generic creation
# #         }
        
# #         for field_name, user_instance in user_field_map.items():
# #             if hasattr(serializer.Meta.model, field_name):
# #                 # Check if the field is a ForeignKey to avoid errors with fields like 'status'
# #                 if isinstance(serializer.Meta.model._meta.get_field(field_name), models.ForeignKey):
# #                     injection_kwargs[field_name] = user_instance

# #         # Save the instance with the injected fields
# #         serializer.save(**injection_kwargs)


# from rest_framework import permissions
# from rest_framework.exceptions import PermissionDenied, NotFound

# class MultiTenantMixin:
#     """
#     A mixin to filter QuerySets based on the requesting user's organization 
#     (tenant) and automatically inject the organization and user on creation.
    
#     Requires the User model to have an 'organization' ForeignKey.
#     """
    
#     def get_queryset(self):
#         """
#         Filters the queryset to include only objects belonging to the 
#         current user's organization.
        
#         Note: This is skipped if the user is a Super Admin (is_superuser).
#         The OrganizationViewSet does NOT use this mixin.
#         """
#         user = self.request.user
        
#         # Check if the model has an 'organization' field
#         if not hasattr(self.queryset.model, 'organization'):
#             # This is a safety check for models that should NOT be multi-tenanted.
#             # However, for this project, all models except Organization should have it.
#             return self.queryset.none() 

#         # Superusers can see all records
#         if user.is_authenticated and user.is_superuser:
#             return self.queryset.all()
        
#         # All other authenticated users are restricted to their organization
#         if user.is_authenticated and user.organization:
#             return self.queryset.filter(organization=user.organization)
        
#         # If the user is not authenticated, they should see nothing (unless permissions allow public read)
#         return self.queryset.none()

#     def perform_create(self, serializer):
#         user = self.request.user

#         if not user.is_authenticated:
#             raise PermissionDenied("Authentication is required to create resources.")

#         if not (user.is_superuser or user.role == "Admin"):
#             raise PermissionDenied("You do not have permission to create this resource.")

#     # Check if the model has organization or created_by_user fields
#         if hasattr(serializer.Meta.model, "organization") or hasattr(serializer.Meta.model, "created_by_user"):
#             extra = {}
#             if hasattr(serializer.Meta.model, "organization"):
#                 extra["organization"] = user.organization
#             if hasattr(serializer.Meta.model, "created_by_user"):
#                 extra["created_by_user"] = user

#             serializer.save(**extra)
#         else:
#         # For models that don't have organization or created_by_user
#             serializer.save()

            
#     def perform_update(self, serializer):
#         """
#         Ensures the user cannot update an object that doesn't belong to their organization.
#         (This is technically covered by get_queryset, but good practice).
#         """
#         instance = self.get_object()
#         user = self.request.user
        
#         # Standard checks for multi-tenancy before update
#         if hasattr(instance, 'organization') and instance.organization != user.organization:
#              raise PermissionDenied("You do not have permission to modify this resource.")
             
#         serializer.save()

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.db import models
# Import the constant directly from your users app for robust role checking
from users.models import ROLE_ADMIN 

class MultiTenantMixin:
    """
    A mixin to filter QuerySets based on the requesting user's organization 
    (tenant) and automatically inject the organization and user on creation.
    
    Requires the User model to have an 'organization' ForeignKey.
    """
    
    def get_queryset(self):
        """
        Filters the queryset to include only objects belonging to the 
        current user's organization.
        
        Note: This is skipped if the user is a Super Admin (is_superuser).
        """
        user = self.request.user
        
        # Check if the model has an 'organization' field
        if not hasattr(self.queryset.model, 'organization'):
            # Return no results for non-tenanted models that shouldn't be publicly visible
            return self.queryset.none() 

        # Superusers can see all records, overriding tenancy rules
        if user.is_authenticated and user.is_superuser:
            return self.queryset.all()
        
        # All other authenticated users are restricted to their organization
        if user.is_authenticated and user.organization:
            return self.queryset.filter(organization=user.organization)
        
        # Unauthenticated users should see nothing
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user

        if not user.is_authenticated:
            raise PermissionDenied("Authentication is required to create resources.")

        # --- CRITICAL FIX: Use the imported constant instead of the hardcoded string ---
        if not (user.is_superuser or user.role == ROLE_ADMIN):
            raise PermissionDenied("You do not have permission to create this resource.")

        # Check if the model has organization or created_by_user fields
        if hasattr(serializer.Meta.model, "organization") or hasattr(serializer.Meta.model, "created_by_user"):
            extra = {}
            if hasattr(serializer.Meta.model, "organization"):
                try:
                    # Ensure the user belongs to an organization if required by the model
                    extra["organization"] = user.organization
                except AttributeError:
                    raise PermissionDenied("User is not assigned to an organization.")

            if hasattr(serializer.Meta.model, "created_by_user"):
                extra["created_by_user"] = user

            serializer.save(**extra)
        else:
        # For models that don't have organization or created_by_user fields
            serializer.save()

            
    def perform_update(self, serializer):
        """
        Ensures the user cannot update an object that doesn't belong to their organization.
        """
        instance = self.get_object()
        user = self.request.user
        
        # If the instance has an organization field, ensure the user owns it (unless superuser)
        if hasattr(instance, 'organization') and not user.is_superuser:
            if instance.organization != user.organization:
                 raise PermissionDenied("You do not have permission to modify this resource.")
                 
        serializer.save()