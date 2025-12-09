/* src/pages/AdminDashboard.jsx */
import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
// ⚠️ MISSING IMPORTS: You need to ensure these two are imported correctly
import { LoadingSpinner } from '../../layouts/DashboardLayout'; 
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics'; 

// --- Charting Library Imports (Must be installed) ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// --- Global Chart Setup ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Asset Status Distribution' },
    },
    scales: { y: { beginAtZero: true } }
};

// --- Metric Card Component (ADJUSTED FOR SIZE) ---
const MetricCard = ({ title, value, color }) => (
    <div className={`metric-card ${color}`} style={{ 
        // 🚨 PADDING REDUCED TO MAKE CARD SMALLER
        padding: '12px 8px', 
        borderRadius: '6px', // Slightly smaller border radius for compact look
        color: '#fff', 
        textAlign: 'center',
        // Simple color mapping
        backgroundColor: color === 'blue' ? '#4f46e5' : 
                          color === 'green' ? '#10b981' : 
                          color === 'yellow' ? '#f59e0b' : 
                          '#ef4444', 
        // Ensure text doesn't wrap unnecessarily
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    }}>
        {/* 🚨 FONT SIZE REDUCED */}
        <h3 style={{ fontSize: '1rem', margin: '0 0 5px 0', textOverflow: 'ellipsis' }}>{title}</h3>
        {/* 🚨 FONT SIZE REDUCED */}
        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{value}</p>
    </div>
);

// --- Main Dashboard Component ---
export default function AdminDashboard() {
    // ⭐ GET REAL DATA
    const { metrics, loading, error } = useDashboardMetrics();
    
    if (loading) {
        return <DashboardLayout><div className="loading-screen"><LoadingSpinner size="spinner-lg" /></div></DashboardLayout>;
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="alert-error" style={{padding: '20px'}}>
                    Error loading dashboard metrics. Please check the console.
                </div>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <div className="dashboard-content" style={{ padding: '20px 0' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '30px', color: '#1f2937' }}>
                    {metrics.organizationName || 'Organization'} Metrics & Overview
                </h1>
                
                {/* 1. Metric Cards Grid - The grid itself is still 4 columns */}
                <div className="metric-cards-container" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '15px', // Reduced gap slightly
                    marginBottom: '40px' 
                }}>
                    <MetricCard title="Total Assets" value={metrics.totalAssets} color="red" />
                    <MetricCard title="Assigned Assets" value={metrics.assetsAssigned} color="blue" />
                    <MetricCard title="Available Assets" value={metrics.assetsAvailable} color="green" />
                    <MetricCard title="Overdue Assignments" value={metrics.overdueAssignments} color="yellow" /> 
                </div>

                {/* 2. Chart Card */}
                <div className="card chart-card" style={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    height: '450px' 
                }}>
                    {metrics.chartData ? (
                        <Bar data={metrics.chartData} options={chartOptions} />
                    ) : (
                        <p style={{textAlign: 'center', marginTop: '100px'}}>No data available for chart.</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}