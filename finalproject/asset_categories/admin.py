from django.contrib import admin
from .models import AssetCategory

@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'organization')
