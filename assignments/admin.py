from django.contrib import admin
from .models import Assignment

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'organization', 'asset', 'employee', 'status', 'due_date', 'returned_date')
    list_filter = ('status', 'organization')
