from rest_framework import serializers
from .models import OrgSettings

class OrgSettingsSerializer  (serializers.ModelSerializer):
    
    organization_id = serializers.CharField(source='organization.id', read_only=True)

    class Meta:
        model = OrgSettings
        fields = ['organization_id', 'fine_per_day']