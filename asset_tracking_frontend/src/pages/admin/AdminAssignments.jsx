import React, { useState, useMemo, useCallback } from "react"; 
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
    } = useApiData("assignments/", [], []); 

    // 2. Action Hook for CUD, Mark Returned, and Approve/Deny
    const { 
        loading: actionLoading, 
        error: actionError, 
        execute: executeAction
    } = useApiAction();

    // 3. 💡 Modal State Management
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null); 
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);

    // ⭐ NEW STATE FOR STYLED RETURN CONFIRMATION
    const [isConfirmReturnModalOpen, setIsConfirmReturnModalOpen] = useState(false);
    const [assignmentToReturn, setAssignmentToReturn] = useState(null);

    // --- Success/Close Handlers ---
    const handleSuccess = () => {
        fetchAssignments(true); 
        handleClose();
    };

    const handleClose = () => {
        setIsAddEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedAssignment(null);
        setAssignmentToDelete(null);
        // Reset return modal state
        setIsConfirmReturnModalOpen(false); 
        setAssignmentToReturn(null)
    };

    // --- CRUD Handlers (Unchanged) ---
    const handleAddAssignment = () => {
        setSelectedAssignment(null); 
        setIsAddEditModalOpen(true);
    };

    const handleEditAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setIsAddEditModalOpen(true);
    };

    const handleDeleteClick = (assignment) => {
        setAssignmentToDelete(assignment);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!assignmentToDelete) return;

        const url = `/assignments/${assignmentToDelete.id}/`;
        const result = await executeAction(url, "DELETE");

        if (result) {
            handleSuccess(); 
        }
    };
    
    // --- Action Handler (Manual Mark as Returned) ---

    const handleConfirmReturnClick = (assignmentId) => {
        setAssignmentToReturn(assignmentId);
        setIsConfirmReturnModalOpen(true);
    };

    const executeMarkAsReturned = async () => {
        if (!assignmentToReturn) return;

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
                console.warn("Asset was already marked as returned (Skipped).");
                successfulAction = true;
            } else {
                console.error("Return Action Failed:", error.message || error);
                alert(`Error: Failed to mark as returned. ${error.message}`);
            }
        }

        if (successfulAction) {
            fetchAssignments(true); 
        }
    };

    const handleMarkAsReturned = (assignmentId) => {
        handleConfirmReturnClick(assignmentId);
    };


    // --- 🛑 NEW: Action Handlers for Approve/Deny Return Requests ---

    const handleExecuteCustomAction = useCallback(async (assignmentId, actionType, confirmMessage, successMessage) => {
        if (!window.confirm(confirmMessage)) { return; }

        const url = `/assignments/${assignmentId}/${actionType}_return/`; // e.g., /assignments/123/approve_return/
        
        try {
            await executeAction(url, 'POST');
            alert(successMessage);
            fetchAssignments(true); 
        } catch (err) {
            console.error(`${actionType} Return Failed:`, err);
            const errMsg = err.response?.data?.detail || `Failed to ${actionType} return. Check API response.`;
            alert(`Error: ${errMsg}`);
        }
    }, [executeAction, fetchAssignments]);

    const handleApproveReturn = useCallback((assignmentId) => {
        handleExecuteCustomAction(
            assignmentId, 
            'approve', 
            `Confirm: Approve the return for Assignment ID ${assignmentId}? This will finalize the return and calculate fines.`, 
            'Return request successfully approved. Status is now Returned/Available.'
        );
    }, [handleExecuteCustomAction]);

    const handleDenyReturn = useCallback((assignmentId) => {
        handleExecuteCustomAction(
            assignmentId, 
            'deny', 
            `Confirm: Deny the return for Assignment ID ${assignmentId}? This sets the status back to Active.`, 
            'Return request successfully denied. Status set back to Active.'
        );
    }, [handleExecuteCustomAction]);


    // 4. 💡 DataTable Column Definition (MODIFIED Action Cell)
    const assignmentColumns = useMemo(() => {
        return assignments?.map((a) => {
            // Helper function to format fine amount
            const formatFine = (amount) => {
                if (amount === null || amount === undefined) return 'N/A';
                const floatAmount = parseFloat(amount);
                return floatAmount > 0 ? `$${floatAmount.toFixed(2)}` : 'N/A';
            };

            const isReturned = a.status === 'Returned';
            const isRequestedReturn = a.status === 'Requested Return'; // 🛑 NEW check
            const hasFine = a.fine_amount && parseFloat(a.fine_amount) > 0;

            let statusClass = 'status-pending';
            if (isRequestedReturn) {
                statusClass = 'status-alert'; // Highlight pending admin action
            } else if (isReturned) {
                statusClass = hasFine ? 'status-warning' : 'status-success';
            } else if (a.status === 'Overdue') {
                statusClass = 'status-danger';
            }
        
            return (
                <tr key={a.id} className="table-row">
                    {/* Data Cells (Same as original) */}
                    <td className="table-td table-text-bold">{a.asset_name} ({a.asset_tag})</td>
                    <td className="table-td table-text-primary">{a.employee_name}</td>
                    <td className="table-td table-text-secondary">{a.assigned_date}</td> 
                    <td className="table-td table-text-secondary">{a.due_date || 'N/A'}</td> 
                    <td className="table-td table-text-secondary">
                        {isReturned ? (
                            <span className="table-text-success table-text-bold">
                                {a.returned_date || 'N/A'}
                            </span>
                        ) : 'N/A'}
                    </td>
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
                    <td className="table-td">
                        <span className={`status-badge ${statusClass}`}>
                            {a.status}
                        </span>
                    </td>
                    
                    {/* 🛑 MODIFIED Action Cell Logic */}
                    <td className="table-td table-td-center">
                        <div className="flex-row button-group"> 
                            
                            {isRequestedReturn ? (
                                // 🛑 Show APPROVE / DENY buttons for pending requests
                                <>
                                    <button 
                                        onClick={() => handleApproveReturn(a.id)} 
                                        className="btn-success btn-sm"
                                        disabled={actionLoading}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleDenyReturn(a.id)} 
                                        className="btn-secondary btn-sm"
                                        disabled={actionLoading}
                                    >
                                        Deny
                                    </button>
                                </>
                            ) : (
                                // Show regular CUD actions for other statuses
                                <>
                                    {/* Edit Button */}
                                    <button 
                                        onClick={() => handleEditAssignment(a)} 
                                        className="btn-edit btn-sm"
                                        disabled={actionLoading || isReturned}
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
                                            onClick={() => handleMarkAsReturned(a.id)}
                                            disabled={actionLoading}
                                            className={`btn-primary btn-sm`} 
                                        >
                                            {actionLoading && selectedAssignment?.id === a.id ? '...' : 'Return'}
                                        </button>
                                    )}
                                    {a.status === 'Returned' && <span className="table-text-secondary">Completed</span>}
                                </>
                            )}
                        </div>
                    </td>
                </tr>
            )
        });
    }, [assignments, actionLoading, selectedAssignment, handleEditAssignment, handleDeleteClick, handleMarkAsReturned, handleApproveReturn, handleDenyReturn]); 
    // Dependencies updated to include new handlers
    
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

                {/* 5. 💡 Render Modals (Unchanged) */}
                
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
                        urlSegment="assignments"
                        onClose={handleClose}
                        onSuccess={handleSuccess}
                    />
                )}

                {/* ⭐ NEW: Return Confirmation Modal (Styled) */}
                {/* Note: This logic only handles the Manual Return. The Approve/Deny use simple window.confirm() for speed. */}
                {isConfirmReturnModalOpen && assignmentToReturn && (
                    <DeleteConfirmationModal
                        id={assignmentToReturn} 
                        name={`Assignment ID ${assignmentToReturn}`}
                        onConfirm={executeMarkAsReturned} 
                        onClose={handleClose}
                        urlSegment={null} 
                        title="Confirm Asset Return"
                        body={`Are you sure you want to mark this asset as returned? The system will calculate any applicable late fees.`}
                        confirmText="Yes, Return Asset"
                    />
                )}

            </div>
        </DashboardLayout>
    );
}

export default AdminAssignments;