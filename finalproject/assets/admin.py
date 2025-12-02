from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('id', 'asset_tag', 'name', 'organization', 'status')
    list_filter = ('status', 'organization')
    search_fields = ('asset_tag', 'name')
