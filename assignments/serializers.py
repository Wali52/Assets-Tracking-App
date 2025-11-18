from rest_framework import serializers
from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Assignment model.
    
    Includes key read-only fields for readability and the critical 
    live_fine_amount property for dynamic fine calculation.
    """
    
    # Read-only fields to display human-readable names:
    asset_tag = serializers.CharField(source='asset.asset_tag', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    # Using 'get_full_name' assuming your User model has this method
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by_user.get_full_name', read_only=True)
    
    # CRITICAL: This pulls the calculated property from the Assignment model
    # It shows the fine *right now* if the asset is overdue.
    live_fine = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        source='live_fine_amount', 
        read_only=True
    )

    class Meta:
        model = Assignment
        fields = [
            'id',
            'asset',
            'asset_tag', # Read-only for display
            'asset_name', # Read-only for display
            'employee',
            'employee_name', # Read-only for display
            'assigned_by_user',
            'assigned_by_name', # Read-only for display
            'assigned_date',
            'due_date',
            'returned_date',
            'status',
            'fine_amount',  # This is the stored, final fine amount
            'live_fine',    # This is the calculated, current fine amount (read-only)
            'organization',
        ]
        read_only_fields = [
            'id', 
            'asset_tag', 
            'asset_name', 
            'employee_name', 
            'assigned_by_name', 
            'fine_amount', # fine_amount is only set by the system on return
            'live_fine'
        ]