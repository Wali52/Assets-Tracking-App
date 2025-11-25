# # from django.contrib import admin
# # from .models import Assignment

# # @admin.register(Assignment)
# # class AssignmentAdmin(admin.ModelAdmin):
# #     list_display = ('id', 'organization', 'asset', 'employee', 'status', 'due_date', 'returned_date')
# #     list_filter = ('status', 'organization')

# from django.contrib import admin
# from django.db.models import Q
# from .models import Assignment
# # Assuming these models exist in your structure:
# from assets.models import Asset
# from users.models import User 


# @admin.register(Assignment)
# class AssignmentAdmin(admin.ModelAdmin):
#     # Standard admin configuration
#     list_display = ('id', 'organization', 'asset_name', 'employee_full_name', 'status', 'due_date', 'returned_date')
#     list_filter = ('status', 'organization')
#     search_fields = ('asset__asset_tag', 'employee__first_name', 'employee__last_name')
#     date_hierarchy = 'assigned_date'
    
#     # Custom method to display Asset name in the list view
#     def asset_name(self, obj):
#         # Safely access the asset's name
#         return obj.asset.name if obj.asset else 'N/A'
#     asset_name.short_description = 'Asset'
    
#     # FIX: Safely display Employee's full name without relying on get_full_name()
#     def employee_full_name(self, obj):
#         if obj.employee:
#             # Concatenate first_name and last_name directly
#             return f"{obj.employee.first_name} {obj.employee.last_name}".strip()
#         return 'N/A'
#     employee_full_name.short_description = 'Employee'
    
#     # Fields displayed in the add/change form
#     fields = (
#         'organization', 
#         ('asset', 'employee'), 
#         ('assigned_date', 'due_date'), 
#         'status', 
#         'fine_amount'
#     )
    
#     # ------------------------------------------------------------------
#     # CORE FIX: Dynamically filter ForeignKey fields (Asset, Employee)
#     # ------------------------------------------------------------------
#     def formfield_for_foreignkey(self, db_field, request, **kwargs):
        
#         # 1. Determine the Organization ID to filter by
#         organization_id = None
        
#         # A. Check if we are editing an existing assignment
#         assignment_id = request.resolver_match.kwargs.get('object_id')
#         if assignment_id:
#             try:
#                 # If editing, use the organization of the existing assignment instance
#                 assignment_instance = Assignment.objects.get(pk=assignment_id)
#                 organization_id = assignment_instance.organization_id
#             except Assignment.DoesNotExist:
#                 pass
        
#         # B. Fallback: For new assignments or if org not found, use the logged-in user's organization
#         if not organization_id and request.user.is_authenticated:
#             # Assuming the User model has a foreign key called 'organization'
#             organization_id = request.user.organization_id


#         # 2. Apply filtering to the 'asset' field
#         if db_field.name == "asset" and organization_id:
#             kwargs["queryset"] = Asset.objects.filter(organization_id=organization_id)
            
#         # 3. Apply filtering to the 'employee' field
#         if db_field.name == "employee" and organization_id:
#             # Assumes your User model has an organization_id field
#             kwargs["queryset"] = User.objects.filter(organization_id=organization_id)

#         # Allow the default behavior for all other foreign key fields
#         return super().formfield_for_foreignkey(db_field, request, **kwargs)

from django.contrib import admin
from assignments.models import Assignment
# Assuming these models exist in your structure:
from assets.models import Asset
from users.models import User 


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    # Standard admin configuration
    list_display = ('id', 'organization', 'asset_name', 'employee_full_name', 'status', 'due_date', 'returned_date')
    list_filter = ('status', 'organization')
    search_fields = ('asset__asset_tag', 'employee__first_name', 'employee__last_name')
    date_hierarchy = 'assigned_date'
    
    # Custom methods for list display
    def asset_name(self, obj):
        return obj.asset.name if obj.asset else 'N/A'
    asset_name.short_description = 'Asset'
    
    def employee_full_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}".strip()
        return 'N/A'
    employee_full_name.short_description = 'Employee'
    
    # Fields displayed in the add/change form
    fields = (
        'organization', 
        ('asset', 'employee'), 
        ('assigned_date', 'due_date'), 
        'status', 
        'fine_amount'
    )
    
    # NOTE: We have removed the formfield_for_foreignkey method entirely,
    # because the dynamic filtering is now handled by the custom JavaScript.
    