# # # from django.shortcuts import render

# # from rest_framework import viewsets, mixins, status
# # from rest_framework.decorators import action
# # from rest_framework.response import Response
# # from django.utils import timezone
# # from finalproject.multi_tenant_mixin import MultiTenantMixin 
# # from rest_framework.permissions import IsAuthenticated

# # # Import all Models and Serializers from their respective apps
# # from organizations.models import Organization
# # from organizations.serializers import OrganizationSerializer

# # from org_settings.models import OrgSettings
# # from org_settings.serializers import OrgSettingsSerializer

# # from users.models import User
# # from users.serializers import UserSerializer

# # from departments.models import Department
# # from departments.serializers import DepartmentSerializer

# # from asset_categories.models import AssetCategory
# # from asset_categories.serializers import AssetCategorySerializer

# # from assets.models import Asset
# # from assets.serializers import AssetSerializer

# # from assignments.models import Assignment
# # from assignments.serializers import AssignmentSerializer

# # from assignment_history.models import AssignmentHistory
# # from assignment_history.serializers import AssignmentHistorySerializer


# # # =========================================================================
# # # 1. Organization ViewSet (Super Admin Only - No Multi-Tenancy Filtering)
# # # =========================================================================

# # class OrganizationViewSet(viewsets.ModelViewSet):
# #     """
# #     Lists all tenants. Only accessible by Super Admins.
# #     Does NOT use the MultiTenantMixin as it needs to view all organizations.
# #     """
# #     queryset = Organization.objects.all().order_by('name')
# #     serializer_class = OrganizationSerializer
# #     # NOTE: Permissions (e.g., IsSuperAdmin) must be added here to secure access.


# # # =========================================================================
# # # 2. OrgSettings ViewSet (Tenant Admin Only - Use Mixin)
# # # =========================================================================

# # class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
# #     """
# #     Allows Org Admins to view and update their organization's settings 
# #     (e.g., fine rate).
# #     """
# #     serializer_class = OrgSettingsSerializer
# #     queryset = OrgSettings.objects.all()
    
# #     def perform_update(self, serializer):
# #         """Standard update operation."""
# #         serializer.save()


# # # =========================================================================
# # # 3. User ViewSet (Tenant Admin / Employee - Use Mixin)
# # # =========================================================================

# # class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     """
# #     Manages users within a specific organization (tenant).
# #     The Mixin handles the organization filtering automatically.
# #     """
# #     serializer_class = UserSerializer
# #     queryset = User.objects.all().order_by('last_name')

# #     def get_queryset(self):
# #         """
# #         Applies multi-tenancy filter via the Mixin.
# #         (Further role-based filtering will be added via permissions).
# #         """
# #         return super().get_queryset()


# # # =========================================================================
# # # 4. Department ViewSet (Tenant Admin Only - Use Mixin)
# # # =========================================================================

# # class DepartmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     """Allows Admins to manage departments for their organization."""
# #     serializer_class = DepartmentSerializer
# #     queryset = Department.objects.all().order_by('name')

# #     def perform_create(self, serializer):
# #         """Injects organization on creation via the Mixin."""
# #         super().perform_create(serializer)


# # # =========================================================================
# # # 5. AssetCategory ViewSet (Tenant Admin Only - Use Mixin)
# # # =========================================================================

# # class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     """Allows Admins to manage asset categories for their organization."""
# #     serializer_class = AssetCategorySerializer
# #     queryset = AssetCategory.objects.all().order_by('name')

# #     def perform_create(self, serializer):
# #         """Injects organization on creation via the Mixin."""
# #         super().perform_create(serializer)


# # # =========================================================================
# # # 6. Asset ViewSet (Tenant Admin Only - Use Mixin)
# # # =========================================================================

# # class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     """Allows Admins to manage assets for their organization."""
# #     serializer_class = AssetSerializer
# #     queryset = Asset.objects.all().order_by('asset_tag')

# #     def perform_create(self, serializer):
# #         """Injects current user and organization on creation via the Mixin."""
# #         super().perform_create(serializer)


# # # =========================================================================
# # # 7. Assignment ViewSet (Core Logic - Use Mixin)
# # # =========================================================================

# # class AssignmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     """
# #     Manages asset assignments. Includes the critical asset return action.
# #     """
# #     serializer_class = AssignmentSerializer
# #     queryset = Assignment.objects.all().order_by('-assigned_date')

# #     def get_queryset(self):
# #         """
# #         Applies multi-tenancy filter via the Mixin.
# #         (Role-based filtering for Employees will be added here later).
# #         """
# #         return super().get_queryset()

# #     def perform_create(self, serializer):
# #         """Injects assigned_by_user and organization on creation via the Mixin."""
# #         super().perform_create(serializer)


# #     @action(detail=True, methods=['post'], url_path='return-asset')
# #     def return_asset(self, request, pk=None):
# #         """
# #         Custom action to handle asset return: 
# #         1. Updates assignment status and returned_date.
# #         2. Calculates and saves the final fine.
# #         3. Updates the asset status to 'Available'.
# #         """
# #         try:
# #             assignment = self.get_object()
# #         except Assignment.DoesNotExist:
# #             return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

# #         if assignment.status != 'Active' and assignment.status != 'Overdue':
# #             return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)
        
# #         # 1. Update status and return date
# #         assignment.status = 'Returned'
# #         assignment.returned_date = timezone.now().date() 

# #         # 2. Calculate and set final fine using the model method
# #         assignment.save_final_fine()

# #         # 3. Save the assignment object (updates status and fine_amount)
# #         assignment.save()
        
# #         # 4. Update the Asset status
# #         asset = assignment.asset
# #         asset.status = 'Available'
# #         asset.save() # NOTE: Assumes Asset model is available for save (imported at top)

# #         # Return the updated object
# #         serializer = self.get_serializer(assignment)
# #         return Response(serializer.data, status=status.HTTP_200_OK)


# # # =========================================================================
# # # 8. Assignment History ViewSet (Read Only - Use Mixin)
# # # =========================================================================

# # class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
# #     """
# #     Provides a read-only system log of assignment actions.
# #     Records are created by the system/Assignment ViewSet, not directly by users.
# #     """
# #     serializer_class = AssignmentHistorySerializer
# #     queryset = AssignmentHistory.objects.all().order_by('-timestamp')

# #     def get_queryset(self):
# #         """
# #         Applies multi-tenancy filter via the Mixin.
# #         (Role-based filtering for Employees will be added here later).
# #         """
# #         return super().get_queryset()
# # # Create your views here.
# import uuid
# from rest_framework import generics, status
# from rest_framework.response import Response
# from rest_framework.permissions import AllowAny
# from organizations.serializers import OrganizationSerializer
# from organizations.models import Organization
# from org_settings.models import OrgSettings
# from users.models import User # Assuming User model is imported here
# from django.db import transaction
# from rest_framework import viewsets, mixins, status, generics
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.utils import timezone
# # FIX 1: Import the mixin directly from the project root
# from multi_tenant_mixin import MultiTenantMixin 
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from django.db import transaction

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

# from rest_framework_simplejwt.views import TokenObtainPairView
# from api.authentication_views import OrganizationTokenObtainPairSerializer


# from api.authentication_views import OrganizationTokenObtainPairSerializer, OrganizationTokenObtainPairView
# from api.permissions import UserAccessPermission
# # =========================================================================
# # A. PUBLIC SETUP ENDPOINT (Replaces 'initial_setup' app)
# # =========================================================================

# # class InitialSetupView(generics.CreateAPIView):
# #     """
# #     Endpoint for initial system setup: creates the Organization, 
# #     OrgSettings, and the first Super Admin user.
# #     """
# #     serializer_class = OrganizationSerializer
# #     permission_classes = [AllowAny]
    
# #     def create(self, request, *args, **kwargs):
# #         # We need a custom serializer validation here to handle the nested data
# #         # For simplicity, we assume the incoming data includes:
# #         # { "name": "Org Name", "admin_data": { "email": "...", "password": "..." } }
        
# #         serializer = self.get_serializer(data=request.data)
# #         serializer.is_valid(raise_exception=True)

# #         with transaction.atomic():
# #             # 1. Create Organization
# #             org_data = serializer.validated_data
# #             org_name = org_data.pop('name')
# #             admin_data = org_data.pop('admin_data')
            
# #             organization = Organization.objects.create(name=org_name)
            
# #             # 2. Create Default OrgSettings (linked to the new Organization)
# #             OrgSettings.objects.create(organization=organization, fine_rate=0.50)
            
# #             # 3. Create the initial Organization Admin User
# #             admin_user = User.objects.create_user(
# #                 email=admin_data['email'],
# #                 password=admin_data['password'],
# #                 first_name=admin_data.get('first_name', 'Org'),
# #                 last_name=admin_data.get('last_name', 'Admin'),
# #                 role=User.ROLE_ADMIN, # Set as Organization Admin
# #                 organization=organization
# #             )
            
# #         headers = self.get_success_headers(serializer.data)
# #         return Response({
# #             "message": "Organization and initial Admin user successfully created.",
# #             "organization_id": organization.pk,
# #             "admin_email": admin_user.email
# #         }, status=status.HTTP_201_CREATED, headers=headers)
# # class InitialSetupView(generics.CreateAPIView):
# #     """
# #     Endpoint for initial system setup: creates the Organization, 
# #     OrgSettings, and the first Super Admin user.
# #     """
# #     serializer_class = OrganizationSerializer
# #     permission_classes = [AllowAny]
    
# #     def create(self, request, *args, **kwargs):
# #         # We need a custom serializer validation here to handle the nested data
# #         serializer = self.get_serializer(data=request.data)
# #         serializer.is_valid(raise_exception=True)

# #         with transaction.atomic():
# #             org_data = serializer.validated_data
            
# #             # 1. Extract and pop the nested admin data
# #             # This is the only field that doesn't map to Organization model fields, 
# #             # so we pop it before using the rest of org_data for Organization creation.
# #             admin_data = org_data.pop('admin_data')
            
# #             # 2. Get the organization name separately (it's the only remaining key)
# #             org_name = org_data['name'] # Access 'name' directly from the validated data

# #             # 3. Create Organization
# #             organization = Organization.objects.create(name=org_name)
            
# #             # 4. Create Default OrgSettings (linked to the new Organization)
# #             # FIX: Used 'fine_per_day' to match the OrgSettings model, 
# #             # instead of the incorrect 'fine_rate'
# #             OrgSettings.objects.create(organization=organization, fine_per_day=0.50)
            
# #             # 5. Create the initial Organization Admin User
# #             # NOTE: Assuming User.ROLE_ADMIN is defined in your User model
# #             admin_user = User.objects.create_user(
# #                 email=admin_data['email'],
# #                 password=admin_data['password'],
# #                 first_name=admin_data.get('first_name', 'Org'),
# #                 last_name=admin_data.get('last_name', 'Admin'),
# #                 role=User.ROLE_ADMIN, # Set as Organization Admin
# #                 organization=organization
# #             )
            
# #         # headers = self.get_success_headers(serializer.data)
# #         return Response({
# #             "message": "Organization and initial Admin user successfully created.",
# #             "organization_id": organization.pk,
# #             "admin_email": admin_user.email
# #         }, status=status.HTTP_201_CREATED)


# class InitialSetupView(generics.CreateAPIView):
#     """
#     Endpoint for initial system setup: creates the Organization,
#     OrgSettings, and the first Organization Admin user.
#     """
#     serializer_class = OrganizationSerializer
#     permission_classes = [AllowAny]

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         with transaction.atomic():
#             # Extract admin data
#             admin_data = serializer.validated_data.pop('admin_data')
#             org_name = serializer.validated_data['name']

#             # Generate a unique string ID for the organization
#             org_id = f"ORG-{uuid.uuid4().hex[:6].upper()}"  # e.g., ORG-1A2B3C

#             # Create Organization with string PK
#             organization = Organization.objects.create(
#                 id=org_id,
#                 name=org_name
#             )

#             # Create default OrgSettings
#             OrgSettings.objects.create(
#                 organization=organization,
#                 fine_per_day=0.50
#             )

#             # Create Organization Admin user
#             admin_user = User.objects.create_user(
#                 email=admin_data['email'],
#                 password=admin_data['password'],
#                 first_name=admin_data.get('first_name', 'Org'),
#                 last_name=admin_data.get('last_name', 'Admin'),
#                 role=User.ROLE_ADMIN,
#                 organization=organization
#             )

#         # Serialize the saved organization
#         org_serializer = OrganizationSerializer(organization)

#         return Response({
#             "message": "Organization and initial Admin user successfully created.",
#             "organization": org_serializer.data,
#             "admin_email": admin_user.email
#         }, status=status.HTTP_201_CREATED)
# # =========================================================================
# # B. AUTHENTICATED API VIEWSETS
# # =========================================================================

# # # 1. Organization ViewSet (Super Admin Only - Refactored to Generics)
# # class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
# #     """
# #     Allows listing and retrieving all organizations (tenants). 
# #     Used by Super Admins only.
# #     """
# #     queryset = Organization.objects.all().order_by('name')
# #     serializer_class = OrganizationSerializer
# #     permission_classes = [IsAuthenticated] # Will be restricted to Super Admin later


# # # 2. OrgSettings ViewSet (Tenant Admin Only - Generics Already Used)
# # class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
# #     """
# #     Allows Org Admins to view and update their organization's settings.
# #     """
# #     serializer_class = OrgSettingsSerializer
# #     queryset = OrgSettings.objects.all()
# #     permission_classes = [IsAuthenticated]

# #     def perform_update(self, serializer):
# #         super().perform_update(serializer)


# # # 3. User ViewSet (Tenant Admin / Employee - Full ModelViewSet)
# # class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     serializer_class = UserSerializer
# #     queryset = User.objects.all().order_by('last_name')
# #     permission_classes = [IsAuthenticated]

# #     def get_queryset(self):
# #         return super().get_queryset()


# # # 4. Department ViewSet (Tenant Admin Only - Full ModelViewSet)
# # class DepartmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     serializer_class = DepartmentSerializer
# #     queryset = Department.objects.all().order_by('name')
# #     permission_classes = [IsAuthenticated]

# #     def perform_create(self, serializer):
# #         super().perform_create(serializer)


# # # 5. AssetCategory ViewSet (Tenant Admin Only - Full ModelViewSet)
# # class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     serializer_class = AssetCategorySerializer
# #     queryset = AssetCategory.objects.all().order_by('name')
# #     permission_classes = [IsAuthenticated]

# #     def perform_create(self, serializer):
# #         super().perform_create(serializer)


# # # 6. Asset ViewSet (Tenant Admin Only - Full ModelViewSet)
# # class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     serializer_class = AssetSerializer
# #     queryset = Asset.objects.all().order_by('asset_tag')
# #     permission_classes = [IsAuthenticated]

# #     def perform_create(self, serializer):
# #         super().perform_create(serializer)


# # # 7. Assignment ViewSet (Core Logic - Full ModelViewSet)
# # class AssignmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
# #     serializer_class = AssignmentSerializer
# #     queryset = Assignment.objects.all().order_by('-assigned_date')
# #     permission_classes = [IsAuthenticated]

# #     def get_queryset(self):
# #         return super().get_queryset()

# #     def perform_create(self, serializer):
# #         super().perform_create(serializer)


# #     @action(detail=True, methods=['post'], url_path='return-asset')
# #     def return_asset(self, request, pk=None):
# #         try:
# #             assignment = self.get_object()
# #         except Assignment.DoesNotExist:
# #             return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

# #         if assignment.status != 'Active' and assignment.status != 'Overdue':
# #             return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)
        
# #         assignment.status = 'Returned'
# #         assignment.returned_date = timezone.now().date() 
# #         assignment.save_final_fine()
# #         assignment.save()
        
# #         asset = assignment.asset
# #         asset.status = 'Available'
# #         asset.save() 

# #         serializer = self.get_serializer(assignment)
# #         return Response(serializer.data, status=status.HTTP_200_OK)


# # # 8. Assignment History ViewSet (Read Only - ReadOnlyModelViewSet)
# # class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
# #     serializer_class = AssignmentHistorySerializer
# #     queryset = AssignmentHistory.objects.all().order_by('-timestamp')
# #     permission_classes = [IsAuthenticated]

# #     def get_queryset(self):
# #         return super().get_queryset()
    


# # class OrganizationTokenObtainPairView(TokenObtainPairView):
# #     serializer_class = OrganizationTokenObtainPairSerializer



# class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
#     """
#     Refactored to use generics. Allows listing and retrieving all organizations 
#     (tenants). Only accessible by Super Admins.
#     Does NOT use the MultiTenantMixin as it needs to view all organizations.
#     We explicitly remove Create/Update/Destroy actions.
#     """
#     queryset = Organization.objects.all().order_by('name')
#     serializer_class = OrganizationSerializer
#     # NOTE: Permissions (e.g., IsSuperAdmin) must be added here to secure access.
#     permission_classes = [IsAuthenticated] # Temporarily require authentication

# # =========================================================================
# # 2. OrgSettings ViewSet (Tenant Admin Only - Generics Already Used)
# # =========================================================================

# class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
#     """
#     Allows Org Admins to view and update their organization's settings 
#     (e.g., fine rate). Already uses generics for explicit control over methods.
#     """
#     serializer_class = OrgSettingsSerializer
#     queryset = OrgSettings.objects.all()
#     permission_classes = [IsAuthenticated] # Temporarily require authentication
    
#     def perform_update(self, serializer):
#         """Standard update operation."""
#         # Note: We rely on the MultiTenantMixin's get_queryset to ensure only the
#         # current organization's settings are retrieved/updated.
#         serializer.save()


# # =========================================================================
# # 3. User ViewSet (Tenant Admin / Employee - Full ModelViewSet)
# # =========================================================================

# class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """
#     Kept as ModelViewSet as it requires full CRUD operations for Admins.
#     The Mixin handles the organization filtering automatically.
#     """
#     serializer_class = UserSerializer
#     queryset = User.objects.all().order_by('last_name')
#     # --- CRITICAL CHANGE: Apply the custom permission ---
#     permission_classes = [UserAccessPermission]
#     # ----------------------------------------------------

#     def get_queryset(self):
#         """
#         Applies multi-tenancy filter via the Mixin.
#         """
#         return super().get_queryset()


# # =========================================================================
# # 4. Department ViewSet (Tenant Admin Only - Full ModelViewSet)
# # =========================================================================

# class DepartmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """Kept as ModelViewSet for full CRUD by Admins."""
#     serializer_class = DepartmentSerializer
#     queryset = Department.objects.all().order_by('name')
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         """Injects organization on creation via the Mixin."""
#         super().perform_create(serializer)


# # =========================================================================
# # 5. AssetCategory ViewSet (Tenant Admin Only - Full ModelViewSet)
# # =========================================================================

# class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """Kept as ModelViewSet for full CRUD by Admins."""
#     serializer_class = AssetCategorySerializer
#     queryset = AssetCategory.objects.all().order_by('name')
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         """Injects organization on creation via the Mixin."""
#         super().perform_create(serializer)


# # =========================================================================
# # 6. Asset ViewSet (Tenant Admin Only - Full ModelViewSet)
# # =========================================================================

# class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """Kept as ModelViewSet for full CRUD by Admins."""
#     serializer_class = AssetSerializer
#     queryset = Asset.objects.all().order_by('asset_tag')
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         """Injects current user and organization on creation via the Mixin."""
#         super().perform_create(serializer)


# # =========================================================================
# # 7. Assignment ViewSet (Core Logic - Full ModelViewSet)
# # =========================================================================

# class AssignmentViewSet(MultiTenantMixin, viewsets.ModelViewSet):
#     """
#     Kept as ModelViewSet for full CRUD/Actions (Admin).
#     Manages asset assignments. Includes the critical asset return action.
#     """
#     serializer_class = AssignmentSerializer
#     queryset = Assignment.objects.all().order_by('-assigned_date')
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         """
#         Applies multi-tenancy filter via the Mixin.
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
# # 8. Assignment History ViewSet (Read Only - Refactored to ReadOnlyModelViewSet)
# # =========================================================================

# class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
#     """
#     Refactored to use ReadOnlyModelViewSet, which inherits ListModelMixin 
#     and RetrieveModelMixin only. 
#     Provides a read-only system log of assignment actions.
#     """
#     serializer_class = AssignmentHistorySerializer
#     queryset = AssignmentHistory.objects.all().order_by('-timestamp')
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         """
#         Applies multi-tenancy filter via the Mixin.
#         """
#         return super().get_queryset()
from decimal import Decimal
import uuid
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets, mixins, status, generics
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
# Importing for dynamic fine rate lookup
from django.db.models import F 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count

# FIX 1: Import the mixin directly from the project root
from multi_tenant_mixin import MultiTenantMixin 

# FIX 2: Import custom permissions (Assuming they are defined in api.permissions)
from api.permissions import UserAccessPermission, OrgAccessPermission, AssignmentPermission 


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

# Assuming these are defined elsewhere
from api.authentication_views import OrganizationTokenObtainPairSerializer, OrganizationTokenObtainPairView


# =========================================================================
# A. PUBLIC SETUP ENDPOINT
# =========================================================================

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

            # Create Organization Admin user (OrgAdmin)
            admin_user = User.objects.create_user(
                email=admin_data['email'],
                password=admin_data['password'],
                first_name=admin_data.get('first_name', 'Org'),
                last_name=admin_data.get('last_name', 'Admin'),
                role=User.ROLE_ADMIN, # Assuming this is 'Admin' or 'OrgAdmin'
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

# 1. Organization ViewSet (Super Admin Only)
class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Lists and retrieves all organizations (tenants). Only accessible by Super Admins.
    """
    queryset = Organization.objects.all().order_by('name')
    serializer_class = OrganizationSerializer
    # NOTE: Assuming a 'SuperAdminOnly' permission exists/will be implemented 
    # that checks request.user.is_superuser.
    permission_classes = [IsAuthenticated] 

# 2. OrgSettings ViewSet (Tenant Admin Only)
class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """
    Allows Org Admins to view and update their organization's settings.
    Requires OrgAccessPermission to ensure only Admins can manage.
    """
    serializer_class = OrgSettingsSerializer
    queryset = OrgSettings.objects.all()
    # --- CRITICAL CHANGE: Only Admins manage settings ---
    permission_classes = [OrgAccessPermission]
    
    def perform_update(self, serializer):
        serializer.save()


# 3. User ViewSet (Tenant Admin / Employee)
class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """
    Manages users. Permissions are controlled by UserAccessPermission 
    (Admins manage all, Employees manage self).
    """
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('last_name')
    # --- CRITICAL CHANGE: Apply the custom permission ---
    permission_classes = [UserAccessPermission]
    # ----------------------------------------------------

    def get_queryset(self):
        return super().get_queryset()


# 4. Department ViewSet (Tenant Admin Only)
class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Allows Admins to manage departments. Requires OrgAccessPermission.
    Data is scoped by organization (multi-tenancy).
    """
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all().order_by('name')
    permission_classes = [OrgAccessPermission]

    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            # Superusers see all departments
            return super().get_queryset()

        if user.is_authenticated and user.organization:
            # All authenticated users (Admin/Employee) can view departments 
            # within their organization, but only Admins can list them due to 
            # the OrgAccessPermission applied at the class level (has_permission).
            return super().get_queryset().filter(organization=user.organization).order_by('name')

        return self.queryset.none()

    def perform_create(self, serializer):
        """Set organization automatically on creation."""
        if self.request.user.is_authenticated and self.request.user.organization:
            # The permission class ensures only Admins/Superusers reach here.
            serializer.save(organization=self.request.user.organization)
        else:
            # Defensive fallback
            super().perform_create(serializer)


# 5. AssetCategory ViewSet (Tenant Admin Only)
class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Allows Admins to manage asset categories. Requires OrgAccessPermission."""
    serializer_class = AssetCategorySerializer
    queryset = AssetCategory.objects.all().order_by('name')
    # --- CRITICAL CHANGE: Only Admins manage Categories ---
    permission_classes = [OrgAccessPermission]

    def perform_create(self, serializer):
        super().perform_create(serializer)


# 6. Asset ViewSet (Tenant Admin Only)
class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Allows Admins to manage assets. Requires OrgAccessPermission."""
    serializer_class = AssetSerializer
    queryset = Asset.objects.all().order_by('asset_tag')
    # --- CRITICAL CHANGE: Only Admins manage Assets ---
    permission_classes = [OrgAccessPermission]

    def perform_create(self, serializer):
        super().perform_create(serializer)


# 7. Assignment ViewSet (Core Logic - Multi-Role Access)
# from rest_framework import viewsets, permissions, serializers, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.utils import timezone
# from decimal import Decimal

# Import your custom models and role constants
# from .models import Assignment
# from organizations.models import OrgSettings # Need this for fine calculation
# from users.models import ROLE_EMPLOYEE, ROLE_ADMIN, User # Need these for role checks and filtering

# MOCKING Imports for demonstration based on previous conversation
# Replace these with your actual imports:
ROLE_EMPLOYEE = 'Employee'
ROLE_ADMIN = 'Admin' 
# Assuming OrgSettings is available to calculate the fine

class AssignmentViewSet(viewsets.ModelViewSet):
    """
    Manages asset assignments.
    Enforces multi-tenancy: Employees see only their own, Admins see organization's.
    """
    serializer_class = AssignmentSerializer
    # Order by creation date to show recent assignments first
    queryset = Assignment.objects.all().order_by('-assigned_date')
    permission_classes = [AssignmentPermission] 

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return super().get_queryset()

        if user.is_authenticated and user.organization:
            # 1. Start by filtering by the user's organization (Tenant Scoping)
            queryset = super().get_queryset().filter(organization=user.organization)
            
            if user.role == ROLE_EMPLOYEE:
                # 2. Employees are limited to viewing only their own assignments
                return queryset.filter(employee=user)
            
            # 3. Admins see all assignments within their tenant
            return queryset

        # Unauthenticated or users without an organization see nothing
        return self.queryset.none()

    def perform_create(self, serializer):
        """Assign asset and link to organization/admin."""
        if self.request.user.is_authenticated:
            # Ensures the user's organization and assigned_by_user are set
            assignment = serializer.save(
                assigned_by_user=self.request.user,
                organization=self.request.user.organization
            )
            # Ensures model-level clean() validations are enforced after saving related objects
            assignment.full_clean()
            assignment.save()
        else:
            # Should be blocked by permissions, but included defensively
            super().perform_create(serializer)

    @action(detail=True, methods=['post'], url_path='return-asset')
    def return_asset(self, request, pk=None):
        """
        Handle asset return:
        1. Update assignment status to 'Returned'.
        2. Set returned_date.
        3. Calculate fine if overdue using OrgSettings.fine_per_day.
        4. Set asset status to 'Available'.
        """
        try:
            assignment = self.get_object() # Multi-tenancy filtered via get_queryset
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        if assignment.status not in ['Active', 'Overdue']:
            return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)

        # Update status and returned date
        assignment.status = 'Returned'
        assignment.returned_date = timezone.now().date()

        # Calculate fine
        fine_amount = Decimal("0.00")
        if assignment.due_date and assignment.returned_date > assignment.due_date:
            days_late = (assignment.returned_date - assignment.due_date).days
            
            fine_per_day = Decimal("0.00")
            if days_late > 0:
                try:
                    # --- DYNAMIC FINE CALCULATION: Fetching fine rate from OrgSettings ---
                    # Use the organization linked to the assignment to fetch its settings
                    org_settings = OrgSettings.objects.get(organization=assignment.organization)
                    fine_per_day = org_settings.fine_per_day
                    # --- END DYNAMIC FINE CALCULATION ---
                except OrgSettings.DoesNotExist:
                    # If settings don't exist, fine_per_day remains Decimal("0.00")
                    pass
                
                # Calculate fine only if a rate exists and the assignment is late
                if fine_per_day and fine_per_day > Decimal("0.00"):
                    fine_amount = Decimal(days_late) * fine_per_day

        assignment.fine_amount = fine_amount
        assignment.save()

        # Update asset status
        asset = assignment.asset
        asset.status = 'Available'
        asset.save()

        # Reload the assignment instance and serialize
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)

# 8. Assignment History ViewSet (Read Only - Multi-Role Access)
class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
    """
    Provides a read-only system log of assignment actions.
    Admins see all history; Employees see only their own history.
    """
    serializer_class = AssignmentHistorySerializer
    queryset = AssignmentHistory.objects.all().order_by('-timestamp')
    # --- CRITICAL CHANGE: Only Admins should see ALL history. Employees see partial.
    permission_classes = [OrgAccessPermission] # Default to Admin-only for full list/retrieve

    def get_queryset(self):
        user = self.request.user
        
        # Superuser sees all
        if user.is_superuser:
            return super().get_queryset()
            
        # Get the organization-filtered queryset first (standard MultiTenantMixin behavior)
        queryset = super().get_queryset()

        # If the user is an Employee, restrict to their relevant history
        if user.is_authenticated and user.role == 'Employee':
            # Assumes AssignmentHistory is linked to a user (e.g., via 'user' or 'employee' field)
            # If AssignmentHistory tracks the assignment ID, we can filter based on the employee in the Assignment model.
            # Assuming AssignmentHistory has a 'user' or 'employee' field for simplicity:
            # If not, you may need a custom model method on AssignmentHistory to check the relationship.
            # For now, let's assume it has an 'employee' field.
            return queryset.filter(employee=user)
        
        # Admins will see the full organization-filtered queryset
        return queryset
    
# Authentication views (keeping them as provided)
class OrganizationTokenObtainPairView(OrganizationTokenObtainPairView):
    serializer_class = OrganizationTokenObtainPairSerializer
    
    
class OrganizationMetricsView(APIView):
    """
    API endpoint to retrieve key asset statistics for the logged-in user's organization.
    Requires the user to be authenticated and belong to an organization.
    """
    permission_classes = [IsAuthenticated] # Assuming you have a standard IsAuthenticated permission

    def get(self, request, *args, **kwargs):
        user = request.user

        # 1. Validation: Ensure user is linked to an organization
        if not user.is_authenticated or not user.organization:
            return Response(
                {"detail": "User must be authenticated and assigned to an organization."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        organization = user.organization
        
        # Start filtering the base queryset for the organization
        base_queryset = Asset.objects.filter(organization=organization)
        
        # --- A. Calculate Status Metrics (Available, Assigned, Maintenance, etc.) ---
        status_counts = base_queryset.values('status').annotate(count=Count('status')).order_by()
        
        # Convert the aggregated list to a more useful dictionary format
        status_metrics = {item['status']: item['count'] for item in status_counts}
        
        # --- B. Calculate Category Metrics (Laptops, Monitors, etc.) ---
        # Annotate by category name for better reporting
        category_counts = base_queryset.values('category__name').annotate(count=Count('category__name')).order_by()
        
        # Rename keys for clarity
        category_metrics = {item['category__name']: item['count'] for item in category_counts if item['category__name']}

        # --- C. Calculate High-Level Totals ---
        total_assets = base_queryset.count()
        
        # --- D. Calculate Overdue Assignments (Requires joining Assignment model) ---
        # Assuming you have an Assignment model imported
        try:
            from assignments.models import Assignment
            overdue_count = Assignment.objects.filter(
                organization=organization,
                status='Overdue'
            ).count()
        except Exception:
            # Handle case where Assignment model is not imported/available
            overdue_count = 0 
            
        # --- Final Response Structure ---
        response_data = {
            "organization_name": organization.name,
            "total_assets": total_assets,
            "metrics_by_status": status_metrics,
            "metrics_by_category": category_metrics,
            "overdue_assignments": overdue_count,
        }

        return Response(response_data, status=status.HTTP_200_OK)