from rest_framework import serializers
from .models import AssetCategory

class AssetCategorySerializer (serializers.ModelSerializer):
    # Custom read-only field to display the organization name
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = AssetCategory
        fields = ['id', 'name', 'organization', 'organization_name']
        read_only_fields = ['id', 'organization_name']
        