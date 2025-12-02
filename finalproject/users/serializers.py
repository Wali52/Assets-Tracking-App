from rest_framework import serializers
from .models import User
from django.contrib.auth import password_validation


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    must_change_password = serializers.BooleanField(read_only=True)
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 
            'password', 'organization', 'organization_name','must_change_password'
        ]
        read_only_fields = ['id', 'organization_name','must_change_password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.must_change_password = True
            user.save()
        return user

        
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value
    
    
