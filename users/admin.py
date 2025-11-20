from django.contrib import admin, messages
from django.shortcuts import render, redirect
from django import forms
# Corrected import for Django 5.x
from django.contrib.admin.helpers import ACTION_CHECKBOX_NAME
from .models import User
# IMPORTANT: Import the new export utility function
from .utils import create_users_from_file, export_users_to_csv 

# --- Form for File Upload within Admin Action ---
class BulkUploadFileForm(forms.Form):
    """A simple form to handle the file upload in the Admin action."""
    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput) 
    upload_file = forms.FileField(
        label='Select CSV or Excel file',
        help_text='File must contain: email, first_name, last_name, and optional role.',
        widget=forms.FileInput(attrs={'accept': '.csv, .xlsx'})
    )


# --- Custom Admin Model (SINGLE DEFINITION) ---
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    # Standard Admin settings
    list_display = ('id','email', 'first_name', 'last_name', 'role', 'is_staff', 'must_change_password')
    readonly_fields = ('id',)
    list_filter = ('role', 'is_staff', 'is_active', 'must_change_password', 'organization')
    search_fields = ('email', 'first_name', 'last_name')
    # Enable ALL custom actions in ONE list
    actions = ['bulk_import_users_action', 'export_users_action'] 

    # --- 1. Bulk Import Action ---
    def bulk_import_users_action(self, request, queryset):
        # 1. Check if the request is a file POST (meaning the user submitted the form)
        if 'apply' in request.POST:
            form = BulkUploadFileForm(request.POST, request.FILES)
            if form.is_valid():
                uploaded_file = request.FILES['upload_file']
                
                organization = request.user.organization if request.user.organization else None

                success_count, error_messages = create_users_from_file(
                    uploaded_file,
                    organization=organization
                )

                if success_count > 0:
                    self.message_user(
                        request, 
                        f"Successfully created {success_count} new users. They must use 'Welcome123!' as a temporary password.", 
                        level=messages.SUCCESS
                    )
                
                for error in error_messages:
                    self.message_user(request, error, level=messages.ERROR)
                        
                return redirect('admin:users_user_changelist')

        # 2. If it's a GET request, render the confirmation/upload form
        else:
            form = BulkUploadFileForm(initial={'_selected_action': request.POST.getlist(ACTION_CHECKBOX_NAME)})
            
            return render(request, 
                'admin/bulk_upload_confirm.html', 
                context={
                    'form': form,
                    'title': "Bulk Import Employees",
                    'action_url': request.get_full_path(),
                    'opts': self.model._meta,
                    'media': self.media,
                }
            )

    bulk_import_users_action.short_description = "Bulk Import Users (CSV/Excel)"

    # --- 2. Export Action ---
    def export_users_action(self, request, queryset):
        """Action to export selected users to CSV using the utility function."""
        return export_users_to_csv(queryset)

    export_users_action.short_description = "Export Selected Users to CSV"