import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LoadingScreen } from './layouts/DashboardLayout.jsx';
import { RouterProvider, useRouter } from './context/RouterContext.jsx';

// --- Page Imports ---
import Login from './pages/Login.jsx'; 
import AdminDashboard from './pages/admin/AdminDashboard.jsx'; // Admin Dashboard page
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'; // Employee Dashboard page
import AdminAssets from './pages/admin/AdminAssets.jsx';       // Moved to admin folder
import AdminEmployees from './pages/admin/AdminEmployees.jsx'; // ✅ CORRECTED: Using the actual file name AdminEmployees.jsx
import EmployeeAssets from './pages/EmployeeAssets.jsx';       // Employee Assets page
import AdminAssignments from './pages/admin/AdminAssignments.jsx'; // Moved to admin folder
import AdminCategories from './pages/admin/AdminCategories.jsx';   // Moved to admin folder
import AdminDepartments from './pages/admin/AdminDepartments.jsx'; // Department Management Page

// --- Protected Route ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, role, loading } = useAuth();
    const { navigate } = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/login');
            } else if (allowedRoles && !allowedRoles.includes(role)) {
                navigate(role === 'Admin' ? '/admin' : '/employee');
            }
        }
    }, [loading, isAuthenticated, role, navigate, allowedRoles]);

    if (loading || !isAuthenticated) return <LoadingScreen />;

    return children;
};

// --- Home Redirect ---
const HomeRedirect = () => {
    const { isAuthenticated, role, loading } = useAuth();
    const { navigate } = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/login');
            } else {
                navigate(role === 'Admin' ? '/admin' : '/employee');
            }
        }
    }, [loading, isAuthenticated, role, navigate]);

    return <LoadingScreen />;
};

// --- Not Found Page ---
const NotFound = () => (
    <div style={{ minHeight: '100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#f9fafb', fontFamily:'Arial, sans-serif', textAlign:'center' }}>
        <h1 style={{ fontSize:'6rem', fontWeight:'700', color:'#4f46e5' }}>404</h1>
        <p style={{ fontSize:'1.25rem', color:'#374151', marginTop:'0.5rem' }}>Page Not Found</p>
        <button onClick={() => window.location.hash = '/'} style={{ marginTop:'1.5rem', padding:'0.5rem 1rem', fontSize:'1rem', fontWeight:'500', color:'#fff', backgroundColor:'#4f46e5', border:'none', borderRadius:'0.375rem', cursor:'pointer' }}>Go to Homepage</button>
    </div>
);

// --- Main Router ---
const MainRouter = () => {
    const { currentPath } = useRouter();
    const ROLE_ADMIN = 'Admin';
    const ROLE_EMPLOYEE = 'Employee';

    switch (currentPath) {
        case '/': return <HomeRedirect />;
        case '/login': return <Login />;
        case '/admin': return <ProtectedRoute allowedRoles={[ROLE_ADMIN]}><AdminDashboard /></ProtectedRoute>;
        case '/admin/assets': return <ProtectedRoute allowedRoles={[ROLE_ADMIN]}><AdminAssets /></ProtectedRoute>;
        case '/admin/employees': return <ProtectedRoute allowedRoles={[ROLE_ADMIN]}><AdminEmployees /></ProtectedRoute>; // ✅ USING AdminEmployees COMPONENT
        case '/admin/categories': return <ProtectedRoute allowedRoles={[ROLE_ADMIN]}><AdminCategories /></ProtectedRoute>;
        case '/admin/assignments': return <ProtectedRoute allowedRoles={[ROLE_ADMIN]}><AdminAssignments /></ProtectedRoute>;
        // 🆕 Departments route added in the correct sequential order
        case '/admin/departments': return <ProtectedRoute allowedRoles={[ROLE_ADMIN]}><AdminDepartments /></ProtectedRoute>; 
        case '/employee': return <ProtectedRoute allowedRoles={[ROLE_EMPLOYEE]}><EmployeeDashboard /></ProtectedRoute>;
        case '/employee/assets': return <ProtectedRoute allowedRoles={[ROLE_EMPLOYEE]}><EmployeeAssets /></ProtectedRoute>;
        default: return <NotFound />;
    }
};

// --- App Root ---
export default function App() {
    // Do NOT clear tokens here anymore. Only logout will remove them.

    return (
        <AuthProvider>
            <RouterProvider>
                <MainRouter />
            </RouterProvider>
        </AuthProvider>
    );
}