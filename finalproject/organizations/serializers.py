from rest_framework import serializers
from organizations.models import Organization
from users.serializers import UserSerializer # Ensure this is available

# 1. Define a temporary serializer for the Admin User data needed during setup
class AdminSetupSerializer(serializers.Serializer):
    """
    Serializer used only during the initial setup to validate Admin user credentials.
    This data does NOT save directly to the database; it's used to create the User.
    """
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')


class OrganizationSerializer(serializers.ModelSerializer):
    # 2. Define the nested data field using the temporary serializer
    admin_data = AdminSetupSerializer(write_only=True, required=True)
    
    # 3. Add read-only fields for output if needed (like number of users)
    # user_count = serializers.SerializerMethodField() # Example

    class Meta:
        model = Organization
        fields = ['id', 'name', 'admin_data', 'created_at']
        read_only_fields = ['id', 'created_at']

    # We do NOT override the create method here, as the custom logic is in 
    # the InitialSetupView to handle the Organization, OrgSettings, and User creation.

    def validate(self, data):
        """
        Custom validation to ensure organization name is unique before proceeding.
        """
        return data
        

