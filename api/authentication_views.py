from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class OrganizationTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer to include the user's organization_id in the token payload.
    This allows the MultiTenantMixin to work immediately after login.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token payload
        token['organization_id'] = user.organization_id
        token['email'] = user.email
        token['role'] = user.role

        return token

class OrganizationTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses the specialized serializer to include
    organization data in the JWT payload.
    """
    serializer_class = OrganizationTokenObtainPairSerializer