import React from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import { useApiData } from "../hooks/useApiData.js";
import "../styles/adminassets.css";

const AdminAssets = () => {
    const { data: assets, loading, error, refetch } = useApiData("assets/");

    const assetColumns = [
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
                        : "status-gray";

                return <span className={`status-badge ${color}`}>{row.status}</span>;
            },
        },
        { header: "Created By", accessor: "created_by_user_email" },

        {
            header: "Actions",
            cell: (row) => (
                <button
                    onClick={() => console.log("Editing asset:", row.id)}
                    className="btn-edit"
                >
                    Edit
                </button>
            ),
        },
    ];

    const actions = (
        <button
            onClick={() => console.log("Open Add Asset modal")}
            className="btn-primary"
        >
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
