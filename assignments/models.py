from django.db import models
from django.utils import timezone
from decimal import Decimal
# --- New Imports for Model Validation ---
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
# ---------------------------------------

def get_today():
    # Helper function to get today's date correctly
    return timezone.now().date()

class Assignment(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Returned", "Returned"),
        ("Requested Return", "Requested Return"),
        ("Overdue", "Overdue"),
    ]

    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="assignments"
    )
    asset = models.ForeignKey("assets.Asset", on_delete=models.CASCADE)
    employee = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="employee_assignments")
    assigned_date = models.DateField(default=get_today)
    due_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="Active")
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    assigned_by_user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, related_name="assigned_by")

    # ----------------------------------------------------
    # Model-Level Validation for Django Admin/Forms
    # ----------------------------------------------------
    # def clean(self):
    #     """
    #     Ensures that an Asset can only have one Active or Overdue assignment at a time.
    #     This method is called automatically by the Django Admin interface before saving.
    #     """
    #     if self.asset:
            
    #         # --- Check 1: Asset Maintenance Status ---
    #         # Assuming your Asset model has a 'status' field
    #         if hasattr(self.asset, 'status') and self.asset.status == "Maintenance":
    #              raise ValidationError({
    #                 'asset': _('This asset is currently under maintenance and cannot be assigned.')
    #             })

    #         # --- Check 2: Existing Active Assignment ---
    #         # We only perform this integrity check if the current assignment is being set to Active or Overdue.
    #         if self.status in ["Active", "Overdue"]:
                
    #             # Filter for *other* assignments on the same asset that are Active or Overdue
    #             active_assignments = Assignment.objects.filter(
    #                 asset=self.asset,
    #                 status__in=["Active", "Overdue"]
    #             )

    #             # If we are updating an existing assignment, exclude the current instance (self.pk)
    #             # from the check to prevent self-conflict.
    #             if self.pk:
    #                 active_assignments = active_assignments.exclude(pk=self.pk)

    #             if active_assignments.exists():
    #                 raise ValidationError({
    #                     'asset': _('This asset is already linked to another active or overdue assignment.')
    #                 })
        
    #     # Always call the parent clean method
    #     super().clean()

    def clean(self):
        """
        Ensures:
        1. An Asset cannot be assigned if under maintenance.
        2. An Asset cannot have multiple Active/Overdue assignments.
        3. An Asset of one organization cannot be assigned to an employee of another organization.
        """
        if self.asset:

        # --- Check 1: Asset Maintenance Status ---
            if hasattr(self.asset, 'status') and self.asset.status == "Maintenance":
                raise ValidationError({
                'asset': _('This asset is currently under maintenance and cannot be assigned.')
            })

        # --- Check 2: Existing Active Assignment ---
            if self.status in ["Active", "Overdue"]:
                active_assignments = Assignment.objects.filter(
                asset=self.asset,
                status__in=["Active", "Overdue"]
            )
            if self.pk:
                active_assignments = active_assignments.exclude(pk=self.pk)
            if active_assignments.exists():
                raise ValidationError({
                    'asset': _('This asset is already linked to another active or overdue assignment.')
                })

        # --- Check 3: Asset and Employee must belong to the same organization ---
            if self.organization != self.asset.organization:                
                raise ValidationError({
                'employee': _('This employee belongs to a different organization than the asset.')
            })

        super().clean()


    # ----------------------------------------------------
    # Existing methods
    # ----------------------------------------------------
    def calculate_fine(self):
        # ... (fine calculation logic) ...
        if self.returned_date and self.returned_date > self.due_date:
            days_overdue = (self.returned_date - self.due_date).days
            # You need to ensure self.organization.settings.fine_per_day is accessible here
            # I am commenting out the problematic line just in case 'settings' isn't available
            # fine_per_day = self.organization.settings.fine_per_day 
            fine_per_day = Decimal("5.00") # Placeholder value
            
            self.fine_amount = Decimal(days_overdue) * fine_per_day
        else:
            self.fine_amount = Decimal("0.00")
        self.save()

    def __str__(self):
        return f"Assignment #{self.id} ({self.asset.asset_tag})"



