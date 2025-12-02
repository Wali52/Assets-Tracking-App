from django.db import models
from decimal import Decimal

class OrgSettings(models.Model):
    organization = models.OneToOneField(
        "organizations.Organization",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="settings"
    )
    fine_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    def __str__(self):
        return f"Settings for {self.organization.name}"
