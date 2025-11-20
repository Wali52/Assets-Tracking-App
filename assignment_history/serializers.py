# from rest_framework import serializers
# from .models import AssignmentHistory

# class AssignmentHistorySerializer(serializers.ModelSerializer):
#     """
#     Serializer for the AssignmentHistory model.
#     All fields are read-only as records are created by the system.
#     """
    
#     # Read-only fields for context:
#     assignment_id = serializers.IntegerField(source='assignment.id', read_only=True)
#     user_email = serializers.EmailField(source='user.email', read_only=True)

#     class Meta:
#         model = AssignmentHistory
#         fields = [
#             'id',
#             'assignment',
#             'assignment_id',
#             'user',
#             'user_email',
#             'timestamp',
#             'action',
#             'details'
#         ]
#         # Crucial: Explicitly setting all fields as read-only.
#         read_only_fields = fields


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
