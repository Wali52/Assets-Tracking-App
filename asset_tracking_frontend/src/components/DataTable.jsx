import React from 'react';
import { LoadingSpinner } from '../layouts/DashboardLayout.jsx';
import "./datatable.css"; // Add your CSS file

const DataTable = ({ title, data, columns, loading, error, actions = [] }) => {
    return (
        <div className="datatable-container">
            <div className="datatable-header">
                <h2 className="datatable-title">{title}</h2>
                <div className="datatable-actions">
                    {actions}
                </div>
            </div>

            {loading && (
                <div className="datatable-loading">
                    <LoadingSpinner size="h-6 w-6" /> Fetching data...
                </div>
            )}

            {error && (
                <div className="datatable-error">
                    Error: {error}
                </div>
            )}

            {!loading && !error && (
                <div className="datatable-table-wrapper">
                    <table className="datatable-table">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index}>
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="datatable-empty">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, itemIndex) => (
                                    <tr key={item.id || itemIndex}>
                                        {columns.map((col, colIndex) => (
                                            <td key={colIndex}>
                                                {col.cell ? col.cell(item) : item[col.accessor]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DataTable;
