from django.db import models
from django.utils import timezone
from decimal import Decimal

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
    assigned_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="Active")
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    assigned_by_user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, related_name="assigned_by")

    def calculate_fine(self):
        if self.returned_date and self.returned_date > self.due_date:
            days_overdue = (self.returned_date - self.due_date).days
            fine_per_day = self.organization.settings.fine_per_day
            self.fine_amount = Decimal(days_overdue) * fine_per_day
        else:
            self.fine_amount = Decimal("0.00")
        self.save()

    def __str__(self):
        return f"Assignment #{self.id} ({self.asset.asset_tag})"



# from django.db import models
# from django.utils import timezone
# from decimal import Decimal
# from datetime import date # Import date for comparison with timezone.now().date()

# # Define choices here, ensuring max_length is sufficient
# ASSIGNMENT_STATUSES = (
#     ("Active", "Active"),
#     ("Returned", "Returned"),
#     ("Requested Return", "Requested Return"),
#     ("Overdue", "Overdue"),
# )

# class Assignment(models.Model):
#     # Foreign key references using string format for inter-app relationships
#     organization = models.ForeignKey(
#         'organizations.Organization', on_delete=models.CASCADE, related_name="assignments"
#     )
#     asset = models.OneToOneField('assets.Asset', on_delete=models.PROTECT) # Changed to OneToOneField per original ERD, using PROTECT
#     employee = models.ForeignKey(
#         'users.User', on_delete=models.PROTECT, related_name="current_assignments"
#     )
#     assigned_by_user = models.ForeignKey(
#         'users.User', on_delete=models.SET_NULL, null=True, related_name="assignments_made"
#     )
    
#     assigned_date = models.DateField(default=timezone.now)
#     due_date = models.DateField()
#     returned_date = models.DateField(null=True, blank=True)
    
#     status = models.CharField(max_length=20, choices=ASSIGNMENT_STATUSES, default="Active")
#     # This field now stores the FINAL fine calculated at return time
#     fine_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
#     # --- DYNAMIC PROPERTY FOR LIVE FINE CALCULATION ---
#     @property
#     def live_fine_amount(self):
#         """Calculates the fine based on today's date if not returned."""
#         today = date.today()

#         # 1. If the asset has already been returned and fine_amount is set, return the stored fine.
#         if self.returned_date:
#             return self.fine_amount if self.fine_amount is not None else Decimal('0.00')

#         # 2. If not returned, check for overdue status against today's date.
#         if today > self.due_date:
#             try:
#                 # Need to check if the organization has settings defined
#                 fine_per_day = self.organization.orgsettings.fine_per_day
#             except Exception:
#                 # Fallback if OrgSettings hasn't been created yet for this Org
#                 fine_per_day = Decimal('0.00')

#             days_overdue = (today - self.due_date).days
#             return Decimal(days_overdue) * fine_per_day
        
#         # 3. If it is active and not overdue
#         return Decimal('0.00')

#     def save_final_fine(self):
#         """
#         Calculates and saves the final fine when the asset is returned.
#         This is called specifically during the return process in the ViewSet.
#         """
#         if self.returned_date and self.returned_date > self.due_date:
#             try:
#                 fine_per_day = self.organization.orgsettings.fine_per_day
#             except Exception:
#                 fine_per_day = Decimal('0.00')

#             days_overdue = (self.returned_date - self.due_date).days
#             self.fine_amount = Decimal(days_overdue) * fine_per_day
#         else:
#             self.fine_amount = Decimal("0.00")
        
#         # Note: We do NOT call self.save() here. The ViewSet will call save() after this method runs.

#     def __str__(self):
#         return f"Assignment {self.id} for Asset {self.asset.asset_tag}"