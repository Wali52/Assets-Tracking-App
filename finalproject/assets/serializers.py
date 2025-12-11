from rest_framework import serializers
from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
    """
    Serializer for the Asset model.
    Includes human-readable names and the ID of the current active assignment.
    """
    # Read-only fields to translate FK IDs into names for the client
    category_name = serializers.CharField(source='category.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_user_email = serializers.EmailField(source='created_by_user.email', read_only=True)

    # 🛑 NEW FIELD: Gets the ID of the current active assignment
    current_assignment_id = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id', 
            'asset_tag', 
            'name', 
            'category', 
            'category_name', 
            'department', 
            'department_name', 
            'status', 
            'organization', 
            'created_by_user', 
            'created_by_user_email',
            'current_assignment_id' # 🛑 Include the new field
        ]
        read_only_fields = ['id', 'category_name', 'department_name', 'created_by_user_email', 'current_assignment_id']
        
    def get_current_assignment_id(self, obj):
        """
        Looks up the ID of the single active assignment for this asset.
        Filters by assignments that are not yet 'Returned' or 'Cancelled'.
        """
        try:
            
            active_assignment = obj.assignment_set.filter(
                status__in=['Active', 'Overdue', 'Requested Return']
            ).latest('assigned_date') # Gets the most recent active assignment ID
            
            return active_assignment.id
        except Exception:
            # Return None if no active assignment is found (e.g., status is 'Available')
            return None