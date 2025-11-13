from django.db import models

class Department(models.Model):
    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="departments"
    )
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"
