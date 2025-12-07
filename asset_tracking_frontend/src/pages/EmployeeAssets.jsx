// import React from 'react';
// import DashboardLayout, { LoadingSpinner } from '../layouts/DashboardLayout.jsx';
// import DataTable from '../components/DataTable.jsx';
// import { useApiData } from '../hooks/useApiData.js';
// import { useAuth } from '../context/AuthContext.jsx';

// const EmployeeAssets = () => {
//     const { currentUser, isAuthenticated, loading: authLoading } = useAuth();

//     const { 
//         data: assignedAssets, 
//         loading: assetsLoading, 
//         error 
//     } = useApiData('assets', 'assigned_to_user_id');

//     const assetColumns = [
//         { header: 'Asset Name', accessor: 'name' },
//         { header: 'Serial Number', accessor: 'serial_number' },
//         { header: 'Category', accessor: 'category' },
//         { 
//             header: 'Status', 
//             accessor: 'status', 
//             cell: (asset) => {
//                 const status = asset.status;
//                 const colorClass = status === 'Assigned' ? 'status-assigned' :
//                                    status === 'In Repair' ? 'status-repair' :
//                                    'status-default';
//                 return <span className={`status-badge ${colorClass}`}>{status}</span>;
//             }
//         },
//         { header: 'Assigned Date', accessor: 'assignment_date' },
//         { 
//             header: 'Actions', 
//             cell: (asset) => (
//                 <button 
//                     onClick={() => console.log(`Requesting return for asset ${asset.id}`)}
//                     className="btn-request"
//                 >
//                     Request Return
//                 </button>
//             )
//         },
//     ];

//     if (authLoading || assetsLoading) {
//         return (
//             <div className="loading-container">
//                 <LoadingSpinner />
//                 <span className="loading-text">Loading your assets...</span>
//             </div>
//         );
//     }

//     const userName = `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || 'Employee';

//     return (
//         <DashboardLayout>
//             <h1 className="page-title">My Assigned Assets</h1>
//             <p className="page-subtitle">
//                 Showing all equipment currently assigned to {userName}.
//             </p>
//             <DataTable 
//                 title={`Assets for ${userName}`}
//                 data={assignedAssets}
//                 columns={assetColumns}
//                 loading={false} // Loading handled above
//                 error={error}
//             />

//             {/* Inline CSS */}
//             <style>{`
//                 .page-title {
//                     font-size: 28px;
//                     font-weight: 700;
//                     color: #111827;
//                     margin-bottom: 16px;
//                 }

//                 .page-subtitle {
//                     font-size: 14px;
//                     color: #4b5563;
//                     margin-bottom: 24px;
//                 }

//                 .status-badge {
//                     display: inline-flex;
//                     padding: 2px 8px;
//                     font-size: 12px;
//                     font-weight: 600;
//                     border-radius: 9999px;
//                     line-height: 1.2;
//                 }

//                 .status-assigned {
//                     background-color: #dbeafe; /* blue-100 */
//                     color: #1e3a8a; /* blue-800 */
//                 }

//                 .status-repair {
//                     background-color: #fef3c7; /* yellow-100 */
//                     color: #92400e; /* yellow-800 */
//                 }

//                 .status-default {
//                     background-color: #e5e7eb; /* gray-100 */
//                     color: #374151; /* gray-800 */
//                 }

//                 .btn-request {
//                     font-size: 12px;
//                     font-weight: 500;
//                     color: #ffffff;
//                     background-color: #ef4444; /* red-500 */
//                     border: none;
//                     border-radius: 6px;
//                     padding: 4px 10px;
//                     cursor: pointer;
//                     box-shadow: 0 1px 2px rgba(0,0,0,0.1);
//                     transition: background-color 0.2s;
//                 }

//                 .btn-request:hover {
//                     background-color: #dc2626; /* red-600 */
//                 }

//                 .loading-container {
//                     display: flex;
//                     justify-content: center;
//                     align-items: center;
//                     height: 100vh;
//                     background-color: #f9fafb; /* gray-50 */
//                 }

//                 .loading-text {
//                     margin-left: 12px;
//                     font-size: 16px;
//                     color: #4f46e5; /* indigo-700 */
//                 }
//             `}</style>
//         </DashboardLayout>
//     );
// };

// export default EmployeeAssets;

import React from 'react';
import DashboardLayout, { LoadingSpinner } from '../layouts/DashboardLayout.jsx';
import DataTable from '../components/DataTable.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { useAuth } from '../context/AuthContext.jsx';

const EmployeeAssets = () => {
    const { currentUser, isAuthenticated, loading: authLoading, role } = useAuth();

    const userId = currentUser?.id;
    const endpoint = role === 'Employee' && userId ? `assignments/?user=${userId}` : 'assets/';

    const { data: assignedAssets, loading: assetsLoading, error } = useApiData(endpoint);

    const assetColumns = [
        { header: 'Asset Name', accessor: 'name' },
        { header: 'Serial Number', accessor: 'serial_number' },
        { header: 'Category', accessor: 'category' },
        { 
            header: 'Status', 
            accessor: 'status', 
            cell: (asset) => {
                const status = asset.status;
                const colorClass = status === 'Assigned' ? 'status-assigned' :
                                   status === 'In Repair' ? 'status-repair' :
                                   'status-default';
                return <span className={`status-badge ${colorClass}`}>{status}</span>;
            }
        },
        { header: 'Assigned Date', accessor: 'assignment_date' },
        { 
            header: 'Actions', 
            cell: (asset) => (
                <button 
                    onClick={() => console.log(`Requesting return for asset ${asset.id}`)}
                    className="btn-request"
                >
                    Request Return
                </button>
            )
        },
    ];

    if (authLoading || assetsLoading) {
        return (
            <div className="loading-container">
                <LoadingSpinner />
                <span className="loading-text">Loading your assets...</span>
            </div>
        );
    }

    const userName = `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || 'Employee';

    return (
        <DashboardLayout>
            <h1 className="page-title">My Assigned Assets</h1>
            <p className="page-subtitle">
                Showing all equipment currently assigned to {userName}.
            </p>
            <DataTable 
                title={`Assets for ${userName}`}
                data={assignedAssets}
                columns={assetColumns}
                loading={false} // Loading handled above
                error={error}
            />

            {/* Inline CSS */}
            <style>{`
                .page-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 16px;
                }

                .page-subtitle {
                    font-size: 14px;
                    color: #4b5563;
                    margin-bottom: 24px;
                }

                .status-badge {
                    display: inline-flex;
                    padding: 2px 8px;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 9999px;
                    line-height: 1.2;
                }

                .status-assigned {
                    background-color: #dbeafe; /* blue-100 */
                    color: #1e3a8a; /* blue-800 */
                }

                .status-repair {
                    background-color: #fef3c7; /* yellow-100 */
                    color: #92400e; /* yellow-800 */
                }

                .status-default {
                    background-color: #e5e7eb; /* gray-100 */
                    color: #374151; /* gray-800 */
                }

                .btn-request {
                    font-size: 12px;
                    font-weight: 500;
                    color: #ffffff;
                    background-color: #ef4444; /* red-500 */
                    border: none;
                    border-radius: 6px;
                    padding: 4px 10px;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    transition: background-color 0.2s;
                }

                .btn-request:hover {
                    background-color: #dc2626; /* red-600 */
                }

                .loading-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f9fafb; /* gray-50 */
                }

                .loading-text {
                    margin-left: 12px;
                    font-size: 16px;
                    color: #4f46e5; /* indigo-700 */
                }
            `}</style>
        </DashboardLayout>
    );
};

export default EmployeeAssets;
