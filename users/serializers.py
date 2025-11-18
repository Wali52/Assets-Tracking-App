from rest_framework import serializers
from .models import User

class UserSerializer (serializers.ModelSerializer):

    # Custom read-only field to display the organization name instead of just the ID
    organization_name = serializers.CharField(source='organizaion.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 
            'email', 
            'first_name', 
            'last_name', 
            'role', 
            'organization', 
            'organization_name']
        
        read_only_fields = ['id', 'organization_name']
        extra_kwargs = {
            # Ensure password_hash is never exposed in API output
            'password_hash': {'write_only': True}
        }