# # from django.shortcuts import render

# from rest_framework import viewsets, mixins, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.utils import timezone
# from finalproject.multi_tenant_mixin import MultiTenantMixin 
# from rest_framework.permissions import IsAuthenticated

# # Import all Models and Serializers from their respective apps
# from organizations.models import Organization
# from organizations.serializers import OrganizationSerializer

# from org_settings.models import OrgSettings
# from org_settings.serializers import OrgSettingsSerializer

# from users.models import User
# from users.serializers import UserSerializer

# from departments.models import Department
# from departments.serializers import DepartmentSerializer

# from asset_categories.models import AssetCategory
# from asset_categories.serializers import AssetCategorySerializer

# from assets.models import Asset
# from assets.serializers import AssetSerializer

# from assignments.models import Assignment
# from assignments.serializers import AssignmentSerializer

# from assignment_history.models import AssignmentHistory
# from assignment_history.serializers import AssignmentHistorySerializer


# # =========================================================================
# # 1. Organization ViewSet (Super Admin Only - No Multi-Tenancy Filtering)
# # =========================================================================

# class OrganizationViewSet(viewsets.ModelViewSet):
#     """
#     Lists all tenants. Only accessible by Super Admins.
#     Does NOT use the MultiTenantMixin as it needs to view all organizations.
#     """
#     queryset = Organization.objects.all().order_by('name')
#     serializer_class = OrganizationSerializer
#     # NOTE: Permissions (e.g., IsSuperAdmin) must be added here to secure access.


# # =========================================================================
# # 2. OrgSettings ViewSet (Tenant Admin Only - Use Mixin)
# # =========================================================================

# class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
#     """
#     Allows Org Admins to view and update their organization's settings 
#     (e.g., fine rate).
#     """
#     serializer_class = OrgSettingsSerializer
#     queryset = OrgSettings.objects.all()
    
#     def perform_update(self, serializer):
#         """Standard update operation."""
#         serializer.save()


# # =========================================================================
# # 3. User ViewSet (Tenant Admin / Employee - Use Mixin)
# # =========================================================================

# class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """
#     Manages users within a specific organization (tenant).
#     The Mixin handles the organization filtering automatically.
#     """
#     serializer_class = UserSerializer
#     queryset = User.objects.all().order_by('last_name')

#     def get_queryset(self):
#         """
#         Applies multi-tenancy filter via the Mixin.
#         (Further role-based filtering will be added via permissions).
#         """
#         return super().get_queryset()


# # =========================================================================
# # 4. Department ViewSet (Tenant Admin Only - Use Mixin)
# # =========================================================================

# class DepartmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """Allows Admins to manage departments for their organization."""
#     serializer_class = DepartmentSerializer
#     queryset = Department.objects.all().order_by('name')

#     def perform_create(self, serializer):
#         """Injects organization on creation via the Mixin."""
#         super().perform_create(serializer)


# # =========================================================================
# # 5. AssetCategory ViewSet (Tenant Admin Only - Use Mixin)
# # =========================================================================

# class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """Allows Admins to manage asset categories for their organization."""
#     serializer_class = AssetCategorySerializer
#     queryset = AssetCategory.objects.all().order_by('name')

#     def perform_create(self, serializer):
#         """Injects organization on creation via the Mixin."""
#         super().perform_create(serializer)


# # =========================================================================
# # 6. Asset ViewSet (Tenant Admin Only - Use Mixin)
# # =========================================================================

# class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """Allows Admins to manage assets for their organization."""
#     serializer_class = AssetSerializer
#     queryset = Asset.objects.all().order_by('asset_tag')

#     def perform_create(self, serializer):
#         """Injects current user and organization on creation via the Mixin."""
#         super().perform_create(serializer)


# # =========================================================================
# # 7. Assignment ViewSet (Core Logic - Use Mixin)
# # =========================================================================

# class AssignmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """
#     Manages asset assignments. Includes the critical asset return action.
#     """
#     serializer_class = AssignmentSerializer
#     queryset = Assignment.objects.all().order_by('-assigned_date')

#     def get_queryset(self):
#         """
#         Applies multi-tenancy filter via the Mixin.
#         (Role-based filtering for Employees will be added here later).
#         """
#         return super().get_queryset()

#     def perform_create(self, serializer):
#         """Injects assigned_by_user and organization on creation via the Mixin."""
#         super().perform_create(serializer)


#     @action(detail=True, methods=['post'], url_path='return-asset')
#     def return_asset(self, request, pk=None):
#         """
#         Custom action to handle asset return: 
#         1. Updates assignment status and returned_date.
#         2. Calculates and saves the final fine.
#         3. Updates the asset status to 'Available'.
#         """
#         try:
#             assignment = self.get_object()
#         except Assignment.DoesNotExist:
#             return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

#         if assignment.status != 'Active' and assignment.status != 'Overdue':
#             return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)
        
#         # 1. Update status and return date
#         assignment.status = 'Returned'
#         assignment.returned_date = timezone.now().date() 

#         # 2. Calculate and set final fine using the model method
#         assignment.save_final_fine()

#         # 3. Save the assignment object (updates status and fine_amount)
#         assignment.save()
        
#         # 4. Update the Asset status
#         asset = assignment.asset
#         asset.status = 'Available'
#         asset.save() # NOTE: Assumes Asset model is available for save (imported at top)

#         # Return the updated object
#         serializer = self.get_serializer(assignment)
#         return Response(serializer.data, status=status.HTTP_200_OK)


# # =========================================================================
# # 8. Assignment History ViewSet (Read Only - Use Mixin)
# # =========================================================================

# class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
#     """
#     Provides a read-only system log of assignment actions.
#     Records are created by the system/Assignment ViewSet, not directly by users.
#     """
#     serializer_class = AssignmentHistorySerializer
#     queryset = AssignmentHistory.objects.all().order_by('-timestamp')

#     def get_queryset(self):
#         """
#         Applies multi-tenancy filter via the Mixin.
#         (Role-based filtering for Employees will be added here later).
#         """
#         return super().get_queryset()
# # Create your views here.
import uuid
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from organizations.serializers import OrganizationSerializer
from organizations.models import Organization
from org_settings.models import OrgSettings
from users.models import User # Assuming User model is imported here
from django.db import transaction
from rest_framework import viewsets, mixins, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
# FIX 1: Import the mixin directly from the project root
from multi_tenant_mixin import MultiTenantMixin 
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction

# Import all Models and Serializers from their respective apps
from organizations.models import Organization
from organizations.serializers import OrganizationSerializer

from org_settings.models import OrgSettings
from org_settings.serializers import OrgSettingsSerializer

from users.models import User
from users.serializers import UserSerializer

from departments.models import Department
from departments.serializers import DepartmentSerializer

from asset_categories.models import AssetCategory
from asset_categories.serializers import AssetCategorySerializer

from assets.models import Asset
from assets.serializers import AssetSerializer

from assignments.models import Assignment
from assignments.serializers import AssignmentSerializer

from assignment_history.models import AssignmentHistory
from assignment_history.serializers import AssignmentHistorySerializer

from rest_framework_simplejwt.views import TokenObtainPairView
from api.authentication_views import OrganizationTokenObtainPairSerializer


from api.authentication_views import OrganizationTokenObtainPairSerializer, OrganizationTokenObtainPairView
from api.permissions import UserAccessPermission
# =========================================================================
# A. PUBLIC SETUP ENDPOINT (Replaces 'initial_setup' app)
# =========================================================================

# class InitialSetupView(generics.CreateAPIView):
#     """
#     Endpoint for initial system setup: creates the Organization, 
#     OrgSettings, and the first Super Admin user.
#     """
#     serializer_class = OrganizationSerializer
#     permission_classes = [AllowAny]
    
#     def create(self, request, *args, **kwargs):
#         # We need a custom serializer validation here to handle the nested data
#         # For simplicity, we assume the incoming data includes:
#         # { "name": "Org Name", "admin_data": { "email": "...", "password": "..." } }
        
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         with transaction.atomic():
#             # 1. Create Organization
#             org_data = serializer.validated_data
#             org_name = org_data.pop('name')
#             admin_data = org_data.pop('admin_data')
            
#             organization = Organization.objects.create(name=org_name)
            
#             # 2. Create Default OrgSettings (linked to the new Organization)
#             OrgSettings.objects.create(organization=organization, fine_rate=0.50)
            
#             # 3. Create the initial Organization Admin User
#             admin_user = User.objects.create_user(
#                 email=admin_data['email'],
#                 password=admin_data['password'],
#                 first_name=admin_data.get('first_name', 'Org'),
#                 last_name=admin_data.get('last_name', 'Admin'),
#                 role=User.ROLE_ADMIN, # Set as Organization Admin
#                 organization=organization
#             )
            
#         headers = self.get_success_headers(serializer.data)
#         return Response({
#             "message": "Organization and initial Admin user successfully created.",
#             "organization_id": organization.pk,
#             "admin_email": admin_user.email
#         }, status=status.HTTP_201_CREATED, headers=headers)
# class InitialSetupView(generics.CreateAPIView):
#     """
#     Endpoint for initial system setup: creates the Organization, 
#     OrgSettings, and the first Super Admin user.
#     """
#     serializer_class = OrganizationSerializer
#     permission_classes = [AllowAny]
    
#     def create(self, request, *args, **kwargs):
#         # We need a custom serializer validation here to handle the nested data
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         with transaction.atomic():
#             org_data = serializer.validated_data
            
#             # 1. Extract and pop the nested admin data
#             # This is the only field that doesn't map to Organization model fields, 
#             # so we pop it before using the rest of org_data for Organization creation.
#             admin_data = org_data.pop('admin_data')
            
#             # 2. Get the organization name separately (it's the only remaining key)
#             org_name = org_data['name'] # Access 'name' directly from the validated data

#             # 3. Create Organization
#             organization = Organization.objects.create(name=org_name)
            
#             # 4. Create Default OrgSettings (linked to the new Organization)
#             # FIX: Used 'fine_per_day' to match the OrgSettings model, 
#             # instead of the incorrect 'fine_rate'
#             OrgSettings.objects.create(organization=organization, fine_per_day=0.50)
            
#             # 5. Create the initial Organization Admin User
#             # NOTE: Assuming User.ROLE_ADMIN is defined in your User model
#             admin_user = User.objects.create_user(
#                 email=admin_data['email'],
#                 password=admin_data['password'],
#                 first_name=admin_data.get('first_name', 'Org'),
#                 last_name=admin_data.get('last_name', 'Admin'),
#                 role=User.ROLE_ADMIN, # Set as Organization Admin
#                 organization=organization
#             )
            
#         # headers = self.get_success_headers(serializer.data)
#         return Response({
#             "message": "Organization and initial Admin user successfully created.",
#             "organization_id": organization.pk,
#             "admin_email": admin_user.email
#         }, status=status.HTTP_201_CREATED)


class InitialSetupView(generics.CreateAPIView):
    """
    Endpoint for initial system setup: creates the Organization,
    OrgSettings, and the first Organization Admin user.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Extract admin data
            admin_data = serializer.validated_data.pop('admin_data')
            org_name = serializer.validated_data['name']

            # Generate a unique string ID for the organization
            org_id = f"ORG-{uuid.uuid4().hex[:6].upper()}"  # e.g., ORG-1A2B3C

            # Create Organization with string PK
            organization = Organization.objects.create(
                id=org_id,
                name=org_name
            )

            # Create default OrgSettings
            OrgSettings.objects.create(
                organization=organization,
                fine_per_day=0.50
            )

            # Create Organization Admin user
            admin_user = User.objects.create_user(
                email=admin_data['email'],
                password=admin_data['password'],
                first_name=admin_data.get('first_name', 'Org'),
                last_name=admin_data.get('last_name', 'Admin'),
                role=User.ROLE_ADMIN,
                organization=organization
            )

        # Serialize the saved organization
        org_serializer = OrganizationSerializer(organization)

        return Response({
            "message": "Organization and initial Admin user successfully created.",
            "organization": org_serializer.data,
            "admin_email": admin_user.email
        }, status=status.HTTP_201_CREATED)
# =========================================================================
# B. AUTHENTICATED API VIEWSETS
# =========================================================================

# # 1. Organization ViewSet (Super Admin Only - Refactored to Generics)
# class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
#     """
#     Allows listing and retrieving all organizations (tenants). 
#     Used by Super Admins only.
#     """
#     queryset = Organization.objects.all().order_by('name')
#     serializer_class = OrganizationSerializer
#     permission_classes = [IsAuthenticated] # Will be restricted to Super Admin later


# # 2. OrgSettings ViewSet (Tenant Admin Only - Generics Already Used)
# class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
#     """
#     Allows Org Admins to view and update their organization's settings.
#     """
#     serializer_class = OrgSettingsSerializer
#     queryset = OrgSettings.objects.all()
#     permission_classes = [IsAuthenticated]

#     def perform_update(self, serializer):
#         super().perform_update(serializer)


# # 3. User ViewSet (Tenant Admin / Employee - Full ModelViewSet)
# class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     serializer_class = UserSerializer
#     queryset = User.objects.all().order_by('last_name')
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return super().get_queryset()


# # 4. Department ViewSet (Tenant Admin Only - Full ModelViewSet)
# class DepartmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     serializer_class = DepartmentSerializer
#     queryset = Department.objects.all().order_by('name')
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         super().perform_create(serializer)


# # 5. AssetCategory ViewSet (Tenant Admin Only - Full ModelViewSet)
# class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     serializer_class = AssetCategorySerializer
#     queryset = AssetCategory.objects.all().order_by('name')
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         super().perform_create(serializer)


# # 6. Asset ViewSet (Tenant Admin Only - Full ModelViewSet)
# class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     serializer_class = AssetSerializer
#     queryset = Asset.objects.all().order_by('asset_tag')
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         super().perform_create(serializer)


# # 7. Assignment ViewSet (Core Logic - Full ModelViewSet)
# class AssignmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     serializer_class = AssignmentSerializer
#     queryset = Assignment.objects.all().order_by('-assigned_date')
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return super().get_queryset()

#     def perform_create(self, serializer):
#         super().perform_create(serializer)


#     @action(detail=True, methods=['post'], url_path='return-asset')
#     def return_asset(self, request, pk=None):
#         try:
#             assignment = self.get_object()
#         except Assignment.DoesNotExist:
#             return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

#         if assignment.status != 'Active' and assignment.status != 'Overdue':
#             return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)
        
#         assignment.status = 'Returned'
#         assignment.returned_date = timezone.now().date() 
#         assignment.save_final_fine()
#         assignment.save()
        
#         asset = assignment.asset
#         asset.status = 'Available'
#         asset.save() 

#         serializer = self.get_serializer(assignment)
#         return Response(serializer.data, status=status.HTTP_200_OK)


# # 8. Assignment History ViewSet (Read Only - ReadOnlyModelViewSet)
# class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
#     serializer_class = AssignmentHistorySerializer
#     queryset = AssignmentHistory.objects.all().order_by('-timestamp')
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return super().get_queryset()
    


# class OrganizationTokenObtainPairView(TokenObtainPairView):
#     serializer_class = OrganizationTokenObtainPairSerializer



class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Refactored to use generics. Allows listing and retrieving all organizations 
    (tenants). Only accessible by Super Admins.
    Does NOT use the MultiTenantMixin as it needs to view all organizations.
    We explicitly remove Create/Update/Destroy actions.
    """
    queryset = Organization.objects.all().order_by('name')
    serializer_class = OrganizationSerializer
    # NOTE: Permissions (e.g., IsSuperAdmin) must be added here to secure access.
    permission_classes = [IsAuthenticated] # Temporarily require authentication

# =========================================================================
# 2. OrgSettings ViewSet (Tenant Admin Only - Generics Already Used)
# =========================================================================

class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """
    Allows Org Admins to view and update their organization's settings 
    (e.g., fine rate). Already uses generics for explicit control over methods.
    """
    serializer_class = OrgSettingsSerializer
    queryset = OrgSettings.objects.all()
    permission_classes = [IsAuthenticated] # Temporarily require authentication
    
    def perform_update(self, serializer):
        """Standard update operation."""
        # Note: We rely on the MultiTenantMixin's get_queryset to ensure only the
        # current organization's settings are retrieved/updated.
        serializer.save()


# =========================================================================
# 3. User ViewSet (Tenant Admin / Employee - Full ModelViewSet)
# =========================================================================

class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """
    Kept as ModelViewSet as it requires full CRUD operations for Admins.
    The Mixin handles the organization filtering automatically.
    """
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('last_name')
    # --- CRITICAL CHANGE: Apply the custom permission ---
    permission_classes = [UserAccessPermission]
    # ----------------------------------------------------

    def get_queryset(self):
        """
        Applies multi-tenancy filter via the Mixin.
        """
        return super().get_queryset()


# =========================================================================
# 4. Department ViewSet (Tenant Admin Only - Full ModelViewSet)
# =========================================================================

class DepartmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Kept as ModelViewSet for full CRUD by Admins."""
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all().order_by('name')
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Injects organization on creation via the Mixin."""
        super().perform_create(serializer)


# =========================================================================
# 5. AssetCategory ViewSet (Tenant Admin Only - Full ModelViewSet)
# =========================================================================

class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Kept as ModelViewSet for full CRUD by Admins."""
    serializer_class = AssetCategorySerializer
    queryset = AssetCategory.objects.all().order_by('name')
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Injects organization on creation via the Mixin."""
        super().perform_create(serializer)


# =========================================================================
# 6. Asset ViewSet (Tenant Admin Only - Full ModelViewSet)
# =========================================================================

class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Kept as ModelViewSet for full CRUD by Admins."""
    serializer_class = AssetSerializer
    queryset = Asset.objects.all().order_by('asset_tag')
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Injects current user and organization on creation via the Mixin."""
        super().perform_create(serializer)


# =========================================================================
# 7. Assignment ViewSet (Core Logic - Full ModelViewSet)
# =========================================================================

class AssignmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """
    Kept as ModelViewSet for full CRUD/Actions (Admin).
    Manages asset assignments. Includes the critical asset return action.
    """
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all().order_by('-assigned_date')
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Applies multi-tenancy filter via the Mixin.
        """
        return super().get_queryset()

    def perform_create(self, serializer):
        """Injects assigned_by_user and organization on creation via the Mixin."""
        super().perform_create(serializer)


    @action(detail=True, methods=['post'], url_path='return-asset')
    def return_asset(self, request, pk=None):
        """
        Custom action to handle asset return: 
        1. Updates assignment status and returned_date.
        2. Calculates and saves the final fine.
        3. Updates the asset status to 'Available'.
        """
        try:
            assignment = self.get_object()
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        if assignment.status != 'Active' and assignment.status != 'Overdue':
            return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Update status and return date
        assignment.status = 'Returned'
        assignment.returned_date = timezone.now().date() 

        # 2. Calculate and set final fine using the model method
        assignment.save_final_fine()

        # 3. Save the assignment object (updates status and fine_amount)
        assignment.save()
        
        # 4. Update the Asset status
        asset = assignment.asset
        asset.status = 'Available'
        asset.save() # NOTE: Assumes Asset model is available for save (imported at top)

        # Return the updated object
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================================================================
# 8. Assignment History ViewSet (Read Only - Refactored to ReadOnlyModelViewSet)
# =========================================================================

class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
    """
    Refactored to use ReadOnlyModelViewSet, which inherits ListModelMixin 
    and RetrieveModelMixin only. 
    Provides a read-only system log of assignment actions.
    """
    serializer_class = AssignmentHistorySerializer
    queryset = AssignmentHistory.objects.all().order_by('-timestamp')
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Applies multi-tenancy filter via the Mixin.
        """
        return super().get_queryset()