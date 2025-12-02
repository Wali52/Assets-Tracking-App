from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from users.serializers import ChangePasswordSerializer
from rest_framework.generics import GenericAPIView


# new -----
class OrganizationTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['organization_id'] = user.organization_id
        token['email'] = user.email
        token['role'] = user.role
        token['must_change_password'] = user.must_change_password
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add must_change_password flag to the login response
        data["must_change_password"] = self.user.must_change_password

        return data


class OrganizationTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses the specialized serializer to include
    organization data in the JWT payload.
    """
    serializer_class = OrganizationTokenObtainPairSerializer
    

# new ----
class ChangePasswordView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response({"detail": "Both old_password and new_password are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        if not check_password(old_password, user.password):
            return Response({"detail": "Old password is incorrect."},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.must_change_password = False
        user.save()

        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)