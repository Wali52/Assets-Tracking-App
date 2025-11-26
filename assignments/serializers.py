from rest_framework import serializers
from .models import Assignment
from assets.models import Asset
from django.utils import timezone
from decimal import Decimal
from django.core.exceptions import ValidationError # <-- ADDED FOR full_clean()

# Assuming these imports are available in your environment
# from organizations.models import OrgSettings 

class AssignmentSerializer(serializers.ModelSerializer):
    asset_tag = serializers.CharField(source='asset.asset_tag', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by_user.get_full_name', read_only=True)

    live_fine = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        source='live_fine_amount',
        read_only=True
    )

    class Meta:
        model = Assignment
        fields = [
            'id',
            'asset',
            'asset_tag',
            'asset_name',
            'employee',
            'employee_name',
            'assigned_by_user',
            'assigned_by_name',
            'assigned_date',
            'due_date',
            'returned_date',
            'status',
            'fine_amount',
            'live_fine',
            'organization',
        ]
        read_only_fields = [
            'id',
            'asset_tag',
            'asset_name',
            'employee_name',
            'assigned_by_name',
            'fine_amount',
            'live_fine'
            
        ]

    # ----------------------------
    # VALIDATION: Prevent asset change on update
    # ----------------------------
    def validate_asset(self, value):
        """
        Prevent changing the asset on an existing assignment instance.
        """
        if self.instance and value != self.instance.asset:
            raise serializers.ValidationError(
                "You cannot change the asset of an existing assignment."
            )
        return value

    def validate(self, data):
        asset = data.get("asset") or (self.instance.asset if self.instance else None)
        employee = data.get("employee") or (self.instance.employee if self.instance else None)
        organization = data.get("organization") or (self.instance.organization if self.instance else None)

        # Run existing DRF validation for maintenance & active assignment
        if asset:
            if asset.status == "Maintenance":
                raise serializers.ValidationError({
                "asset": "This asset is under maintenance and cannot be assigned."
            })

            active_assignments = Assignment.objects.filter(
                asset=asset,
                status__in=["Active", "Overdue"]
            )
            if self.instance:
                active_assignments = active_assignments.exclude(id=self.instance.id)
            if active_assignments.exists():
                raise serializers.ValidationError({
                    "asset": "This asset is already linked to an active or overdue assignment."
                })

        # ✅ CRITICAL: Organization check (MUST BE ACTIVE)
        if asset and employee and organization:
            # Check if the asset's organization matches the employee's organization
            if asset.organization != employee.organization:
                raise serializers.ValidationError({
                    "employee": "Security Error: This employee belongs to a different organization than the asset. Cross-tenant assignment is forbidden."
                })

        # Optional: Call model's clean() for any other validations
        temp_instance = self.instance or Assignment(**data)
        try:
            temp_instance.full_clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)

        return data

    # ----------------------------
    # CREATE: Assign asset (update asset status)
    # ----------------------------
    def create(self, validated_data):
        assignment = super().create(validated_data)
        asset = validated_data["asset"]
        asset.status = "Assigned"
        asset.save()
        return assignment

    # ----------------------------
    # UPDATE: Handle returned assets & fines (The `return_asset` action should handle this)
    # ----------------------------
    def update(self, instance, validated_data):
        # We are simplifying this to only allow updates to fields like due_date, notes, etc.
        # The complex 'return' logic is handled by the ViewSet's @action.

        # If returned_date is set via a standard update, we handle the return process here.
        if "returned_date" in validated_data and validated_data["returned_date"]:
            
            # The ViewSet's @action is better, but keeping this for completeness if users don't use the action.
            assignment = super().update(instance, validated_data)

            # Update asset status
            asset = assignment.asset
            asset.status = "Available"
            asset.save()
            
            # The fine calculation logic here is complex and duplicated from the ViewSet's action.
            # It's better to delegate this to a dedicated method or the @action, but
            # ensuring it uses the OrgSettings from the assignment's organization.
            
            # This logic should generally be handled by the @action, but if needed here:
            returned_date = validated_data["returned_date"]
            if returned_date > assignment.due_date:
                days_overdue = (returned_date - assignment.due_date).days
                # Assuming OrgSettings is accessible via organization.settings or similar
                # fine_per_day = assignment.organization.settings.fine_per_day # Use this if possible
                
                # FALLBACK: If organization.settings isn't directly available, it requires a query.
                # Since the @action handles the full calculation, we will rely on that.
                pass
            
            # Set status to Returned (if not already handled)
            if assignment.status not in ["Returned", "Lost"]:
                assignment.status = "Returned"
                assignment.save()

            return assignment
        
        # Standard update for fields other than return logic
        return super().update(instance, validated_data)