from django.core.management.base import BaseCommand
import random
from users.models import User
from organizations.models import Organization
from assets.models import Asset
from asset_categories.models import AssetCategory
from departments.models import Department
from org_settings.models import OrgSettings # Added import for OrgSettings
from decimal import Decimal # Added import for Decimal

class Command(BaseCommand):
    help = 'Populates the database with dummy organizations, users, and assets.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("--- Starting Data Population ---"))

        # 1. Create or get organization
        try:
            org_id = "ORG-IPATH"
            org, created = Organization.objects.get_or_create(
                id=org_id,
                defaults={'name': "iPath"}
            )
            if created:
                # Also ensure OrgSettings is created with the required fine amount
                OrgSettings.objects.create(
                    organization=org, 
                    fine_per_day=Decimal('500.00') # Set default fine amount here
                )
                self.stdout.write(self.style.SUCCESS(f"Created Organization and Settings: {org.name} (ID: {org.id})"))
            else:
                self.stdout.write(f"Using existing Organization: {org.name} (ID: {org.id})")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to create/get Organization: {e}"))
            return

        # 2. Create departments & categories
        department_names = ["Sales", "Development", "HR", "Marketing", "Finance"]
        # Use bulk_create for these simple models if they don't exist
        departments = [Department.objects.get_or_create(name=n, organization=org)[0] for n in department_names]

        category_names = ["Laptops", "Monitors", "Keyboards", "Servers",'Mouse']
        categories = [AssetCategory.objects.get_or_create(name=n, organization=org)[0] for n in category_names]

        self.stdout.write(self.style.SUCCESS(
            f"Created/Ensured {len(departments)} departments and {len(categories)} categories."
        ))

        # 3. Create dummy users (Cannot bulk_create due to hashing, so this remains the bottleneck)
        num_employees = 150
        roles = ["Employee"]

        created_user_count = 0
        for i in range(num_employees):
            email = f"employee{i+1}@ipath.com"
            try:
                # NOTE: create_user handles password hashing, making this loop slow.
                User.objects.get_or_create(
                    email=email,
                    defaults={
                        'password_hash': "welcomePwd123", # Assuming User model handles hashing via custom manager
                        'first_name': "IEmployee",
                        'last_name': f"{i+1}",
                        'role': random.choice(roles),
                        'organization': org
                    }
                )
                created_user_count += 1
            except Exception as e:
                # If you already have users, get_or_create prevents an error, but handles the skip implicitly
                continue 

        self.stdout.write(self.style.SUCCESS(f"Processed {num_employees} dummy user records."))

        # 4. Create dummy assets (OPTIMIZED WITH BULK CREATE)
        num_assets = 800
        creator = User.objects.filter(organization=org).first()

        if not creator:
            # Handle case where no user was created (e.g., if all users already existed)
            creator, _ = User.objects.get_or_create(
                email='admin@ipath.com', 
                defaults={'first_name': 'Super', 'last_name': 'Admin', 'role': 'Super Admin', 'organization': org}
            )


        if not categories or not departments:
            self.stdout.write(self.style.ERROR("Cannot create assets: Missing categories or departments."))
            return

        asset_list = []
        for i in range(num_assets):
            asset_list.append(
                Asset(
                    organization=org,
                    asset_tag=f"ASSET-{i+1:04d}",
                    name=f"{random.choice(['Dell', 'HP', 'Lenovo','MacBook'])} Asset #{i+1}",
                    category=random.choice(categories),
                    department=random.choice(departments),
                    status=random.choice(["Available"]),
                    created_by_user=creator
                )
            )

        # Bulk create all 800 assets in ONE database operation
        Asset.objects.bulk_create(asset_list)

        self.stdout.write(self.style.SUCCESS(f"Created {num_assets} dummy assets using bulk_create."))
        self.stdout.write(self.style.SUCCESS("--- Data Population Complete! ---"))