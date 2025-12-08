import React from "react";
// Import necessary layout and hooks
import DashboardLayout, { LoadingSpinner } from "../layouts/DashboardLayout.jsx";
import { useApiData } from "../hooks/useApiData.js"; // For fetching the list
import useApiAction from "../hooks/useApiAction.js"; // For the Mark Returned action
import axios from 'axios'; // For error checking

const AdminAssignments = () => {
    // 1. Data Fetching (READ) - DESTRUCTURE setData HERE
    const { 
        data: assignments, 
        loading: loadingAssignments, 
        error: fetchError, 
        refetch: fetchAssignments,
        setData: setAssignments // Keep this for completeness, though not strictly needed for this fix
    } = useApiData("/assignments/", [], []); // API: GET /api/v1/assignments/

    // 2. Action Hook for PATCH (Mark as Returned)
    const { 
        loading: returning, 
        error: returnError, 
        execute: executeReturn
    } = useApiAction();

    // --- Action Handlers ---

const handleMarkAsReturned = async (assignmentId) => {
    if (!window.confirm("Confirm: Mark this asset as returned?")) return;

    const url = `/assignments/${assignmentId}/return-asset/`;
    
    // We assume the action is successful, even if it throws the 400 error.
    let successfulAction = false;

    try {
        // Attempt the API call
        await executeReturn(url, "POST"); 
        successfulAction = true;
        console.log(`Assignment ${assignmentId} successfully returned.`);

    } catch (error) {
        let errorMessage = "An unknown error occurred during return.";

        // Check for the expected 400 "Already Returned" error
        if (axios.isAxiosError(error) && error.response?.status === 400 && 
            error.response.data?.detail === "Asset is already in 'Returned' state.") {
            
            // Treat the "Already Returned" message as a UI success, as the server confirmed the state.
            successfulAction = true;
            console.warn(`Assignment ${assignmentId} already returned on server. Proceeding to refresh UI.`);
            
        } else {
            // Handle actual failure
            errorMessage = error.message || errorMessage;
            console.error("Return Action Failed:", errorMessage);
            // You may want to display a toast/alert for the user here.
        }
    }

    // ⭐ CACHE BUSTING FIX: If the action was successful or already completed, 
    // force a cache-busting refresh of the entire assignments list.
    if (successfulAction) {
        // We pass 'true' to force useApiData to append a timestamp and bypass the stale cache.
        fetchAssignments(true); 
    }
};


    // --- Loading and Error States ---
    const currentError = fetchError || returnError;

    if (loadingAssignments) {
        // Using layout-wrapper and loading-screen classes from dashboard.css
        return <DashboardLayout><div className="loading-screen"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    // --- Component JSX ---

    return (
        <DashboardLayout>
            <div className="dashboard-main">
                <h1 className="header-primary">Asset Assignments</h1>
                
                {/* Error Banner */}
                {currentError && (
                    <div className="alert-error">
                        Error: {currentError}
                    </div>
                )}

                <div className="card table-container"> {/* Card for grouping and shadow */}
                    <div className="table-responsive"> {/* For overflow on smaller screens */}
                        <table className="data-table">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-th">Asset</th>
                                    <th className="table-th">Employee</th>
                                    <th className="table-th">Assigned Date</th>
                                    <th className="table-th">Due Date</th> 
                                    <th className="table-th">Status</th>
                                    <th className="table-th table-th-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {assignments?.map((a) => (
                                    <tr key={a.id} className="table-row">
                                        <td className="table-td table-text-bold">{a.asset_name}</td>
                                        <td className="table-td table-text-primary">{a.employee_name}</td>
                                        <td className="table-td table-text-secondary">{a.assigned_at}</td>
                                        <td className="table-td table-text-secondary">{a.due_date || 'N/A'}</td> 
                                        
                                        {/* 🔴 FIX: Check a.status string instead of a.is_returned boolean */}
                                        <td className="table-td">
                                            <span className={`status-badge ${
                                                // Check if the STATUS string equals 'Returned'
                                                a.status === 'Returned' ? 'status-success' : 'status-pending'
                                            }`}>
                                                {/* Display the STATUS string value */}
                                                {a.status}
                                            </span>
                                        </td>
                                        
                                        {/* 🔴 FIX: Check a.status string instead of a.is_returned boolean */}
                                        <td className="table-td table-td-center">
                                            {/* Show button ONLY if status is NOT 'Returned' */}
                                            {a.status !== 'Returned' && (
                                                <button
                                                    onClick={() => handleMarkAsReturned(a.id)}
                                                    disabled={returning}
                                                    className={`btn btn-success btn-sm ${returning ? 'btn-disabled' : ''}`}
                                                >
                                                    {returning ? <LoadingSpinner size="spinner-sm" /> : 'Mark Returned'}
                                                </button>
                                            )}
                                            {/* Show Completed text if status IS 'Returned' */}
                                            {a.status === 'Returned' && <span className="table-text-secondary">Completed</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {assignments?.length === 0 && !loadingAssignments && (
                        <p className="table-empty-message">No assignment history found.</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AdminAssignments;