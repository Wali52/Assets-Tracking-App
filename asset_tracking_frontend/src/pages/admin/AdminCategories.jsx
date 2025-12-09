import React, { useState, useEffect } from "react";
import DashboardLayout, { LoadingSpinner } from "../../layouts/DashboardLayout.jsx";
import { useApiData } from "../../hooks/useApiData.js";
import useApiAction from "../../hooks/useApiAction.js";
import { useAuth } from "../../context/AuthContext.jsx"; 

const AdminCategories = () => {
    // 🔑 Retrieve organization ID from the authenticated user
    const { currentUser } = useAuth();
    
    // 👇 TEMPORARY: Log the user object to see the organization ID property name
    // REMOVE THIS useEffect hook once the feature is working to clean up the console.
    useEffect(() => {
        // Find this log in your browser console (F12 -> Console tab)
        console.log("DEBUG: Current User Object Structure:", currentUser); 
    }, [currentUser]); 
    // 👆 END TEMPORARY LOG

    // ✅ FIX 1: Set organizationId to correctly read the 'organization' key from the user object.
    const organizationId = currentUser?.organization; 

    // 1. Data Fetching (READ)
    const { 
        data: categories, 
        loading: loadingCategories, 
        error: fetchError, 
        refetch: fetchCategories 
    } = useApiData("/asset-categories/", [], []); 

    // 2. Action Hook for POST/PATCH/DELETE
    const { loading: submitting, error: submitError, execute } = useApiAction();

    // 3. Component State
    const [name, setName] = useState("");
    const [editing, setEditing] = useState(null);

    // --- Handlers for CRUD Operations ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // This guard clause should now pass if the organization ID is present.
        if (!name.trim() || !organizationId) {
             console.error("Missing Category Name or Organization ID. Current Org ID:", organizationId);
             return;
        }

        let url = "/asset-categories/"; 
        let method = "POST";
        let successMessage = "Category added successfully!";

        // ✅ FIX 2: Organization ID is passed as a string (e.g., ORG-6547BD).
        const payload = { 
            name: name,
            // Pass the organization ID as a string
            organization: organizationId, 
        };

        if (editing) {
            url = `/asset-categories/${editing.id}/`; 
            method = "PATCH";
            successMessage = "Category updated successfully!";
        }

        const result = await execute(url, method, payload);

        if (result) {
            console.log(successMessage);
            setName("");
            setEditing(null);
            fetchCategories(); 
        }
    };

    const handleDelete = async (categoryId) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;

        const result = await execute(`/asset-categories/${categoryId}/`, "DELETE"); 

        if (result) {
            console.log("Category deleted successfully!");
            fetchCategories(); 
        }
    };

    const handleEditSetup = (category) => {
        setEditing(category);
        setName(category.name);
    };

    // --- Loading and Error Display ---

    if (loadingCategories) {
        return <DashboardLayout><div className="loading-container"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    const currentError = fetchError || submitError;

    // --- Component JSX (using plain CSS classes) ---
    return (
        <DashboardLayout>
            <div className="container">
                <h1 className="header-primary">Category Management</h1>
                
                {/* Error Banner */}
                {currentError && (
                    <div className="alert-error">
                        Error: {currentError}
                    </div>
                )}

                {/* 1. Add/Edit Form */}
                <div className="card">
                    <h3 className="card-header">
                        {editing ? `Edit Category: ${editing.name}` : "Add New Category"}
                    </h3>
                    <form onSubmit={handleSubmit} className="form-flex">
                        <input
                            type="text"
                            placeholder="Category name (e.g., Laptops, Furniture)"
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
                                editing ? "Update Category" : "Add Category"
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

                {/* 2. Category List */}
                <div className="card">
                    <h3 className="card-header">Existing Categories</h3>
                    <ul className="list-group">
                        {categories.map((c) => (
                            <li key={c.id} className="list-item">
                                <span className="list-item-text">{c.name}</span>
                                <div className="list-actions">
                                    <button 
                                        onClick={() => handleEditSetup(c)}
                                        className="btn-link-edit"
                                        disabled={submitting}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="btn-link-delete"
                                        disabled={submitting}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {categories.length === 0 && !loadingCategories && (
                        <p className="list-empty">No categories defined yet.</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AdminCategories;