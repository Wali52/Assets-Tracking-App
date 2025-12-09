import React, { useState, useMemo } from "react"; 
// Import necessary layout and hooks
import DashboardLayout, { LoadingSpinner } from "../../layouts/DashboardLayout.jsx";
import { useApiData } from "../../hooks/useApiData.js";
import useApiAction from "../../hooks/useApiAction.js";
import axios from 'axios'; 

// 💡 NEW IMPORTS
import AddEditAssignmentModal from "./components/AddEditAssignmentModal.jsx";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal.jsx"; // Assuming you have this generic modal


const AdminAssignments = () => {
    // 1. Data Fetching (READ)
    const { 
        data: assignments, 
        loading: loadingAssignments, 
        error: fetchError, 
        refetch: fetchAssignments,
    } = useApiData("assignments/", [], []); // API: GET /api/v1/assignments/

    // 2. Action Hook for CUD and Mark Returned
    const { 
        loading: actionLoading, 
        error: actionError, 
        execute: executeAction
    } = useApiAction();

    // 3. 💡 Modal State Management
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null); // Used for Edit mode
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);

    // ⭐ NEW STATE FOR STYLED RETURN CONFIRMATION
    const [isConfirmReturnModalOpen, setIsConfirmReturnModalOpen] = useState(false);
    const [assignmentToReturn, setAssignmentToReturn] = useState(null);

    // --- Success/Close Handlers ---
    const handleSuccess = () => {
        fetchAssignments(true); // Refetch data and force cache bust
        handleClose();
    };

    const handleClose = () => {
        setIsAddEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedAssignment(null);
        setAssignmentToDelete(null);
        // ⭐ Reset NEW return modal state
        setIsConfirmReturnModalOpen(false); 
        setAssignmentToReturn(null)
    };

    // --- CRUD Handlers (Unchanged) ---

    // Opens modal for ADD
    const handleAddAssignment = () => {
        setSelectedAssignment(null); 
        setIsAddEditModalOpen(true);
    };

    // Opens modal for EDIT
    const handleEditAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setIsAddEditModalOpen(true);
    };

    // Opens modal for DELETE confirmation
    const handleDeleteClick = (assignment) => {
        setAssignmentToDelete(assignment);
        setIsDeleteModalOpen(true);
    };

    // Executes DELETE API call
    const executeDelete = async () => {
        if (!assignmentToDelete) return;

        const url = `/assignments/${assignmentToDelete.id}/`;
        const result = await executeAction(url, "DELETE");

        if (result) {
            handleSuccess(); 
        }
    };
    
    // --- Action Handler (Mark as Returned) ---

    // ⭐ 1. NEW: Opens the styled confirmation modal
    const handleConfirmReturnClick = (assignmentId) => {
        setAssignmentToReturn(assignmentId);
        setIsConfirmReturnModalOpen(true);
    };

    // ⭐ 2. NEW: Executes the API action after confirmation from the styled modal
    const executeMarkAsReturned = async () => {
        if (!assignmentToReturn) return;

        // Immediately close the modal to avoid double-clicks/issues
        handleClose(); 

        const assignmentId = assignmentToReturn;
        const url = `/assignments/${assignmentId}/return-asset/`;
        let successfulAction = false;

        try {
            await executeAction(url, "POST"); 
            successfulAction = true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400 && 
                error.response.data?.detail === "Asset is already in 'Returned' state.") {
                console.warn("Asset was already marked as returned.");
                successfulAction = true;
            } else {
                console.error("Return Action Failed:", error.message || error);
            }
        }

        if (successfulAction) {
            fetchAssignments(true); 
        }
    };

    // ⭐ 3. MODIFIED: This function now just calls the modal opener
    const handleMarkAsReturned = (assignmentId) => {
        // This is where the old unstyled window.confirm() call was.
        // We replace it with the call to open the new styled modal.
        handleConfirmReturnClick(assignmentId);
    };


    // 4. 💡 DataTable Column Definition (useMemo for optimization)
    const assignmentColumns = useMemo(() => {
        return assignments?.map((a) => {
            // Helper function to format fine amount
            const formatFine = (amount) => {
                if (amount === null || amount === undefined) return 'N/A';
                const floatAmount = parseFloat(amount);
                return floatAmount > 0 ? `$${floatAmount.toFixed(2)}` : 'N/A';
            };

            const isReturned = a.status === 'Returned';
            const hasFine = a.fine_amount && parseFloat(a.fine_amount) > 0;

            let statusClass = 'status-pending';
            if (isReturned) {
                statusClass = hasFine ? 'status-warning' : 'status-success';
            } else if (a.status === 'Overdue') {
                statusClass = 'status-danger';
            }
        
            return (
                <tr key={a.id} className="table-row">
                    {/* Data Cells */}
                    <td className="table-td table-text-bold">{a.asset_name} ({a.asset_tag})</td>
                    <td className="table-td table-text-primary">{a.employee_name}</td>
                    <td className="table-td table-text-secondary">{a.assigned_date}</td> 
                    <td className="table-td table-text-secondary">{a.due_date || 'N/A'}</td> 
                    
                    {/* Returned Date Column */}
                    <td className="table-td table-text-secondary">
                        {isReturned ? (
                            <span className="table-text-success table-text-bold">
                                {a.returned_date || 'N/A'}
                            </span>
                        ) : 'N/A'}
                    </td>

                    {/* Fine Column (New) */}
                    <td className="table-td table-td-center">
                        {hasFine ? (
                            <span className="text-danger table-text-bold">
                                {formatFine(a.fine_amount)}
                            </span>
                        ) : (
                            <span className="table-text-secondary">
                                {isReturned ? 'None' : 'N/A'}
                            </span>
                        )}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="table-td">
                        <span className={`status-badge ${statusClass}`}>
                            {a.status}
                        </span>
                    </td>
                    
                    {/* Action Cell */}
                    <td className="table-td table-td-center">
                        <div className="flex-row button-group"> 
                            
                            {/* Edit Button */}
                            <button 
                                onClick={() => handleEditAssignment(a)} 
                                className="btn-edit btn-sm"
                                disabled={actionLoading}
                            >
                                Edit
                            </button>
                            
                            {/* Delete Button */}
                            <button 
                                onClick={() => handleDeleteClick(a)} 
                                className="btn-danger btn-sm"
                                disabled={actionLoading}
                            >
                                Delete
                            </button>

                            {/* Mark Returned Button (Only for Active/Overdue) */}
                            {a.status !== 'Returned' && (
                                <button
                                    // ⭐ CHANGED: Calls the modal opener function
                                    onClick={() => handleMarkAsReturned(a.id)}
                                    disabled={actionLoading}
                                    className={`btn-primary btn-sm`} 
                                >
                                    {actionLoading && selectedAssignment?.id === a.id ? '...' : 'Return'}
                                </button>
                            )}
                            {a.status === 'Returned' && <span className="table-text-secondary">Completed</span>}
                        </div>
                    </td>
                </tr>
            )
        });
    }, [assignments, actionLoading, selectedAssignment, handleEditAssignment, handleDeleteClick, handleMarkAsReturned]); // Dependencies
    
    // --- Loading and Error States ---
    const currentError = fetchError || actionError;

    if (loadingAssignments) {
        return <DashboardLayout><div className="loading-screen"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    // --- Component JSX ---

    return (
        <DashboardLayout>
            <div className="dashboard-main">
                <h1 className="header-primary">Asset Assignments</h1>
                
                {/* Add New Assignment Button */}
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleAddAssignment} className="btn-primary">
                        + Assign Asset
                    </button>
                </div>

                {/* Error Banner */}
                {currentError && (
                    <div className="alert-error">
                        Error: {currentError.message || JSON.stringify(currentError)}
                    </div>
                )}

                <div className="card table-container">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-th">Asset</th>
                                    <th className="table-th">Employee</th>
                                    <th className="table-th">Assigned Date</th>
                                    <th className="table-th">Due Date</th> 
                                    <th className="table-th">Returned Date</th> 
                                    <th className="table-th table-th-center">Fine</th> 
                                    <th className="table-th">Status</th>
                                    <th className="table-th table-th-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {assignmentColumns}
                            </tbody>
                        </table>
                    </div>
                    {assignments?.length === 0 && !loadingAssignments && (
                        <p className="table-empty-message">No assignment history found.</p>
                    )}
                </div>

                {/* 5. 💡 Render Modals */}
                
                {/* Add/Edit Modal */}
                {isAddEditModalOpen && (
                    <AddEditAssignmentModal
                        assignment={selectedAssignment}
                        onClose={handleClose}
                        onSuccess={handleSuccess}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && assignmentToDelete && (
                    <DeleteConfirmationModal
                        id={assignmentToDelete.id} 
                        name={`Assignment for ${assignmentToDelete.asset_tag}`}
                        urlSegment="assignments" // This tells the modal to hit /assignments/{id}/
                        onClose={handleClose}
                        onSuccess={handleSuccess} // Triggers closing and refetch in parent
                    />
                )}

                {/* ⭐ NEW: Return Confirmation Modal (Styled) */}
                {isConfirmReturnModalOpen && assignmentToReturn && (
                    <DeleteConfirmationModal
                        // Pass the ID and relevant text
                        id={assignmentToReturn} 
                        name={`Assignment ID ${assignmentToReturn}`}
                        
                        // Pass the custom execution function
                        onConfirm={executeMarkAsReturned} // ⭐ The function that makes the POST call
                        onClose={handleClose}

                        // Override the default content of the DeleteConfirmationModal
                        urlSegment={null} // Prevents default DELETE call
                        title="Confirm Asset Return"
                        body={`Are you sure you want to mark this asset as returned? The system will calculate any applicable late fees.`}
                        confirmText="Yes, Return Asset"
                        
                        // You may need to add a prop to your DeleteConfirmationModal 
                        // to handle custom actions instead of just deletion, 
                        // e.g., isCustomAction={true}
                    />
                )}

            </div>
        </DashboardLayout>
    );
}

export default AdminAssignments;