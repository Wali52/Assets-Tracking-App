import React, { useState, useMemo } from 'react';
import DashboardLayout, { LoadingSpinner } from '../../layouts/DashboardLayout.jsx'; 
import { useAuth } from '../../context/AuthContext.jsx';
import useApiAction from '../../hooks/useApiAction.js';
// 🛑 NEW IMPORTS: Data Fetching Hook and Modal Component
import { useApiData } from '../../hooks/useApiData.js';
import EmployeeFinePaymentModal from '../../components/employee/EmployeeFinePaymentModal.jsx'; // 🛑 ADJUST PATH IF NECESSARY
// 🛑 NEW IMPORTS: Icons for status
import { FaMoneyBillWave, FaClock, FaCheckCircle, FaUpload } from 'react-icons/fa'; 

export default function EmployeeDashboard() {
    const { currentUser, role } = useAuth();
    
    // --- State for Password Change (Existing) ---
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { loading: submitting, error: submitError, execute } = useApiAction();

    // --- 🛑 NEW STATE: Fine Management ---
    const [fineAssignmentToPay, setFineAssignmentToPay] = useState(null);

    // --- 🛑 NEW DATA FETCHING: Employee Assignments ---
    // Fetch all assignments for the current user that have an outstanding fine
    const { 
        data: employeeAssignments, 
        loading: loadingAssignments, 
        refetch: refetchAssignments 
    } = useApiData("assignments/?employee=me", [], []); // Adjust filter if needed, but employee=me is standard

    // --- Handlers (Existing) ---
    const handlePasswordChange = async (e) => {
        // ... (Your existing password change logic) ...
        e.preventDefault();
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            alert("New password and confirmation password do not match.");
            return;
        }
        if (newPassword.length < 8) {
            alert("New password must be at least 8 characters long.");
            return;
        }

        const payload = { old_password: oldPassword, new_password: newPassword };
        const result = await execute('/change-password/', 'POST', payload);

        if (result) {
            setSuccessMessage("Password changed successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };
    
    // --- Handler for Modal Success ---
    const handleSuccessfulUpload = () => {
        setFineAssignmentToPay(null); // Close modal
        refetchAssignments(true); // Refresh data to update status
    };

    // --- 🛑 NEW: Assignment Table Rows (Memoized for fine management) ---
    const assignmentRows = useMemo(() => {
        if (loadingAssignments || !employeeAssignments) return null;

        // Filter assignments that have a fine amount greater than zero
        const assignmentsWithFines = employeeAssignments.filter(a => parseFloat(a.fine_amount) > 0);

        if (assignmentsWithFines.length === 0) {
            return (
                <tr>
                    <td colSpan="6" className="table-td text-center">No current outstanding fines to display.</td>
                </tr>
            );
        }

        return assignmentsWithFines.map((assignment) => {
            const fineAmount = parseFloat(assignment.fine_amount);
            const status = assignment.fine_paid_status || 'Pending Proof'; // Default to Pending Proof if not set
            let actionButton = null;

            if (status === 'Pending Proof' || status === 'Denied/Reopen') {
                actionButton = (
                    <button 
                        className="btn-danger btn-sm"
                        onClick={() => setFineAssignmentToPay(assignment)}
                    >
                        <FaUpload style={{marginRight: '5px'}}/> Upload Proof
                    </button>
                );
            } else if (status === 'Proof Submitted') {
                actionButton = (
                    <span className="status-badge status-alert"><FaClock style={{marginRight: '5px'}}/> Awaiting Admin Review</span>
                );
            } else if (status === 'Paid/Approved') {
                actionButton = (
                    <span className="status-badge status-success"><FaCheckCircle style={{marginRight: '5px'}}/> Paid/Cleared</span>
                );
            }

            return (
                <tr key={assignment.id}>
                    <td className="table-td table-text-bold">{assignment.asset_name} ({assignment.asset.asset_tag})</td>
                    <td className="table-td">{assignment.due_date}</td>
                    <td className="table-td">{assignment.returned_date || 'N/A'}</td>
                    <td className="table-td text-danger table-text-bold">${fineAmount.toFixed(2)}</td>
                    <td className="table-td">
                         <span className={`status-badge ${status === 'Proof Submitted' ? 'status-alert' : status === 'Paid/Approved' ? 'status-success' : 'status-danger'}`}>
                            {status}
                         </span>
                    </td>
                    <td className="table-td table-td-center">{actionButton}</td>
                </tr>
            );
        });
    }, [employeeAssignments, loadingAssignments]);


    if (!currentUser || loadingAssignments) {
        return <DashboardLayout><div className="loading-container"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    // --- Component JSX ---

    return (
        <DashboardLayout>
            <h1 className="header-primary">Welcome, {currentUser.first_name || currentUser.email}!</h1>
            <p className="page-subtitle">Manage your profile, security, and outstanding financial matters.</p>

            {/* General Error/Success Display */}
            {(submitError || successMessage) && (
                <div className={`alert ${submitError ? 'alert-error' : 'alert-success'}`}>
                    {submitError || successMessage}
                </div>
            )}
            
            {/* 🛑 NEW: Fine Management Section */}
            <div className="card full-width-card" style={{marginBottom: '20px'}}>
                <h3 className="card-header"><FaMoneyBillWave style={{marginRight: '10px'}}/> Outstanding Fines</h3>
                
                {loadingAssignments ? (
                    <div className="text-center"><LoadingSpinner size="spinner-sm" /> Loading Fines...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead className="table-header">
                                <tr>
                                    <th className="table-th">Asset Name</th>
                                    <th className="table-th">Due Date</th>
                                    <th className="table-th">Returned Date</th>
                                    <th className="table-th">Fine Amount</th>
                                    <th className="table-th">Payment Status</th>
                                    <th className="table-th table-th-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {assignmentRows}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            <div className="dashboard-grid">
                
                {/* CARD 1: Profile Information (Existing) */}
                <div className="card profile-card">
                    <h3 className="card-header">Your Profile Details</h3>
                    <div className="profile-info">
                        <p><strong>Name:</strong> {currentUser.first_name} {currentUser.last_name}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                        <p><strong>Role:</strong> {role}</p>
                        <p><strong>Organization:</strong> {currentUser.organization || 'N/A'}</p> 
                    </div>
                </div>

                {/* CARD 2: Change Password Form (Existing) */}
                <div className="card password-card">
                    <h3 className="card-header">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="form-column">
                        
                        <div className="form-group">
                            <label htmlFor="old_password">Current Password</label>
                            <input
                                id="old_password"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="input-text"
                                disabled={submitting}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="new_password">New Password</label>
                            <input
                                id="new_password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-text"
                                disabled={submitting}
                                required
                                minLength="8"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="confirm_password">Confirm New Password</label>
                            <input
                                id="confirm_password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-text"
                                disabled={submitting}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting || newPassword !== confirmPassword}
                            className={`btn-primary ${submitting ? 'btn-disabled' : ''}`}
                        >
                            {submitting ? <><LoadingSpinner size="spinner-md" /> Changing...</> : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>

            {/* 🛑 MODAL INTEGRATION */}
            {fineAssignmentToPay && (
                <EmployeeFinePaymentModal 
                    assignment={fineAssignmentToPay}
                    onClose={() => setFineAssignmentToPay(null)}
                    onSuccessfulUpload={handleSuccessfulUpload}
                />
            )}

            {/* Inline CSS for Dashboard (Added table and status styles) */}
            <style>{`
                /* ... (Your existing CSS) ... */

                /* 🛑 NEW STYLES FOR FINE TABLE */
                .full-width-card { grid-column: 1 / -1; }
                .table-responsive { overflow-x: auto; }
                .data-table { width: 100%; border-collapse: collapse; }
                .table-header { background-color: #f3f4f6; }
                .table-th, .table-td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                .table-th-center, .table-td-center { text-align: center; }
                .table-text-bold { font-weight: 600; }
                .text-danger { color: #dc2626; }
                .text-info { color: #1d4ed8; }
                .text-success { color: #059669; }
                .text-center { text-align: center; }

                /* Status Badges */
                .status-badge { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
                .status-success { background-color: #d1fae5; color: #065f46; } /* Paid/Cleared */
                .status-alert { background-color: #fef3c7; color: #b45309; } /* Proof Submitted */
                .status-danger { background-color: #fee2e2; color: #991b1b; } /* Pending Proof / Denied */

                /* Fine Action Button */
                .btn-danger {
                    padding: 6px 12px; background-color: #dc2626; color: white; border: none; border-radius: 4px; 
                    cursor: pointer; font-weight: 600; transition: background-color 0.2s; font-size: 13px;
                }
                .btn-danger:hover { background-color: #b91c1c; }
                .btn-sm { padding: 4px 8px; font-size: 12px; }

                /* Ensure the existing button styles are respected */
                .btn-primary { 
                    padding: 10px 16px; background-color: #4f46e5; color: white; border: none; border-radius: 6px; 
                    cursor: pointer; font-weight: 600; transition: background-color 0.2s; 
                }
                .btn-primary:hover:not(.btn-disabled) { background-color: #4338ca; }
                .btn-disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </DashboardLayout>
    );
}