import uuid
import random
from decimal import Decimal
from datetime import timedelta 
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

# --- Import all necessary models from their respective app paths ---
from organizations.models import Organization
from org_settings.models import OrgSettings 
from users.models import User 
from departments.models import Department
from asset_categories.models import AssetCategory
from assets.models import Asset
from assignments.models import Assignment

# --- Data Constants ---
ORG_NAME = "Apex Corp Test Environment"
ADMIN_EMAIL = "admin@apexcorp.com"
ADMIN_PASSWORD = "password"
DEFAULT_FINE = Decimal("0.75") # Matches OrgSettings fine_per_day field definition

DEPARTMENTS = ["Engineering", "Marketing", "Sales", "Finance", "HR"]
CATEGORIES = ["Laptop", "Monitor", "Smartphone", "Server Rack", "Peripheral"]
# Must match Asset.STATUS_CHOICES exactly, including "Maintenance"
ASSET_STATUSES = ["Available", "Assigned", "Maintenance"] 


class Command(BaseCommand):
    """
    Custom management command to seed the database with initial multi-tenant data.
    """
    help = 'Seeds the database with a test Organization, Admin, and sample Assets.'

    def handle(self, *args, **options):
        # Prevent running if the test organization already exists
        if Organization.objects.filter(name=ORG_NAME).exists():
            self.stdout.write(self.style.WARNING(f'Organization "{ORG_NAME}" already exists. Skipping seeding.'))
            return
            
        with transaction.atomic():
            self.stdout.write(self.style.SUCCESS('--- Starting Database Seeding ---'))

            # 1. Create Organization
            org_id = f"ORG-{uuid.uuid4().hex[:6].upper()}"
            organization = Organization.objects.create(
                id=org_id,
                name=ORG_NAME
            )
            self.stdout.write(self.style.SUCCESS(f'1. Created Organization: {ORG_NAME} ({org_id})'))

            # 2. Create Organization Settings
            OrgSettings.objects.create(
                organization=organization,
                fine_per_day=DEFAULT_FINE
            )
            self.stdout.write(self.style.SUCCESS(f'2. Created Default OrgSettings (Fine: ${DEFAULT_FINE})'))

            # 3. Create Organization Admin User
            admin_user = User.objects.create_user(
                email=ADMIN_EMAIL,
                password=ADMIN_PASSWORD,
                first_name="Test",
                last_name="Admin",
                role=User.ROLE_ADMIN, 
                organization=organization,
                is_active=True,
                must_change_password=False 
            )
            self.stdout.write(self.style.SUCCESS(f'3. Created Admin User: {ADMIN_EMAIL} (Password: {ADMIN_PASSWORD})'))
            
            # 4. Create Sample Employee Users
            employee_users = []
            for i in range(5):
                user = User.objects.create_user(
                    email=f"employee{i+1}@apexcorp.com",
                    password="password",
                    first_name=f"Emp{i+1}",
                    last_name="Test",
                    role=User.ROLE_EMPLOYEE,
                    organization=organization,
                    is_active=True,
                )
                employee_users.append(user)
            self.stdout.write(self.style.SUCCESS('4. Created 5 Sample Employee Users'))

            # 5. Create Departments
            created_departments = []
            department_map = {}
            for name in DEPARTMENTS:
                dept = Department.objects.create(
                    name=name,
                    organization=organization
                )
                created_departments.append(dept)
                department_map[name] = dept
            self.stdout.write(self.style.SUCCESS(f'5. Created {len(created_departments)} Departments'))


            # 6. Create Asset Categories
            created_categories = {}
            for name in CATEGORIES:
                cat = AssetCategory.objects.create(
                    name=name,
                    organization=organization
                )
                created_categories[name] = cat
            self.stdout.write(self.style.SUCCESS(f'6. Created {len(created_categories)} Asset Categories'))

            # 7. Create Assets
            
            def create_sample_asset(category_name, department_name, tag_suffix, status_override=None):
                category = created_categories[category_name]
                department = department_map[department_name]
                asset_tag = f"AST-{tag_suffix}"
                
                asset_name = f"{category_name} - {tag_suffix}"
                
                asset_status = status_override if status_override else random.choice(ASSET_STATUSES)

                asset = Asset.objects.create(
                    organization=organization,
                    name=asset_name,
                    asset_tag=asset_tag,
                    category=category,
                    department=department,
                    status=asset_status,
                    created_by_user=admin_user, 
                )
                return asset
            
            assets_to_assign = []

            # Create 10 Laptops
            for i in range(1, 11):
                dept_name = random.choice(["Engineering", "Marketing"])
                asset = create_sample_asset("Laptop", dept_name, f"L{i}")
                if asset.status == "Assigned":
                    assets_to_assign.append(asset)
            
            # Create 5 Monitors
            for i in range(1, 6):
                create_sample_asset("Monitor", "Sales", f"M{i}", status_override="Available")

            # Create 3 Smartphones
            for i in range(1, 4):
                asset = create_sample_asset("Smartphone", "Finance", f"S{i}", status_override="Assigned")
                assets_to_assign.append(asset)
                
            # Create 2 Server Racks (Maintenance assets should not be assigned)
            for i in range(1, 3):
                create_sample_asset("Server Rack", "HR", f"R{i}", status_override="Maintenance")

            self.stdout.write(self.style.SUCCESS(f'7. Created {Asset.objects.count()} Sample Assets'))

            # 8. Create Assignments 
            for asset in assets_to_assign:
                assigned_to_employee = random.choice(employee_users)
                
                assigned_date = timezone.now().date() - timedelta(days=random.randint(1, 30))
                due_date = assigned_date + timedelta(days=60) 

                Assignment.objects.create(
                    organization=organization,
                    asset=asset,
                    employee=assigned_to_employee, 
                    assigned_date=assigned_date, 
                    due_date=due_date, 
                    assigned_by_user=admin_user,
                    # Set status based on due date
                    status='Overdue' if due_date < timezone.now().date() else 'Active',
                )
            
            self.stdout.write(self.style.SUCCESS(f'8. Created {Assignment.objects.count()} Sample Assignments'))
            
            self.stdout.write(self.style.SUCCESS('\n--- Seeding Complete! ---'))
            self.stdout.write(self.style.SUCCESS(f'Test Login: Email: {ADMIN_EMAIL}, Password: {ADMIN_PASSWORD}'))