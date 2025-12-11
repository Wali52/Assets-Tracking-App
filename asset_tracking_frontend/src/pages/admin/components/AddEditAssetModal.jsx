/* src/components/AddEditAssetModal.jsx */
import React, { useState, useEffect } from "react";
import useApiAction from "../../../hooks/useApiAction.js";
import { useApiData } from "../../../hooks/useApiData.js";
import { LoadingSpinner } from "../../../layouts/DashboardLayout.jsx"; // Assuming LoadingSpinner uses minimal/internal styling

import { useAuth } from "../../../context/AuthContext.jsx"; 

const AddEditAssetModal = ({ asset, onClose, onSuccess }) => {
    const isEditing = !!asset;

    const { currentUser, organizationData } = useAuth(); 
    
    // ⭐ FIX: Since organizationData is a string (e.g., "ORG-6547BD") or null, 
    // we use it directly as the "tag" or organization identifier.
    // If you were editing, 'asset.organization' might be the string tag itself.
    const currentOrganizationTag = organizationData || (isEditing ? asset.organization : null); 
    const currentCreatedByUserId = currentUser?.id || 0; 
    
    // 1. Fetch categories and departments
    const { 
        data: categories, 
        loading: loadingCategories, 
        error: categoriesError 
    } = useApiData("asset-categories/", [], []); 
    
    const { 
        data: departments, 
        loading: loadingDepartments, 
        error: departmentsError 
    } = useApiData("departments/", [], []); 

    // 2. State for the form data
    const [formData, setFormData] = useState({
        asset_tag: asset?.asset_tag || "",
        name: asset?.name || "",
        serial_number: asset?.serial_number || "",
        acquisition_date: asset?.acquisition_date || new Date().toISOString().split('T')[0],
        
        // Initialize category and department with the ID (converted to string for select value)
        category: asset?.category?.id?.toString() || "", 
        department: asset?.department?.id?.toString() || "", 
        
        status: asset?.status || "Available", 
        // For editing, use the asset's organization (which is a string tag)
        organization: isEditing ? (asset.organization || null) : null,
        created_by_user: isEditing ? (asset.created_by_user?.id || asset.created_by_user || 0) : 0, 
    });

    // 3. Effect to populate IDs
    useEffect(() => {
        // Only run this if we are CREATING a new asset and the required context data is available
        if (!isEditing && currentCreatedByUserId > 0 && currentOrganizationTag) {
            setFormData(prev => ({
                ...prev,
                // ⭐ FIX: Assign the string tag
                organization: currentOrganizationTag, 
                created_by_user: currentCreatedByUserId,
            }));
        } 
    }, [isEditing, currentCreatedByUserId, currentOrganizationTag, asset]);
    
    // 4. Action hook
    const { 
        loading: submitting, 
        error: actionError, 
        execute 
    } = useApiAction();

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.created_by_user === 0 || !formData.organization) {
            alert("Error: User or Organization data is missing. Please wait for data to load or re-login.");
            console.error("Auth data is missing. Current formData state:", formData);
            return;
        }

        let url = "/assets/";
        let method = "POST";

        if (isEditing) {
            url = `/assets/${asset.id}/`;
            method = "PATCH";
        }
        
        // Clean and prepare payload for API
        const payload = { 
            ...formData, 
            // Convert select box strings back to integers or null
            category: formData.category ? parseInt(formData.category) : null,
            department: formData.department ? parseInt(formData.department) : null,
            created_by_user: parseInt(formData.created_by_user), 
            // ⭐ FIX: Send the organization field as a string tag, NOT parseInt()
            organization: formData.organization, 
            // Ensure status 'In Maintenance' from UI is correctly sent as 'Maintenance' to API
            status: formData.status === "In Maintenance" ? "Maintenance" : formData.status,
        };

        const result = await execute(url, method, payload);

        if (result) {
            onSuccess(); 
            onClose(); 
        }
    };
    
    const currentError = categoriesError || departmentsError || actionError;
    const loadingData = loadingCategories || loadingDepartments;
    
    // ⭐ FIX: Check for the existence of the currentOrganizationTag string
    const isReadyToRenderForm = isEditing 
        ? true 
        : (currentCreatedByUserId > 0 && !!currentOrganizationTag);

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2 className="modal-title">
                    {isEditing ? `Edit Asset: ${asset.name}` : "Add New Asset"}
                </h2>
                
                {/* Error Display */}
                {currentError && (
                    <div className="error-message">
                        Error: {currentError.message || currentError}
                    </div>
                )}
                
                {loadingData || !isReadyToRenderForm ? (
                    <div className="modal-loading">
                        <LoadingSpinner size="spinner-md" />
                        <p className="loading-text">Loading data...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="form-container">
                        
                        {/* ASSET TAG */}
                        <div>
                            <label className="label">Asset Tag</label>
                            <input
                                type="text"
                                name="asset_tag"
                                value={formData.asset_tag}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>

                        {/* NAME */}
                        <div>
                            <label className="label">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>

                        {/* CATEGORY */}
                        <div>
                            <label className="label">Category</label>
                            <select
                                name="category" 
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="input-field select-field"
                            >
                                <option value="">Select a Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {categories.length === 0 && (
                                <p className="warning-text">No categories found. Please add categories first.</p>
                            )}
                        </div>
                        
                        {/* DEPARTMENT */}
                        <div>
                            <label className="label">Department</label>
                            <select
                                name="department" 
                                value={formData.department}
                                onChange={handleChange}
                                required
                                className="input-field select-field"
                            >
                                <option value="">Select a Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            {departments.length === 0 && (
                                <p className="warning-text">No departments found.</p>
                            )}
                        </div>

                        {/* Serial Number */}
                        <div>
                            <label className="label">Serial Number</label>
                            <input
                                type="text"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>

                        {/* Acquisition Date */}
                        <div>
                            <label className="label">Acquisition Date</label>
                            <input
                                type="date"
                                name="acquisition_date"
                                value={formData.acquisition_date}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>
                        
                        {/* Status */}
                        {!isEditing || asset.status.toLowerCase() !== 'assigned' ? (
                            <div>
                                <label className="label">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="input-field select-field"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Assigned">Assigned</option>
                                    <option value="Maintenance">Maintenance</option>
                                    {/* <option value="Retired">Retired</option>  */}
                                </select>
                            </div>
                        ) : (
                            <p className="status-assigned-text">Status is **Assigned** and cannot be changed here.</p>
                        )}


                        {/* Action Buttons */}
                        <div className="button-group">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="button button-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || categories.length === 0 || departments.length === 0}
                                className={`button ${submitting ? 'button-submitting' : 'button-primary'}`}
                            >
                                {submitting ? 'Submitting...' : (isEditing ? "Save Changes" : "Create Asset")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddEditAssetModal;