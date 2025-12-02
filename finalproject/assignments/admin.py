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
    

    