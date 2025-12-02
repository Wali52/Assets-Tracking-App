from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.db import models
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