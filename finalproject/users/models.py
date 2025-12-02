from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# --- ROLE CONSTANTS (Defined at module level for easy access) ---
ROLE_SUPER_ADMIN = "Super Admin"
ROLE_ADMIN = "Admin"
ROLE_EMPLOYEE = "Employee"
# ----------------------------------------------------------------

class UserManager(BaseUserManager):
    def _create_user(self, email, password, **extra_fields):
        """Helper function for creating a user with normalized email and hashed password."""
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Creates and saves a regular User (defaults to Employee role)."""
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("must_change_password", False)
        # Default role for create_user is explicitly Employee
        extra_fields.setdefault("role", ROLE_EMPLOYEE) 
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Creates and saves a Super Admin user."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        # Ensure Superusers are assigned the correct Super Admin role
        extra_fields.setdefault("role", ROLE_SUPER_ADMIN) 
        extra_fields.setdefault("must_change_password", False) 
        
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        
        return self._create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    
    # Use the module-level constants for CHOICES
    ROLE_CHOICES = [
        (ROLE_SUPER_ADMIN, "Super Admin"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_EMPLOYEE, "Employee"),
    ]
    
    # Expose constants as class attributes for easy reference in other files (like views/permissions)
    ROLE_SUPER_ADMIN = ROLE_SUPER_ADMIN
    ROLE_ADMIN = ROLE_ADMIN
    ROLE_EMPLOYEE = ROLE_EMPLOYEE


    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="users", null=True, blank=True
    )
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    # The role field uses the defined choices and defaults to Employee
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE) 
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Forces the user to change their password on first login (good security practice)
    must_change_password = models.BooleanField(default=False) 

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"