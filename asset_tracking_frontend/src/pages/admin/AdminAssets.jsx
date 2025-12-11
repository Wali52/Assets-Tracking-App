/* AdminAssets.jsx */
import React, { useState, useMemo, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import DataTable from "../../components/DataTable.jsx";
import { useApiData } from "../../hooks/useApiData.js";
import useApiAction from "../../hooks/useApiAction.js"; 
import AddEditAssetModal from "./components/AddEditAssetModal.jsx";
import "../../styles/adminassets.css"; 

const AdminAssets = () => {
    // --- State for Data and Modals ---
    
    // 1. Modal State for Add/Edit
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null); 

    // 2. Modal State for Delete Confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 
    const [assetToDelete, setAssetToDelete] = useState(null); 

    // 3. Data Fetching
    // 🛑 RESTORED: Fetching ASSETS data from the backend
    const { data: assets, loading, error: fetchError, refetch } = useApiData("assets/"); 
    
    // 4. API Action Hook for Deleting (Only action required here)
    const { 
        loading: deleting, 
        error: deleteError, 
        execute: executeAction 
    } = useApiAction();


    // --- HANDLERS ---
    
    const handleAddAsset = () => {
        setSelectedAsset(null);
        setIsAddEditModalOpen(true);
    };

    const handleEditAsset = (asset) => {
        setSelectedAsset(asset);
        setIsAddEditModalOpen(true);
    };

    const handleDeleteClick = (asset) => {
        setAssetToDelete(asset);
        setIsDeleteModalOpen(true);
    };
    
    // Handler to execute the delete API call
    const executeDelete = async () => {
        if (!assetToDelete) return;

        const url = `assets/${assetToDelete.id}/`;
        const method = 'DELETE';

        const result = await executeAction(url, method);

        if (result) {
            handleSuccess();
        }
    };

    const handleSuccess = () => {
        refetch(); // Refetch the asset list to update the table data
        handleClose();
    };

    const handleClose = () => {
        // Clear states for both Add/Edit and Delete modals
        setIsAddEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedAsset(null);
        setAssetToDelete(null);
    };

    // --- DataTable Column Definition ---
    const assetColumns = useMemo(() => [
        { header: "ID", accessor: "id" },
        { header: "Asset Tag", accessor: "asset_tag" },
        { header: "Asset Name", accessor: "name" },
        { header: "Category", accessor: "category_name" },
        { header: "Department", accessor: "department_name" },
        {
            header: "Status",
            accessor: "status",
            cell: (row) => {
                let color =
                    row.status === "Available"
                        ? "status-green"
                        : row.status === "Assigned"
                        ? "status-blue"
                        : row.status === "In Repair"
                        ? "status-yellow"
                        : row.status === "Requested Return" // This status is for display only
                        ? "status-orange"
                        : "status-gray";

                return <span className={`status-badge ${color}`}>{row.status}</span>;
            },
        },
        { header: "Created By", accessor: "created_by_user_email" },

        {
            header: "Actions",
            cell: (row) => (
                <div className="flex-row button-group"> 
                    <button
                        onClick={() => handleEditAsset(row)}
                        className="btn-edit"
                    >
                        Edit
                    </button>
                    {/* Only Edit and Delete buttons here */}
                    <button
                        onClick={() => handleDeleteClick(row)}
                        className="btn-danger" 
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ], [handleEditAsset, handleDeleteClick]);


    const actions = (
        <button
            onClick={handleAddAsset}
            className="btn-primary"
        >
            + Add Asset
        </button>
    );

    // --- Conditional Modal Rendering ---

    const renderDeleteModal = () => {
        if (!isDeleteModalOpen || !assetToDelete) return null;

        const errorToDisplay = deleteError || fetchError;

        return (
            <div className="modal-backdrop">
                <div className="modal-content modal-small">
                    <h2 className="modal-title delete-title">Confirm Deletion</h2>
                    
                    {errorToDisplay && (
                        <div className="error-message">Error: {errorToDisplay.message || "Failed to delete asset."}</div>
                    )}

                    <p className="modal-body-text">
                        Are you sure you want to permanently delete **{assetToDelete.asset_tag}**?
                        This action cannot be undone.
                    </p>

                    <div className="button-group justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={deleting}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={executeDelete}
                            disabled={deleting}
                            className={`btn-danger ${deleting ? 'btn-submitting' : ''}`}
                        >
                            {deleting ? 'Deleting...' : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <DashboardLayout>
            <h1 className="page-title">Asset Inventory</h1>

            <DataTable
                title="All Organizational Assets"
                data={assets}
                columns={assetColumns}
                loading={loading}
                error={fetchError || deleteError}
                actions={actions}
            />

            {/* Render Add/Edit Modal */}
            {isAddEditModalOpen && (
                <AddEditAssetModal
                    asset={selectedAsset}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                />
            )}
            
            {/* Render Delete Confirmation Modal */}
            {isDeleteModalOpen && assetToDelete && renderDeleteModal()}
                
        </DashboardLayout>
    );
};

export default AdminAssets;