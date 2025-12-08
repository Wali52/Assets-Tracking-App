import React, { useState, useEffect } from "react";
import useApiAction from "../hooks/useApiAction.js";
import { useApiData } from "../hooks/useApiData.js";
import { LoadingSpinner } from "../layouts/DashboardLayout.jsx";

const AddEditAssetModal = ({ asset, onClose, onSuccess }) => {
    const isEditing = !!asset;
    
    // 1. Fetch categories for the dropdown menu
    // ✅ FIX APPLIED HERE: Using the correct endpoint 'asset-categories/'
    const { 
        data: categories, 
        loading: loadingCategories, 
        error: categoriesError 
    } = useApiData("asset-categories/", [], []); 
    
    // 2. State for the form data
    const [formData, setFormData] = useState({
        name: asset?.name || "",
        category_id: asset?.category_id || "", // Must be ID
        serial_number: asset?.serial_number || "",
        acquisition_date: asset?.acquisition_date || new Date().toISOString().split('T')[0],
        status: asset?.status || "Available", // Default status
    });

    // 3. Action hook for POST/PATCH
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
        
        let url = "/assets/";
        let method = "POST";

        if (isEditing) {
            url = `/assets/${asset.id}/`;
            method = "PATCH";
        }
        
        // Ensure category_id is an integer (API requirement)
        const payload = { 
            ...formData, 
            category_id: parseInt(formData.category_id),
        };

        const result = await execute(url, method, payload);

        if (result) {
            onSuccess(); // Trigger refetch in parent component
            onClose(); // Close the modal
        }
        // Error handling is managed by useApiAction and displayed below
    };

    const currentError = categoriesError || actionError;

    return (
        <div className="modal-backdrop">
            <div className="modal-content w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    {isEditing ? `Edit Asset: ${asset.name}` : "Add New Asset"}
                </h2>
                
                {/* Error Display */}
                {currentError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {currentError}
                    </div>
                )}
                
                {loadingCategories ? (
                    <div className="flex justify-center py-8"><LoadingSpinner size="spinner-md" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            >
                                <option value="">Select a Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {categories.length === 0 && (
                                <p className="text-red-500 text-xs mt-1">No categories found. Please add categories first.</p>
                            )}
                        </div>

                        {/* Serial Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                            <input
                                type="text"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>

                        {/* Acquisition Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Acquisition Date</label>
                            <input
                                type="date"
                                name="acquisition_date"
                                value={formData.acquisition_date}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        
                        {/* Status (Only editable if not assigned) */}
                        {!isEditing || asset.status.toLowerCase() !== 'assigned' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                >
                                    <option value="Available">Available</option>
                                    <option value="In Maintenance">In Maintenance</option>
                                    <option value="Retired">Retired</option>
                                </select>
                            </div>
                        ) : (
                            <p className="text-sm text-yellow-600">Status is 'Assigned' and cannot be changed here.</p>
                        )}


                        {/* Action Buttons */}
                        <div className="pt-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || categories.length === 0}
                                className={`px-4 py-2 text-white font-semibold rounded-md transition duration-150 ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {submitting ? <LoadingSpinner size="spinner-sm" /> : (isEditing ? "Save Changes" : "Create Asset")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddEditAssetModal;