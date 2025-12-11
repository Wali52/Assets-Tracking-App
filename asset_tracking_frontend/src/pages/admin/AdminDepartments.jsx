import React, { useState, useEffect } from "react";
// Adjust paths as necessary based on your final file structure
import DashboardLayout, { LoadingSpinner } from "../../layouts/DashboardLayout.jsx"; 
import { useApiData } from "../../hooks/useApiData.js";
import useApiAction from "../../hooks/useApiAction.js";
import { useAuth } from "../../context/AuthContext.jsx"; 

const AdminDepartments = () => {
    // 🔑 Retrieve organization ID from the authenticated user
    const { currentUser } = useAuth();
    
    // 👇 TEMPORARY: Log the user object to see the organization ID property name
    // This hook logs the user object once on component mount for debugging.
    useEffect(() => {
        console.log("DEBUG: Current User Object Structure:", currentUser); 
    }, [currentUser]); 
    // 👆 END TEMPORARY LOG

    // Get the organization ID (which is needed for POST/PATCH payloads)
    const organizationId = currentUser?.organization; 

    // 1. Data Fetching (READ) - Fetches all departments for the organization
    const { 
        data: departments, 
        loading: loadingDepartments, 
        error: fetchError, 
        refetch: fetchDepartments 
    } = useApiData("/departments/", [], []); // ✅ Department Endpoint

    // 2. Action Hook for POST/PATCH/DELETE
    const { loading: submitting, error: submitError, execute } = useApiAction();

    // 3. Component State
    const [name, setName] = useState("");
    const [editing, setEditing] = useState(null); // Will hold the department object if editing

    // --- Handlers for CRUD Operations ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim() || !organizationId) {
             console.error("Missing Department Name or Organization ID. Current Org ID:", organizationId);
             return;
        }

        let url = "/departments/"; // ✅ POST URL
        let method = "POST";
        let successMessage = "Department added successfully!";

        const payload = { 
            name: name,
            organization: organizationId, // ✅ Required organization ID
        };

        if (editing) {
            url = `/departments/${editing.id}/`; // ✅ PATCH URL
            method = "PATCH";
            successMessage = "Department updated successfully!";
        }

        const result = await execute(url, method, payload);

        if (result) {
            console.log(successMessage);
            setName("");
            setEditing(null);
            fetchDepartments(); // Refreshes the list
        }
    };

    const handleDelete = async (departmentId) => {
        // We use window.confirm as in the Categories file
        if (!window.confirm("Are you sure you want to delete this department?")) return;

        const result = await execute(`/departments/${departmentId}/`, "DELETE"); // ✅ DELETE URL

        if (result) {
            console.log("Department deleted successfully!");
            fetchDepartments(); // Refreshes the list
        }
    };

    const handleEditSetup = (department) => { 
        setEditing(department);
        setName(department.name);
    };

    // --- Loading and Error Display ---

    if (loadingDepartments) { 
        return <DashboardLayout><div className="loading-container"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    const currentError = fetchError || submitError;

    // --- Component JSX ---
    return (
        <DashboardLayout>
            <div className="container">
                <h1 className="header-primary">Department Management</h1>
                
                {/* Error Banner */}
                {currentError && (
                    <div className="alert-error">
                        Error: {currentError}
                    </div>
                )}

                {/* 1. Add/Edit Form */}
                <div className="card">
                    <h3 className="card-header">
                        {editing ? `Edit Department: ${editing.name}` : "Add New Department"}
                    </h3>
                    <form onSubmit={handleSubmit} className="form-flex">
                        <input
                            type="text"
                            placeholder="Department name (e.g., Sales, HR, IT)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-text"
                            disabled={submitting}
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className={`btn-primary ${submitting ? 'btn-disabled' : ''}`}
                        >
                            {submitting ? (
                                <>
                                    <LoadingSpinner size="spinner-md" />
                                    {editing ? "Updating..." : "Adding..."}
                                </>
                            ) : (
                                editing ? "Update Department" : "Add Department"
                            )}
                        </button>
                        {editing && (
                            <button 
                                type="button" 
                                onClick={() => { setEditing(null); setName(""); }}
                                className="btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                {/* 2. Department List */}
                <div className="card">
                    <h3 className="card-header">Existing Departments</h3>
                    <ul className="list-group">
                        {departments.map((d) => (
                            <li key={d.id} className="list-item">
                                <span className="list-item-text">{d.name}</span>
                                <div className="list-actions">
                                    <button 
                                        onClick={() => handleEditSetup(d)} 
                                        className="btn-edit btn-sm"
                                        disabled={submitting}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(d.id)} 
                                        className="btn-danger btn-sm"
                                        disabled={submitting}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {departments.length === 0 && !loadingDepartments && (
                        <p className="list-empty">No departments defined yet.</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AdminDepartments;