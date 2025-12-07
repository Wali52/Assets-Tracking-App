import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import DataTable from '../components/DataTable.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { useAuth } from '../context/AuthContext.jsx';

const AdminUsers = () => {
    const { ROLE_ADMIN } = useAuth();
    const { data: users, loading, error, refetch } = useApiData('users/');

    const userColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', cell: (user) => `${user.first_name} ${user.last_name}` },
        { header: 'Email', accessor: 'email' },
        { 
            header: 'Role', 
            accessor: 'role',
            cell: (user) => {
                const role = user.role;
                const colorClass = role === ROLE_ADMIN 
                    ? 'role-admin' 
                    : 'role-employee';
                return <span className={`role-badge ${colorClass}`}>{role}</span>;
            }
        },
        { 
            header: 'Actions', 
            cell: (user) => (
                <button 
                    onClick={() => console.log(`Viewing user ${user.id}`)}
                    className="btn-edit"
                >
                    Edit Role
                </button>
            )
        },
    ];

    const actions = (
        <button 
            onClick={() => console.log('Open Add User Modal')}
            className="btn-add"
        >
            + Add User
        </button>
    );

    return (
        <DashboardLayout>
            <h1 className="page-title">User Management</h1>
            <DataTable 
                title="System Users"
                data={users}
                columns={userColumns}
                loading={loading}
                error={error}
                actions={actions}
            />

            {/* Inline CSS */}
            <style>{`
                .page-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 24px;
                }

                .role-badge {
                    display: inline-flex;
                    padding: 2px 8px;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 9999px;
                    line-height: 1.2;
                }

                .role-admin {
                    background-color: #fee2e2; /* red-100 */
                    color: #b91c1c; /* red-800 */
                }

                .role-employee {
                    background-color: #e0e7ff; /* indigo-100 */
                    color: #3730a3; /* indigo-800 */
                }

                .btn-edit {
                    font-size: 14px;
                    font-weight: 500;
                    color: #4f46e5; /* indigo-600 */
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px 6px;
                }

                .btn-edit:hover {
                    color: #312e81; /* indigo-900 */
                }

                .btn-add {
                    font-size: 14px;
                    font-weight: 500;
                    color: #ffffff;
                    background-color: #4f46e5; /* indigo-600 */
                    border: none;
                    border-radius: 6px;
                    padding: 6px 12px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .btn-add:hover {
                    background-color: #3730a3; /* indigo-700 */
                }
            `}</style>
        </DashboardLayout>
    );
};

export default AdminUsers;
