// // AdminDashboard.jsx (Correct)
// import { useEffect, useState } from "react";
// import { getOrgMetrics } from "../api/api";

// export default function AdminDashboard({ onLogout }) {
//   const [metrics, setMetrics] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchMetrics = async () => {
//       try {
//         const { data } = await getOrgMetrics();
//         setMetrics(data);
//       } catch (err) {
//         console.error("Error fetching metrics:", err);
//         // The interceptor should handle 401s, but this catch block is good for other errors
//         setError(
//           err.response?.data?.detail ||
//           "Error fetching data. Please check your connection."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMetrics();
//   }, []);

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="text-red-500 font-bold">{error}</p>;

//   return (
//     <div className="p-6">
//       <button
//         onClick={onLogout}
//         className="bg-red-500 text-white p-2 rounded mb-4 hover:bg-red-600"
//       >
//         Logout
//       </button>

//       <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
//       <p><strong>Organization:</strong> {metrics.organization_name}</p>
//       <p><strong>Total Assets:</strong> {metrics.total_assets}</p>

//       <h2 className="mt-4 font-bold">Assets by Status:</h2>
//       <ul>
//         {Object.entries(metrics.metrics_by_status).map(([status, count]) => (
//           <li key={status}>{status}: {count}</li>
//         ))}
//       </ul>

//       <h2 className="mt-4 font-bold">Assets by Category:</h2>
//       <ul>
//         {Object.entries(metrics.metrics_by_category).map(([cat, count]) => (
//           <li key={cat}>{cat}: {count}</li>
//         ))}
//       </ul>

//       <p className="mt-4"><strong>Overdue Assignments:</strong> {metrics.overdue_assignments}</p>

//       {/* Later: Add links/buttons to Users, Assets, Departments */}
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { getOrgMetrics } from "../api/api";

// --- Placeholder Components for Admin Navigation ---

const DashboardMetrics = ({ onLogout }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await getOrgMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError(
          err.response?.data?.detail ||
          "Failed to fetch metrics. Your session may have expired."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <p className="text-center text-lg mt-8">Loading Organization Metrics...</p>;
  if (error) return <p className="text-red-500 font-bold p-8">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Metrics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Assets" value={metrics.total_assets} color="bg-blue-100" />
        <MetricCard title="Total Users" value={metrics.total_users || '...'} color="bg-green-100" />
        <MetricCard title="Overdue Assignments" value={metrics.overdue_assignments} color="bg-red-100" />
        <MetricCard title="Organization Name" value={metrics.organization_name} color="bg-purple-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsList title="Assets by Status" data={metrics.metrics_by_status} />
        <StatsList title="Assets by Category" data={metrics.metrics_by_category} />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color }) => (
    <div className={`p-5 rounded-xl shadow-lg ${color}`}>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
);

const StatsList = ({ title, data }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">{title}</h2>
        <ul className="space-y-2">
            {Object.entries(data).map(([key, count]) => (
                <li key={key} className="flex justify-between items-center text-gray-600">
                    <span className="font-medium">{key}</span>
                    <span className="text-lg font-bold text-blue-600">{count}</span>
                </li>
            ))}
        </ul>
    </div>
);

const UsersPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Manage Users (CRUD)</h1><p>User list, create, edit, delete functionality goes here.</p></div>;
const DepartmentsPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Manage Departments (CRUD)</h1><p>Department list, create, edit, delete functionality goes here.</p></div>;
const AssetsPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Manage Assets (CRUD)</h1><p>Asset list, create, edit, delete functionality goes here.</p></div>;
const CategoriesPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Manage Categories (CRUD)</h1><p>Category list, create, edit, delete functionality goes here.</p></div>;
const AssignmentsPage = () => <div className="p-8"><h1 className="text-3xl font-bold">All Assignments</h1><p>Full assignment history and management goes here.</p></div>;
const OrgSettingsPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Organization Settings</h1><p>Configuration and update form goes here.</p></div>;


// Main Admin Dashboard Component
export default function AdminDashboard({ onLogout }) {
  const [view, setView] = useState('dashboard'); // State for internal routing

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return <DashboardMetrics onLogout={onLogout} />;
      case 'users': return <UsersPage />;
      case 'departments': return <DepartmentsPage />;
      case 'assets': return <AssetsPage />;
      case 'categories': return <CategoriesPage />;
      case 'assignments': return <AssignmentsPage />;
      case 'orgSettings': return <OrgSettingsPage />;
      default: return <DashboardMetrics onLogout={onLogout} />;
    }
  };

  const getMenuItemClasses = (currentView) => 
    `p-3 rounded-lg text-left w-full transition font-semibold ${
      view === currentView 
        ? 'bg-blue-700 text-white' 
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4 shadow-xl flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-600 mb-8 border-b pb-2">Admin Panel</h2>
          <nav className="space-y-2">
            <button onClick={() => setView('dashboard')} className={getMenuItemClasses('dashboard')}>
              Dashboard
            </button>
            <button onClick={() => setView('users')} className={getMenuItemClasses('users')}>
              Users (CRUD)
            </button>
            <button onClick={() => setView('departments')} className={getMenuItemClasses('departments')}>
              Departments (CRUD)
            </button>
            <button onClick={() => setView('assets')} className={getMenuItemClasses('assets')}>
              Assets (CRUD)
            </button>
            <button onClick={() => setView('categories')} className={getMenuItemClasses('categories')}>
              Categories (CRUD)
            </button>
            <button onClick={() => setView('assignments')} className={getMenuItemClasses('assignments')}>
              Assignments (All)
            </button>
            <button onClick={() => setView('orgSettings')} className={getMenuItemClasses('orgSettings')}>
              Org Settings
            </button>
          </nav>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="mt-6 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}