import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataTable from '../../components/DataTable.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { useAuth } from '../../context/AuthContext.jsx';
// ⭐ NEW IMPORTS FOR CRUD
import useApiAction from '../../hooks/useApiAction.js'; 
import AddEditUserModal from './components/AddEditUserModal.jsx';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal.jsx';

const AdminUsers = () => {
    const { ROLE_ADMIN } = useAuth();
    const { data: users, loading, error: fetchError, refetch } = useApiData('users/');
    
    // ⭐ NEW: Action hook for Delete
    const { 
        loading: actionLoading, 
        error: actionError, 
        execute: executeAction 
    } = useApiAction();

    // ⭐ NEW: Modal State Management
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // Used for Edit mode
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // --- Success/Close Handlers ---
    const handleSuccess = () => {
        refetch(true); // Refetch data to show changes
        handleClose();
    };

    const handleClose = () => {
        setIsAddEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        setUserToDelete(null);
    };
    
    // --- CRUD Handlers ---
    
    // Open modal for ADD
    const handleAddUser = () => {
        setSelectedUser(null); 
        setIsAddEditModalOpen(true);
    };

    // Open modal for EDIT Role
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsAddEditModalOpen(true);
    };

    // Open modal for DELETE confirmation
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    // Execute DELETE API call (optional, runs if DeleteConfirmationModal is not handling it)
    const executeDelete = async () => {
        if (!userToDelete) return;

        const url = `/users/${userToDelete.id}/`; 
        const result = await executeAction(url, "DELETE");

        if (result) {
            handleSuccess(); 
        }
    };
    
    // ⭐ UPDATED: Column Definition with new Actions
    const userColumns = useMemo(() => [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', cell: (user) => `${user.first_name} ${user.last_name}` },
        { header: 'Email', accessor: 'email' },
        { 
            header: 'Role', 
            accessor: 'role',
            cell: (user) => {
                const role = user.role;
                // Use defined badge classes, mapped to your role system
                const colorClass = role === ROLE_ADMIN 
                    ? 'status-danger' // Using status-danger for Admin role
                    : 'status-pending'; // Using status-pending for other roles
                return <span className={`status-badge ${colorClass}`}>{role}</span>;
            }
        },
        { 
            header: 'Actions', 
            cell: (user) => (
                <div className="list-actions"> {/* Use the existing list-actions class for grouping */}
                    {/* EDIT Button - Using btn-link-edit for consistency */}
                    <button 
                        onClick={() => handleEditUser(user)}
                        className="btn-link-edit" // ⭐ USING LINK STYLE
                        disabled={actionLoading}
                    >
                        Edit Role
                    </button>
                    {/* DELETE Button (Prevent Super Admin deletion) */}
                    {user.role !== 'Super Admin' && (
                        <button 
                            onClick={() => handleDeleteClick(user)}
                            className="btn-link-delete" // ⭐ USING LINK STYLE
                            disabled={actionLoading}
                        >
                            Delete
                        </button>
                    )}
                </div>
            )
        },
    ], [actionLoading]);

    // ⭐ UPDATED: Add User Button Action
    const actions = (
        <button 
            onClick={handleAddUser}
            className="btn-primary" // Use the global .btn-primary class
            disabled={actionLoading}
        >
            + Add User
        </button>
    );
    
    // Combine errors for display
    const currentError = fetchError || actionError;

    return (
        <DashboardLayout>
            <h1 className="header-primary">User Management</h1> {/* ⭐ Changed to use .header-primary */}
            
            {/* Display combined error */}
            {currentError && (
                <div className="alert-error"> {/* ⭐ Changed to use global .alert-error */}
                    Error: {currentError.message || currentError.detail || JSON.stringify(currentError)}
                </div>
            )}
            
            <DataTable 
                title="System Users"
                data={users}
                columns={userColumns}
                loading={loading}
                error={null} // Handled above
                actions={actions}
            />

            {/* ⭐ MODAL RENDERING (Unchanged) */}
            
            {isAddEditModalOpen && (
                <AddEditUserModal
                    user={selectedUser} 
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                />
            )}

            {isDeleteModalOpen && userToDelete && (
                <DeleteConfirmationModal
                    id={userToDelete.id} 
                    name={`${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.email})`}
                    urlSegment="users" 
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                />
            )}

            {/* 🛑 REMOVED INLINE STYLES: 
                 The styles for page-title, role-badge, btn-edit, btn-add, and btn-delete
                 have been replaced by the classes provided in dashboard.css.
                 
                 - .page-title => .header-primary
                 - .role-badge styles => .status-badge / .status-danger / .status-pending
                 - .btn-add => .btn-primary
                 - .btn-edit / .btn-delete => .btn-link-edit / .btn-link-delete
            */}
        </DashboardLayout>
    );
};

export default AdminUsers;