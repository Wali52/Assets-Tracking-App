/* src/pages/EmployeeAssets.jsx */

import React, { useCallback, useMemo } from 'react';
import { useApiData } from '../../hooks/useApiData.js'; 
import useApiAction from '../../hooks/useApiAction.js'; 
import DataTable from '../../components/DataTable.jsx';
import DashboardLayout from '../../layouts/DashboardLayout'; 


export default function EmployeeAssets() {
    
    // 1. Fetch Assignments Data
    // FIX: Destructure the refetch function correctly as 'refetch: refetchData'
    const { data: assignments, loading, error, refetch: refetchData } = useApiData('assignments/'); 

    // 2. Define the API action for updating the assignment status (PATCH)
    // IMPORTANT: useApiAction is initialized without arguments, which is fine.
    const { execute: updateAssignment, loading: returnLoading } = useApiAction(); 

    // 3. Define the handler function for the Return Request
    const handleRequestReturn = useCallback(async (assignmentId) => {
        if (!window.confirm(`Confirm: Do you want to submit a return request for this asset (Assignment ID: ${assignmentId})?`)) {
            return;
        }
        
        const url = `assignments/${assignmentId}/`;
        const method = 'PATCH';
        const body = { status: "Requested Return" };

        try {
            // 🛑 CRITICAL FIX: Use POSITIONAL arguments (url, method, body) 
            // to match the original useApiAction hook signature.
            await updateAssignment(url, method, body);
            
            // Success Feedback & Data Refresh
            alert('Return request submitted successfully. The status has been updated to "Requested Return".');
            
            // FIX: Pass 'true' to refetchData to force a cache bypass
            refetchData(true); 
            
        } catch (err) {
            console.error("Return Request Failed:", err);
            const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit return request.';
            alert(errMsg);
        }
    }, [updateAssignment, refetchData]);

    // 4. Define the Columns Array using useMemo
    const columns = useMemo(() => [
        { header: 'Asset Tag', accessor: 'asset_tag' },
        { header: 'Asset Name', accessor: 'asset_name' },
        { header: 'Employee', accessor: 'employee_name' },
        { header: 'Assigned Date', accessor: 'assigned_date' },
        { header: 'Due Date', accessor: 'due_date' },
        
        // Status Column (Uses direct row access: cell: (row) => ...)
        { 
            header: 'Status', 
            accessor: 'status',
            cell: (row) => { 
                if (!row) return null; 
                
                const status = row.status || 'Active'; 
                
                let color = '#4b5563'; 
                if (status === 'Active') color = '#10b981'; 
                if (status === 'Requested Return') color = '#f59e0b'; 
                if (status === 'Overdue') color = '#ef4444'; 

                return <span style={{ color, fontWeight: 'bold' }}>{status}</span>;
            }
        },
        
        // Action Column 
        {
            header: 'Actions',
            accessor: 'actions',
            cell: (row) => {
                if (!row) return null; 

                const status = row.status || 'Active'; 
                const canRequestReturn = status === 'Active';
                
                if (canRequestReturn) {
                    return (
                        <button
                            onClick={() => handleRequestReturn(row.id)} 
                            disabled={returnLoading} 
                            style={{ 
                                backgroundColor: '#dc2626', 
                                color: 'white', 
                                padding: '6px 10px', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                border: 'none',
                                opacity: returnLoading ? 0.7 : 1,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {returnLoading ? 'Processing...' : 'Request Return'}
                        </button>
                    );
                } 
                else if (status === 'Requested Return') {
                    return <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Pending Admin Approval</span>;
                }
                return null;
            },
        },
    ], [returnLoading, handleRequestReturn]); 

    // 5. Conditional Rendering (Loading/Error States)
    if (loading) return <DashboardLayout><div style={{padding: '20px'}}>Loading assigned assets...</div></DashboardLayout>;
    if (error) return <DashboardLayout><div style={{padding: '20px', color: 'red'}}>Error loading assets. Please try again.</div></DashboardLayout>;

    // 6. Main Component Render
    return (
        <DashboardLayout>
            <div className="employee-assets-page" style={{ padding: '20px' }}>
                <h1 style={{ marginBottom: '20px', fontSize: '24px', color: '#1f2937' }}>Your Assigned Assets</h1>
                
                {assignments && assignments.length > 0 ? (
                    <DataTable 
                        columns={columns} 
                        data={assignments} 
                        isLoading={returnLoading} 
                    />
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#6b7280' }}>
                        You currently have no active assigned assets.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}