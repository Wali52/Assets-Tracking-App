from django.contrib import admin
from .models import AssignmentHistory

@admin.register(AssignmentHistory)
class AssignmentHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'organization', 'assignment', 'changed_by_user', 'status', 'timestamp')
