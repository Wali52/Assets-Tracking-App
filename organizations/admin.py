from django.contrib import admin
from .models import Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('pk','id', 'name', 'created_at')
    readonly_fields = ('pk',)


