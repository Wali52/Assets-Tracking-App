# users/management/commands/populate_small_org.py

from django.core.management.base import BaseCommand
from decimal import Decimal
import random
from users.models import User
from organizations.models import Organization
from assets.models import Asset
from asset_categories.models import AssetCategory
from departments.models import Department
from org_settings.models import OrgSettings

class Command(BaseCommand):
    help = 'Creates a new org with 10 employees and 10 assets'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("--- Starting Small Org Population ---"))

        # 1️⃣ Create new organization
        org_id = "ORG-SMALL"
        org, created = Organization.objects.get_or_create(
            id=org_id,
            defaults={'name': "SmallOrg"}
        )
        if created:
            OrgSettings.objects.create(
                organization=org,
                fine_per_day=Decimal('100.00')
            )
            self.stdout.write(self.style.SUCCESS(f"Created Organization: {org.name}"))
        else:
            self.stdout.write(f"Using existing Organization: {org.name}")

        # 2️⃣ Create departments & categories
        dept_names = ["HR", "IT", "Sales"]
        departments = [Department.objects.get_or_create(name=n, organization=org)[0] for n in dept_names]

        cat_names = ["Laptop", "Monitor", "Keyboard"]
        categories = [AssetCategory.objects.get_or_create(name=n, organization=org)[0] for n in cat_names]

        # 3️⃣ Create 10 employees
        default_password = "welcome123"  # ✅ All employees start with this password
        for i in range(1, 11):
            email = f"employee{i}@smallorg.com"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': f"Emp{i}",
                    'last_name': "SmallOrg",
                    'role': "Employee",
                    'organization': org
                }
            )
            if created:
                user.set_password(default_password)
                user.save()
        self.stdout.write(self.style.SUCCESS("Created 10 employees with default password: welcome123"))

        # 4️⃣ Create 10 assets
        creator = User.objects.filter(organization=org).first()
        for i in range(1, 11):
            Asset.objects.create(
                organization=org,
                asset_tag=f"ASSET-{i:03d}",
                name=f"Laptop #{i}",
                category=random.choice(categories),
                department=random.choice(departments),
                status="Available",
                created_by_user=creator
            )
        self.stdout.write(self.style.SUCCESS("Created 10 assets"))

        self.stdout.write(self.style.SUCCESS("--- Small Org Population Complete ---"))
