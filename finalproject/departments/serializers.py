from rest_framework import serializers
from .models import Department

class DepartmentSerializer (serializers.ModelSerializer):
    # Add organization name for context
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'organization', 'organization_name']
        read_only_fields = ['id', 'organization_name']