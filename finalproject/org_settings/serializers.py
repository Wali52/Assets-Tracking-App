from rest_framework import serializers
from .models import OrgSettings

class OrgSettingsSerializer  (serializers.ModelSerializer):
    
    # We use organization_id for input/output, but keep it read-only for safety.
    organization_id = serializers.CharField(source='organization.id', read_only=True)

    class Meta:
        model = OrgSettings
        # 'fine_per_day' is editable by the Admin
        fields = ['organization_id', 'fine_per_day']