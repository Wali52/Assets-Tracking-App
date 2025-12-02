from rest_framework import serializers
from .models import AssignmentHistory

class AssignmentHistorySerializer(serializers.ModelSerializer):

    # Add proper read-only computed fields
    assignment_id = serializers.IntegerField(source='assignment.id', read_only=True)
    changed_by_user_email = serializers.EmailField(source='changed_by_user.email', read_only=True)

    class Meta:
        model = AssignmentHistory
        fields = [
            'id',
            'organization',
            'assignment',
            'assignment_id',
            'changed_by_user',
            'changed_by_user_email',
            'status',
            'timestamp',
        ]
        read_only_fields = fields
