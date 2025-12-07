import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import DataTable from '../components/DataTable.jsx';
import { useApiData } from '../hooks/useApiData.js';
import "../styles/adminassets.css";

const AdminAssets = () => {
    const { data: assets, loading, error, refetch } = useApiData('assets/');

    const assetColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Asset Tag', accessor: 'asset_tag' },
        { header: 'Asset Name', accessor: 'name' },
        { header: 'Category', accessor: 'category_name' },
        { header: 'Department', accessor: 'department_name' },
        { 
            header: 'Status', 
            accessor: 'status', 
            cell: (asset) => {
                const status = asset.status;
                let statusClass = '';
                if (status === 'Assigned') statusClass = 'status-blue';
                else if (status === 'Available') statusClass = 'status-green';
                else if (status === 'In Repair') statusClass = 'status-yellow';
                else statusClass = 'status-gray';
                return <span className={`status-badge ${statusClass}`}>{status}</span>;
            }
        },
        { header: 'Created By', accessor: 'created_by_user_email' },
        { 
            header: 'Actions', 
            cell: (asset) => (
                <button onClick={() => console.log(`Editing asset ${asset.id}`)} className="btn-edit">
                    Edit
                </button>
            )
        },
    ];

    const actions = (
        <button onClick={() => console.log('Open Add Asset Modal')} className="btn-primary">
            + Add Asset
        </button>
    );

    return (
        <DashboardLayout>
            <h1 className="page-title">Asset Inventory</h1>

            <DataTable 
                title="All Organizational Assets"
                data={assets}
                columns={assetColumns}
                loading={loading}
                error={error}
                actions={actions}
            />
        </DashboardLayout>
    );
};

export default AdminAssets;
