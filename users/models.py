# from django.db import models
# from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# class UserManager(BaseUserManager):
#     def _create_user(self, email, password, **extra_fields):
#         if not email:
#             raise ValueError("Email is required")
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_user(self, email, password=None, **extra_fields):
#         extra_fields.setdefault("is_staff", False)
#         extra_fields.setdefault("is_superuser", False)
#         extra_fields.setdefault("must_change_password", False)
#         return self._create_user(email, password, **extra_fields)

#     def create_superuser(self, email, password=None, **extra_fields):
#         extra_fields.setdefault("is_staff", True)
#         extra_fields.setdefault("is_superuser", True)
#         extra_fields.setdefault("role", "Super Admin")
#         extra_fields.setdefault("must_change_password", False) 
#         return self._create_user(email, password, **extra_fields)

# class User(AbstractBaseUser, PermissionsMixin):
#     ROLE_CHOICES = [
#         ("Super Admin", "Super Admin"),
#         ("Admin", "Admin"),
#         ("Employee", "Employee"),
#     ]

#     id = models.BigAutoField(primary_key=True)
#     organization = models.ForeignKey(
#         "organizations.Organization", on_delete=models.CASCADE,
#         related_name="users", null=True, blank=True
#     )
#     email = models.EmailField(unique=True)
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Employee")
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
    
#     # NEW FIELD: Forces the user to change their password on first login
#     must_change_password = models.BooleanField(default=False) 

#     USERNAME_FIELD = "email"
#     REQUIRED_FIELDS = []

#     objects = UserManager()

#     def __str__(self):
#         return f"{self.email} ({self.role})"


from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("must_change_password", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.ROLE_SUPER_ADMIN) # Use new constant
        extra_fields.setdefault("must_change_password", False) 
        return self._create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    # --- ROLE CONSTANTS (NEW) ---
    ROLE_SUPER_ADMIN = "Super Admin"
    ROLE_ADMIN = "Admin"
    ROLE_EMPLOYEE = "Employee"
    
    ROLE_CHOICES = [
        (ROLE_SUPER_ADMIN, "Super Admin"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_EMPLOYEE, "Employee"),
    ]

    id = models.BigAutoField(primary_key=True)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="users", null=True, blank=True
    )
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    # Use the constant as the default value
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE) 
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # NEW FIELD: Forces the user to change their password on first login
    must_change_password = models.BooleanField(default=False) 

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"