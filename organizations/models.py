from django.db import models
from django.utils import timezone

class Organization(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name
