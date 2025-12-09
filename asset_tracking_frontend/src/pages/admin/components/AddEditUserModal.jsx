/* src/components/AddEditUserModal.jsx */
import React, { useState, useEffect } from 'react';
import useApiAction from "../../../hooks/useApiAction.js";
import { useAuth } from '../../../context/AuthContext.jsx'; // Make sure this is imported
// Assuming LoadingSpinner and ROLES are imported or defined
// import { LoadingSpinner } from "../layouts/DashboardLayout.jsx"; 

const ROLES = ["Super Admin", "Admin", "Employee"]; 

const AddEditUserModal = ({ user, onClose, onSuccess }) => {
    // Hooks must be called first
    const { currentUser } = useAuth();
    const DEFAULT_ORG_ID = currentUser?.organization_id || '';
    
    const isEditing = !!user;

    const [formData, setFormData] = useState({
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        role: user?.role || ROLES[2], 
        password: '',
        organization: user?.organization || DEFAULT_ORG_ID, 
    });
    
    // Hooks for API submission
    const { 
        loading: submitting, 
        error: actionError, 
        execute 
    } = useApiAction();

    useEffect(() => {
        if (!isEditing) {
            setFormData(prev => ({ ...prev, password: '' }));
        }
    }, [isEditing]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let url = '/users/';
        let method = 'POST';
        let dataToSubmit = {}; 
        
        if (isEditing) {
            url = `/users/${user.id}/`;
            method = 'PATCH'; 
            
            dataToSubmit = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role,
                organization: formData.organization,
            };
            
            if (formData.password) {
                 dataToSubmit.password = formData.password;
            }

        } else {
            // POST (Add User)
            url = '/users/';
            method = 'POST';
            
            dataToSubmit = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role,
                password: formData.password,
                organization: formData.organization,
            };
            
            // Basic client-side check for required fields in POST mode
            if (!dataToSubmit.email || !dataToSubmit.password || !dataToSubmit.first_name || !dataToSubmit.last_name || !dataToSubmit.organization) {
                alert("Please fill in all required fields.");
                return;
            }
        }
        
        const result = await execute(url, method, dataToSubmit);

        if (result) {
            onSuccess(); 
        }
    };
    
    // Disable fields when editing, except for role and password
    const isFieldDisabled = isEditing; 

    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-medium">
                <h2 className="modal-title">{isEditing ? `Edit Role for ${user.email}` : "Add New System User"}</h2>
                
                {/* Error Display */}
                {actionError && (
                    <div className="error-message">
                        Error: {actionError.message || actionError.detail || JSON.stringify(actionError)}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="form-container"> {/* ⭐ Added form-container for gap */}

                    {/* Email */}
                    <div className="form-group">
                        <label className="label">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input-field" // ⭐ Styled
                            disabled={isEditing} // Email is immutable
                        />
                    </div>
                    
                    {/* First Name */}
                    <div className="form-group">
                        <label className="label">First Name</label>
                        <input 
                            type="text" 
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            className="input-field" // ⭐ Styled
                            disabled={isFieldDisabled}
                        />
                    </div>
                    
                    {/* Last Name */}
                    <div className="form-group">
                        <label className="label">Last Name</label>
                        <input 
                            type="text" 
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            className="input-field" // ⭐ Styled
                            disabled={isFieldDisabled}
                        />
                    </div>

                    {/* Organization (ID/Name) */}
                    <div className="form-group">
                        <label className="label">Organization ID/Name</label>
                        <input 
                            type="text" 
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            className="input-field" // ⭐ Styled
                            disabled={isFieldDisabled}
                            // Note: We leave this disabled/pre-filled since it's an ID
                        />
                    </div>

                    {/* Role Selection */}
                    <div className="form-group">
                        <label className="label">Role</label>
                        <select 
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="select-field" // ⭐ Styled (Using select-field for consistency)
                        >
                            {ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="label">Password {isEditing ? "(Leave blank to keep current)" : "*"}</label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!isEditing}
                            className="input-field" // ⭐ Styled
                        />
                        {!isEditing && (
                            <small className="warning-text">Password must be strong (min. 8 chars, mixed case, number, symbol).</small>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="button-group"> {/* ⭐ Styled */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="button button-secondary" // ⭐ Styled
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`button button-primary ${submitting ? 'button-submitting' : ''}`} // ⭐ Styled
                        >
                            {submitting ? 'Saving...' : isEditing ? "Save Changes" : "Add User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditUserModal;