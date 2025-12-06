/* src/layouts/DashboardLayout.jsx */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axiosInstance';
import endpoints from '../api/endpoints';

export default function DashboardLayout({ children }) {
const { logout, role } = useAuth() || {};
const [message, setMessage] = useState('Welcome!');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const testMetrics = async () => {
setLoading(true);
setError('');
setMessage('Loading metrics...');
try {
const res = await axios.get(endpoints.metrics);
setMessage(`Organization: ${res.data.organization_name}, Total assets: ${res.data.total_assets}`);
} catch (err) {
setError('Failed to load metrics');
setMessage(err.response?.data?.detail || err.message || 'Error');
} finally {
setLoading(false);
}
};

return ( <div className="app-container"> <header className="dashboard-header"> <div className="header-content"> <h1 className="header-title">Asset Management - {role || 'User'}</h1>
<div style={{ display: 'flex', gap: 12 }}> <button className="btn btn-success" onClick={testMetrics} disabled={loading}>
{loading ? 'Loading...' : 'Refresh Metrics'} </button> <button className="btn btn-danger" onClick={logout}>Log Out</button> </div> </div> </header>


  <main className="dashboard-main">
    <div className="dashboard-layout-grid">
      <div className={`api-status-box ${error ? 'status-error' : 'status-info'}`}>
        <strong style={{ marginRight: 8 }}>Metrics:</strong> {message}
      </div>

      {children}
    </div>
  </main>
</div>


);
}
