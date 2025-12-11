import React, { useMemo, useCallback } from "react"; 
// Import necessary layout and hooks
import DashboardLayout, { LoadingSpinner } from "../../layouts/DashboardLayout.jsx";
import { useApiData } from "../../hooks/useApiData.js";
import useApiAction from "../../hooks/useApiAction.js";
import { FaCheckCircle, FaTimesCircle, FaClock, FaExternalLinkAlt } from 'react-icons/fa'; // Icons for status and links


const AdminFines = () => {
    // 1. Data Fetching: Fetch assignments that have a fine amount > 0
    // We assume the API has a filter like ?min_fine=0.01 or ?status__has_fine=true
    const { 
        data: fineAssignments, 
        loading: loadingFines, 
        error: fetchError, 
        refetch: fetchFines,
    } = useApiData("assignments/?min_fine=0.01", [], []); // Adjust filter as necessary for your API

    // 2. Action Hook for CUD, Mark Returned, and Approve/Deny
    const { 
        loading: actionLoading, 
        error: actionError, 
        execute: executeAction
    } = useApiAction();

    // --- Action Handler Utility ---
    const handleExecuteFineAction = useCallback(async (assignmentId, actionType, successMessage) => {
        const confirmMessage = `Are you sure you want to ${actionType} the fine payment for Assignment ID ${assignmentId}?`;
        if (!window.confirm(confirmMessage)) { 
            return; 
        }

        const url = `/assignments/${assignmentId}/${actionType}-fine-payment/`; 
        
        try {
            await executeAction(url, 'POST');
            alert(successMessage);
            fetchFines(true); // Refetch data
        } catch (err) {
            console.error(`${actionType} Fine Payment Failed:`, err);
            const errMsg = err.response?.data?.detail || `Failed to ${actionType} payment.`;
            alert(`Error: ${errMsg}`);
        }
    }, [executeAction, fetchFines]);


    // 3. Admin Action Handlers (Approve/Deny)
    
    const handleApprovePayment = useCallback((assignmentId) => {
        handleExecuteFineAction(
            assignmentId, 
            'approve', 
            'Fine payment successfully approved. Status set to Paid/Approved.'
        );
    }, [handleExecuteFineAction]);

    const handleDenyPayment = useCallback((assignmentId) => {
        handleExecuteFineAction(
            assignmentId, 
            'deny', 
            'Fine payment proof denied. Status set back to Pending Proof.'
        );
    }, [handleExecuteFineAction]);


    // 4. DataTable Column Definition
    const fineColumns = useMemo(() => {
        if (!fineAssignments) return null;

        return fineAssignments.map((a) => {
            const fineAmount = parseFloat(a.fine_amount);
            const statusText = a.fine_paid_status || "N/A";

            let statusClass = 'status-pending';
            let statusIcon = <FaClock />;

            if (statusText === 'Paid/Approved') {
                statusClass = 'status-success';
                statusIcon = <FaCheckCircle />;
            } else if (statusText === 'Proof Submitted') {
                statusClass = 'status-alert'; // Highlight for Admin action
                statusIcon = <FaClock />;
            } else if (statusText === 'Denied/Reopen') {
                 statusClass = 'status-danger';
                 statusIcon = <FaTimesCircle />;
            }
        
            return (
                <tr key={a.id} className="table-row">
                    <td className="table-td table-text-bold">{a.asset_name} ({a.asset_tag})</td>
                    <td className="table-td table-text-primary">{a.employee_name}</td>
                    <td className="table-td table-text-secondary">{a.returned_date || 'N/A'}</td> 
                    
                    {/* Fine Amount */}
                    <td className="table-td table-text-bold text-danger">
                        {fineAmount > 0 ? `$${fineAmount.toFixed(2)}` : 'N/A'}
                    </td>
                    
                    {/* Payment Proof Link */}
                    <td className="table-td">
                        {a.fine_proof_url ? (
                            <a href={a.fine_proof_url} target="_blank" rel="noopener noreferrer" className="btn-link">
                                View Proof <FaExternalLinkAlt size={10} style={{marginLeft: '5px'}}/>
                            </a>
                        ) : (
                            <span className="table-text-secondary">N/A</span>
                        )}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="table-td">
                        <span className={`status-badge ${statusClass}`}>
                            {statusIcon} {statusText}
                        </span>
                    </td>
                    
                    {/* Action Cell */}
                    <td className="table-td table-td-center">
                        <div className="flex-row button-group"> 
                            
                            {statusText === 'Proof Submitted' && (
                                <>
                                    {/* Approve Button */}
                                    <button 
                                        onClick={() => handleApprovePayment(a.id)} 
                                        className="btn-approve"
                                        disabled={actionLoading}
                                    >
                                        Approve
                                    </button>
                                    
                                    {/* Deny Button */}
                                    <button 
                                        onClick={() => handleDenyPayment(a.id)} 
                                        className="btn-deny"
                                        disabled={actionLoading}
                                    >
                                        Deny
                                    </button>
                                </>
                            )}
                            {/* Final Status Indicator */}
                            {statusText === 'Paid/Approved' && <span className="table-text-success table-text-bold">Payment Cleared</span>}
                            {statusText === 'Pending Proof' && <span className="table-text-secondary">Awaiting Upload</span>}
                        </div>
                    </td>
                </tr>
            )
        });
    }, [fineAssignments, actionLoading, handleApprovePayment, handleDenyPayment]);
    
    // --- Loading and Error States ---
    const currentError = fetchError || actionError;

    if (loadingFines) {
        return <DashboardLayout><div className="loading-screen"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    // --- Component JSX ---

    return (
        <DashboardLayout>
            <div className="dashboard-main">
                <h1 className="header-primary">💰 Fine Payment Approvals</h1>
                
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
                                    <th className="table-th">Asset/Tag</th>
                                    <th className="table-th">Employee</th>
                                    <th className="table-th">Returned Date</th>
                                    <th className="table-th">Fine Amount</th> 
                                    <th className="table-th">Payment Proof</th> 
                                    <th className="table-th">Payment Status</th>
                                    <th className="table-th table-th-center">Admin Action</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {fineColumns}
                            </tbody>
                        </table>
                    </div>
                    {fineAssignments?.length === 0 && !loadingFines && (
                        <p className="table-empty-message">No assignments currently have outstanding or pending fines.</p>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}

export default AdminFines;