from django.db import models
from django.utils import timezone

class AssignmentHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="assignment_history"
    )
    assignment = models.ForeignKey("assignments.Assignment", on_delete=models.CASCADE, related_name="history")
    changed_by_user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=50)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.assignment.asset.asset_tag} → {self.status} @ {self.timestamp}"
