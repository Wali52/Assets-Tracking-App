# users/management/commands/populate_dummy_data.py

from django.core.management.base import BaseCommand
import random
from users.models import User
from organizations.models import Organization
from assets.models import Asset
from asset_categories.models import AssetCategory
from departments.models import Department


class Command(BaseCommand):
    help = 'Populates the database with dummy organizations, users, and assets.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("--- Starting Data Population ---"))

        # 1. Create or get organization
        try:
            org, created = Organization.objects.get_or_create(
                id="ORG-ACME",
                defaults={'name': "Acme Corp"}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Organization: {org.name} (ID: {org.id})"))
            else:
                self.stdout.write(f"Using existing Organization: {org.name} (ID: {org.id})")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to create/get Organization: {e}"))
            return

        # 2. Create departments & categories
        department_names = ["Sales", "Engineering", "HR", "Marketing", "Finance"]
        departments = [Department.objects.get_or_create(name=n, organization=org)[0] for n in department_names]

        category_names = ["Laptops", "Monitors", "Keyboards", "Servers"]
        categories = [AssetCategory.objects.get_or_create(name=n, organization=org)[0] for n in category_names]

        self.stdout.write(self.style.SUCCESS(
            f"Created/Ensured {len(departments)} departments and {len(categories)} categories."
        ))

        # 3. Create dummy users
        num_employees = 50
        roles = ["Employee", "Admin"]

        for i in range(num_employees):
            email = f"employee{i+1}@acmecorp.com"
            try:
                User.objects.create_user(
                    email=email,
                    password="tempPassword123",
                    first_name="User",
                    last_name=f"{i+1}",
                    role=random.choice(roles),
                    organization=org
                )
            except Exception:
                continue  # skip existing users

        self.stdout.write(self.style.SUCCESS(f"Created {num_employees} dummy users."))

        # 4. Create dummy assets
        num_assets = 100
        creator = User.objects.filter(organization=org).first()

        if not categories or not departments:
            self.stdout.write(self.style.ERROR("Cannot create assets: Missing categories or departments."))
            return

        for i in range(num_assets):
            Asset.objects.create(
                organization=org,
                asset_tag=f"ASSET-{i+1:04d}",  # ✅ matches your model
                name=f"{random.choice(['Dell', 'HP', 'Lenovo'])} Asset #{i+1}",
                category=random.choice(categories),  # ✅ correct field name
                department=random.choice(departments),
                status=random.choice(["Available", "Assigned", "Maintenance"]),
                created_by_user=creator
            )

        self.stdout.write(self.style.SUCCESS(f"Created {num_assets} dummy assets."))
        self.stdout.write(self.style.SUCCESS("--- Data Population Complete! ---"))
