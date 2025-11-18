from rest_framework import serializers
from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
     
    #Serializer for the Asset model.
    # Includes human-readable names for category, department, and creator.
    
    # Read-only fields to translate FK IDs into names for the client
    category_name = serializers.CharField(source='category.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_user_email = serializers.EmailField(source='created_by_user.email', read_only=True)

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
            'created_by_user_email'
        ]
        read_only_fields = ['id', 'category_name', 'department_name', 'created_by_user_email']
    