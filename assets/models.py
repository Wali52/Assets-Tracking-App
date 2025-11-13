from django.db import models

class Asset(models.Model):
    STATUS_CHOICES = [
        ("Available", "Available"),
        ("Assigned", "Assigned"),
        ("Maintenance", "Maintenance"),
    ]

    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="assets"
    )
    asset_tag = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    category = models.ForeignKey("asset_categories.AssetCategory", on_delete=models.SET_NULL, null=True)
    department = models.ForeignKey("departments.Department", on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Available")
    created_by_user = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, related_name="created_assets"
    )

    class Meta:
        unique_together = ("organization", "asset_tag")

    def __str__(self):
        return f"{self.asset_tag} - {self.name}"
