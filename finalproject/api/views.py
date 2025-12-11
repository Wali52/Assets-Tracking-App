from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from users.serializers import ChangePasswordSerializer
from rest_framework.generics import GenericAPIView
from decimal import Decimal
import uuid
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import viewsets, mixins, status, generics
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import F 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from multi_tenant_mixin import MultiTenantMixin 
from api.permissions import UserAccessPermission, OrgAccessPermission, AssignmentPermission 

from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

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
from api.authentication_views import OrganizationTokenObtainPairSerializer, OrganizationTokenObtainPairView

ROLE_EMPLOYEE = User.ROLE_EMPLOYEE # Assuming constant is defined in models
ROLE_ADMIN = User.ROLE_ADMIN     # Assuming constant is defined in models

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
                role=ROLE_ADMIN, # Using the constant now
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
    # ... (No change needed here) ...
    queryset = Organization.objects.all().order_by('name')
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated] 

# 2. OrgSettings ViewSet (Tenant Admin Only)
class OrgSettingsViewSet(MultiTenantMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    # ... (No change needed here) ...
    serializer_class = OrgSettingsSerializer
    queryset = OrgSettings.objects.all()
    permission_classes = [OrgAccessPermission]
    
    def perform_update(self, serializer):
        serializer.save()


# 3. User ViewSet (Tenant Admin / Employee)
class UserViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    # ... (No change needed here) ...
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('last_name')
    permission_classes = [UserAccessPermission]
    
    def get_queryset(self):
        return super().get_queryset()


# 4. Department ViewSet (Tenant Admin Only)
class DepartmentViewSet(viewsets.ModelViewSet):
    # ... (No change needed here) ...
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all().order_by('name')
    permission_classes = [OrgAccessPermission]

    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return super().get_queryset()

        if user.is_authenticated and user.organization:
            return super().get_queryset().filter(organization=user.organization).order_by('name')

        return self.queryset.none()

    def perform_create(self, serializer):
        """Set organization automatically on creation."""
        if self.request.user.is_authenticated and self.request.user.organization:
            serializer.save(organization=self.request.user.organization)
        else:
            super().perform_create(serializer)


# 5. AssetCategory ViewSet (Tenant Admin Only)
class AssetCategoryViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Allows Admins to manage asset categories. Requires OrgAccessPermission."""
    serializer_class = AssetCategorySerializer
    queryset = AssetCategory.objects.all().order_by('name')
    permission_classes = [OrgAccessPermission]

    def perform_create(self, serializer):
        # ✅ FIX 1: Explicitly set organization on creation to solve the frontend issue.
        serializer.save(organization=self.request.user.organization)


# 6. Asset ViewSet (Tenant Admin Only)
class AssetViewSet(MultiTenantMixin, viewsets.ModelViewSet):
    """Allows Admins to manage assets. Requires OrgAccessPermission."""
    serializer_class = AssetSerializer
    queryset = Asset.objects.all().order_by('asset_tag')
    permission_classes = [OrgAccessPermission]

    def perform_create(self, serializer):
        # ✅ FIX 2: Explicitly set organization on creation.
        serializer.save(organization=self.request.user.organization)


# 7. Assignment ViewSet (Multi-Role)
class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all().order_by('-assigned_date')
    permission_classes = [AssignmentPermission] 


    def get_permissions(self):
        if self.action == 'upload-fine-proof':
            # Only authenticated employees can upload their own fine proof
            return [IsAuthenticated()]
        elif self.action in ['approve-fine-payment', 'deny-fine-payment']:
            # Only Admins (with org access) can approve/deny fine payments
            return [IsAuthenticated(), OrgAccessPermission()]
        # Default permission for other actions
        return [permission() for permission in self.permission_classes]
    
    
    def get_queryset(self):
        # ... (Your existing get_queryset logic) ...
        user = self.request.user

        if user.is_superuser:
            return super().get_queryset()

        if user.is_authenticated and user.organization:
            queryset = super().get_queryset().filter(organization=user.organization)
            
            if user.role == ROLE_EMPLOYEE:
                return queryset.filter(employee=user)
            
            return queryset

        return self.queryset.none()

    def perform_create(self, serializer):
        # ... (Your existing perform_create logic) ...
        if self.request.user.is_authenticated:
            assignment = serializer.save(
                assigned_by_user=self.request.user,
                organization=self.request.user.organization
            )
            assignment.full_clean()
            assignment.save()
        else:
            super().perform_create(serializer)
            
    @action(detail=True, methods=['post'], url_path='return-asset')
    def return_asset(self, request, pk=None):
        # ... (Your existing return_asset logic) ...
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        if assignment.status not in ['Active', 'Overdue']:
            return Response({"detail": f"Asset is already in '{assignment.status}' state."}, status=status.HTTP_400_BAD_REQUEST)

        assignment.status = 'Returned'
        assignment.returned_date = timezone.now().date()

        fine_amount = Decimal("0.00")
        if assignment.due_date and assignment.returned_date > assignment.due_date:
            days_late = (assignment.returned_date - assignment.due_date).days
            
            fine_per_day = Decimal("0.00")
            if days_late > 0:
                try:
                    # Assuming OrgSettings is imported and defined
                    org_settings = OrgSettings.objects.get(organization=assignment.organization) 
                    fine_per_day = org_settings.fine_per_day
                except OrgSettings.DoesNotExist:
                    pass
                
                if fine_per_day and fine_per_day > Decimal("0.00"):
                    fine_amount = Decimal(days_late) * fine_per_day

        assignment.fine_amount = fine_amount
        assignment.save()

        asset = assignment.asset
        asset.status = 'Available'
        asset.save()

        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🛑 NEW ACTION: Handles Admin approval of an employee's return request
    @action(detail=True, methods=['post'])
    def approve_return(self, request, pk=None):
        # ... (Your existing approve_return logic) ...
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Validation check: Must be in 'Requested Return' state
        if assignment.status != 'Requested Return':
            return Response(
                {"detail": f"Cannot approve return. Current status is '{assignment.status}'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # --- Start Transaction for Atomicity ---
        with transaction.atomic():
            # 1. Update Assignment Status
            assignment.status = 'Returned'
            assignment.returned_date = timezone.now().date()

            # 2. Fine calculation (Copying your existing logic)
            fine_amount = Decimal("0.00")
            # Determine fine amount
            if assignment.due_date and assignment.returned_date > assignment.due_date:
                days_late = (assignment.returned_date - assignment.due_date).days
                fine_per_day = Decimal("0.00")
                if days_late > 0:
                    try:
                        org_settings = OrgSettings.objects.get(organization=assignment.organization)
                        fine_per_day = org_settings.fine_per_day
                    except OrgSettings.DoesNotExist:
                        pass
                    
                    if fine_per_day and fine_per_day > Decimal("0.00"):
                        fine_amount = Decimal(days_late) * fine_per_day
            
            assignment.fine_amount = fine_amount
            # Initialize fine payment status if fine exists
            if assignment.fine_amount > Decimal("0.00"):
                 assignment.fine_paid_status = "Pending Proof" # Set for employee action
            else:
                 assignment.fine_paid_status = "Paid/Approved" # Mark fine process complete if no fine
                 
            assignment.save()

            # 3. Update Asset Status
            asset = assignment.asset
            asset.status = 'Available'
            asset.save()

        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🛑 NEW ACTION: Handles Admin denial of an employee's return request
    @action(detail=True, methods=['post'])
    def deny_return(self, request, pk=None):
        # ... (Your existing deny_return logic) ...
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        if assignment.status != 'Requested Return':
            return Response(
                {"detail": f"Cannot deny return. Current status is '{assignment.status}'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set the status back to Active. Do NOT change returned_date or asset status.
        assignment.status = 'Active' 
        assignment.save()

        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    # ====================================================================
    # 🌟 NEW FINE PAYMENT APPROVAL ACTIONS
    # ====================================================================

    # 1. Employee action to submit proof
    @action(detail=True, methods=['post'], url_path='upload-fine-proof')
    def upload_fine_proof(self, request, pk=None):
        """Allows employee to upload a proof of fine payment."""
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Validation checks
        if assignment.fine_amount is None or assignment.fine_amount <= Decimal("0.00"):
            return Response({"detail": "No outstanding fine exists for this assignment."}, status=status.HTTP_400_BAD_REQUEST)
        
        if assignment.fine_paid_status in ['Paid/Approved', 'Proof Submitted']:
            return Response({"detail": f"Fine payment is already '{assignment.fine_paid_status}'."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Assuming the URL/file path is sent in the request data (e.g., after successful file upload to S3/media storage)
        fine_proof_url = request.data.get('fine_proof_url')
        if not fine_proof_url:
            return Response({"detail": "Missing 'fine_proof_url' in request data."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update assignment fields
        assignment.fine_proof_url = fine_proof_url
        assignment.fine_paid_status = "Proof Submitted"
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)


    # 2. Admin action to approve the fine payment
    @action(detail=True, methods=['post'], url_path='approve-fine-payment')
    def approve_fine_payment(self, request, pk=None):
        """Allows Admin to approve a fine payment when proof has been submitted."""
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Validation checks
        if assignment.fine_amount is None or assignment.fine_amount <= Decimal("0.00"):
            return Response({"detail": "No outstanding fine exists for this assignment."}, status=status.HTTP_400_BAD_REQUEST)
            
        if assignment.fine_paid_status == 'Paid/Approved':
            return Response({"detail": "Fine is already marked as Paid/Approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        if assignment.fine_paid_status != 'Proof Submitted':
            return Response({"detail": "Fine payment proof must be 'Submitted' before approval."}, status=status.HTTP_400_BAD_REQUEST)

        # Finalize payment status
        assignment.fine_paid_status = "Paid/Approved"
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)


    # 3. Admin action to deny the fine payment
    @action(detail=True, methods=['post'], url_path='deny-fine-payment')
    def deny_fine_payment(self, request, pk=None):
        """Allows Admin to deny a fine payment proof, reverting status to 'Pending Proof'."""
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Validation checks
        if assignment.fine_paid_status != 'Proof Submitted':
            return Response({"detail": "Only 'Submitted' proofs can be denied."}, status=status.HTTP_400_BAD_REQUEST)

        # Revert status
        assignment.fine_paid_status = "Pending Proof"
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='upload-fine-proof')
    def upload_fine_proof(self, request, pk=None):
        """Allows employee to upload a proof of fine payment."""
        try:
            assignment = self.get_object() 
        except Assignment.DoesNotExist:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure the user is the assigned employee
        if assignment.employee != request.user:
            return Response({"detail": "You are not assigned to this asset."}, status=status.HTTP_403_FORBIDDEN)

        # Validation checks
        if assignment.fine_amount is None or assignment.fine_amount <= Decimal("0.00"):
            return Response({"detail": "No outstanding fine exists for this assignment."}, status=status.HTTP_400_BAD_REQUEST)

        if assignment.fine_paid_status in ['Paid/Approved', 'Proof Submitted']:
            return Response({"detail": f"Fine payment is already '{assignment.fine_paid_status}'."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Accept the file directly
        file = request.FILES.get("proof_file")
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Save file to media/fine_proofs/
        file_path = default_storage.save(f"fine_proofs/{file.name}", ContentFile(file.read()))
        file_url = request.build_absolute_uri(default_storage.url(file_path))

        # Update assignment
        assignment.fine_proof_url = file_url
        assignment.fine_paid_status = "Proof Submitted"
        assignment.save()

        serializer = self.get_serializer(assignment)
        return Response({"fine_proof_url": assignment.fine_proof_url,"fine_paid_status": assignment.fine_paid_status},
        status=status.HTTP_200_OK) 

    
    
# 8. Assignment History ViewSet (Read Only - Multi-Role Access)
class AssignmentHistoryViewSet(MultiTenantMixin, viewsets.ReadOnlyModelViewSet):
    """
    Provides a read-only system log of assignment actions.
    Admins see all history; Employees see only their own history.
    """
    serializer_class = AssignmentHistorySerializer
    queryset = AssignmentHistory.objects.all().order_by('-timestamp')
    # ✅ FIX 3: Change permission to IsAuthenticated, let get_queryset handle filtering
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return super().get_queryset()
            
        queryset = super().get_queryset()

        if user.is_authenticated and user.role == ROLE_EMPLOYEE:
            # Filter for employees
            # Assuming AssignmentHistory has an 'employee' field linked to the User model
            return queryset.filter(employee=user)
        
        # Admins (and Superuser after initial check) see organization-filtered queryset
        return queryset
    
# Authentication views (keeping them as provided)
class OrganizationTokenObtainPairView(OrganizationTokenObtainPairView):
    serializer_class = OrganizationTokenObtainPairSerializer
    
    
class OrganizationMetricsView(GenericAPIView):
    # ... (No change needed here) ...
    permission_classes = [IsAuthenticated, OrgAccessPermission] 

    def get(self, request, *args, **kwargs):
        user = request.user

        if not user.is_authenticated or not user.organization:
            return Response(
                {"detail": "User must be authenticated and assigned to an organization."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        organization = user.organization
        
        base_queryset = Asset.objects.filter(organization=organization)
        
        # --- A. Calculate Status Metrics ---
        status_counts = base_queryset.values('status').annotate(count=Count('status')).order_by()
        status_metrics = {item['status']: item['count'] for item in status_counts}
        
        # --- B. Calculate Category Metrics ---
        category_counts = base_queryset.values('category__name').annotate(count=Count('category__name')).order_by()
        category_metrics = {item['category__name']: item['count'] for item in category_counts if item['category__name']}

        # --- C. Calculate High-Level Totals ---
        total_assets = base_queryset.count()
        
        # --- D. Calculate Overdue Assignments ---
        try:
            from assignments.models import Assignment
            overdue_count = Assignment.objects.filter(
                organization=organization,
                status='Overdue'
            ).count()
        except Exception:
            overdue_count = 0 
            
        response_data = {
            "organization_name": organization.name,
            "total_assets": total_assets,
            "metrics_by_status": status_metrics,
            "metrics_by_category": category_metrics,
            "overdue_assignments": overdue_count,
        }

        return Response(response_data, status=status.HTTP_200_OK)
    
# New---
class ChangePasswordView(APIView):
    # ... (No change needed here) ...
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response({"old_password": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.must_change_password = False
        user.save()

        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)
    
from django.utils.text import get_valid_filename
class UploadFileView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Make filename safe
        safe_filename = get_valid_filename(file.name)

        # Save file to media/fine_proofs/
        file_path = default_storage.save(f"fine_proofs/{safe_filename}", file)

        # Generate absolute URL
        file_url = request.build_absolute_uri(default_storage.url(file_path))

        return Response({"url": file_url}, status=status.HTTP_200_OK)