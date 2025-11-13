import pandas as pd
from django.db import IntegrityError
from django.core.files.uploadedfile import UploadedFile
from .models import User 
import csv
from django.http import HttpResponse

def create_users_from_file(uploaded_file: UploadedFile, organization=None):
    """
    Reads an uploaded CSV or Excel file and creates User objects in bulk.
    
    Returns:
        A tuple (success_count, error_messages)
    """
    error_messages = []
    success_count = 0
    
    # 1. Read data into a DataFrame
    try:
        file_name = uploaded_file.name.lower()
        if file_name.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(uploaded_file, engine='openpyxl')
        elif file_name.endswith('.csv'):
            df = pd.read_csv(uploaded_file, encoding='utf-8')
        else:
            return 0, ["Unsupported file type. Please upload a CSV or Excel (.xlsx) file."]
            
    except Exception as e:
        return 0, [f"Error reading file: {e}"]

    # 2. Standardize column names and validate required fields
    df.columns = [col.lower().strip().replace(' ', '_') for col in df.columns]
    required_fields = ['email', 'first_name', 'last_name']
    
    if not all(field in df.columns for field in required_fields):
        return 0, [f"File is missing one or more required columns: {', '.join(required_fields)}"]

    df.dropna(subset=required_fields, inplace=True)

    # 3. Prepare User objects
    new_users = []
    
    for index, row in df.iterrows():
        try:
            email = str(row['email']).lower().strip()
            
            role_key = str(row.get('role', 'Employee')).strip()
            valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
            role = role_key if role_key in valid_roles else 'Employee'
            
            user = User(
                email=email,
                first_name=str(row['first_name']).strip(),
                last_name=str(row['last_name']).strip(),
                role=role,
                organization=organization,
                is_active=True,
                must_change_password=True, 
            )
            # Temporary password for all imported users
            user.set_password('Welcome123!') 
            new_users.append(user)
            
        except Exception as e:
            error_messages.append(f"Row {index + 2} (Email: {row.get('email', 'N/A')}): Data preparation error - {e}")

    # 4. Save Users Individually
    for user in new_users:
        try:
            user.save()
            success_count += 1
        except IntegrityError:
            error_messages.append(f"Email '{user.email}' already exists and was skipped.")
        except Exception as e:
            error_messages.append(f"Could not save user {user.email}: {e}")

    return success_count, error_messages

def export_users_to_csv(queryset):
    """
    Takes a Django QuerySet of User objects and returns an HTTP response 
    containing a CSV file.
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="exported_users.csv"'

    writer = csv.writer(response)
    
    # 1. Write the header row
    field_names = ['email', 'first_name', 'last_name', 'role', 'organization', 'is_staff', 'must_change_password']
    writer.writerow(field_names)
    
    # 2. Write data rows
    for user in queryset:
        # Get the organization name or leave it blank
        org_name = user.organization.name if user.organization else ''
        
        writer.writerow([
            user.email,
            user.first_name,
            user.last_name,
            user.role,
            org_name,
            user.is_staff,
            user.must_change_password,
        ])
    
    return response