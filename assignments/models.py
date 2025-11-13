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
