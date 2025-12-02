from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from django.shortcuts import render, redirect
from django.contrib.admin.helpers import ACTION_CHECKBOX_NAME
from .models import User
from .utils import create_users_from_file, export_users_to_csv

class BulkUploadFileForm(forms.Form):
    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput)
    upload_file = forms.FileField(
        label='Select CSV or Excel file',
        help_text='File must contain: email, first_name, last_name, and optional role.',
        widget=forms.FileInput(attrs={'accept': '.csv, .xlsx'})
    )

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Fieldsets for displaying in Admin, including password management
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'role', 'organization')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'must_change_password')}),
        ('Important dates', {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'organization'),
        }),
    )

    list_display = ('id', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'must_change_password')
    readonly_fields = ('id',)
    list_filter = ('role', 'is_staff', 'is_active', 'must_change_password', 'organization')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    # Admin actions
    actions = ['bulk_import_users_action', 'export_users_action']

    # --- Bulk import ---
    def bulk_import_users_action(self, request, queryset):
        if 'apply' in request.POST:
            form = BulkUploadFileForm(request.POST, request.FILES)
            if form.is_valid():
                uploaded_file = request.FILES['upload_file']
                organization = request.user.organization if request.user.organization else None
                success_count, error_messages = create_users_from_file(uploaded_file, organization)
                if success_count > 0:
                    self.message_user(request, f"Successfully created {success_count} users. Default password: 'Welcome123!'", messages.SUCCESS)
                for error in error_messages:
                    self.message_user(request, error, messages.ERROR)
                return redirect('admin:users_user_changelist')
        else:
            form = BulkUploadFileForm(initial={'_selected_action': request.POST.getlist(ACTION_CHECKBOX_NAME)})
            return render(request, 'admin/bulk_upload_confirm.html', {
                'form': form,
                'title': "Bulk Import Employees",
                'action_url': request.get_full_path(),
                'opts': self.model._meta,
                'media': self.media,
            })
    bulk_import_users_action.short_description = "Bulk Import Users (CSV/Excel)"

    # --- Export action ---
    def export_users_action(self, request, queryset):
        return export_users_to_csv(queryset)
    export_users_action.short_description = "Export Selected Users to CSV"
