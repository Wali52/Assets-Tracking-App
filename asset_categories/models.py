from django.db import models

class AssetCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="categories"
    )
    name = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"
