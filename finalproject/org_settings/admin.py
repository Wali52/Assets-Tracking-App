from django.contrib import admin
from .models import OrgSettings

@admin.register(OrgSettings)
class OrgSettingsAdmin(admin.ModelAdmin):
    list_display = ('organization', 'fine_per_day')
