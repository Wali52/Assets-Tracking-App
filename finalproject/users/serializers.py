from rest_framework import serializers
from .models import User
from django.contrib.auth import password_validation


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    # 🔑 Explicitly expose the organization ID for frontend consumption
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    must_change_password = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 
            'password', 'organization', 'organization_id', 'organization_name','must_change_password'
        ]
        read_only_fields = ['id', 'organization_id', 'organization_name','must_change_password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False} # Added required=False here too
        }

    # 1. Add validation for password during create/update
    def validate_password(self, value):
        # Validates password against settings (min length, complexity, etc.)
        password_validation.validate_password(value, self.instance)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.must_change_password = True
            user.save()
        return user

    # 2. Add an update method to handle password changes during PATCH
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            # Flag must_change_password if the admin updates their password
            user.must_change_password = False # Assuming password change means they don't have to change it again
            user.save()
            
        return user

        
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value, self.instance) # Added self.instance for user context
        return value
    
