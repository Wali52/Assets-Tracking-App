import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useRouter } from "../context/RouterContext.jsx";
import "./dashboard.css";

// ------------------ Loading Spinner ------------------
const LoadingSpinner = ({ size = "spinner-md" }) => (
  <svg className={`spinner ${size}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="spinner-circle" cx="12" cy="12" r="10" strokeWidth="4"></circle>
    <path
      className="spinner-path"
      // 💡 FIX APPLIED HERE: The d attribute is now a single continuous string
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// ------------------ Loading Screen ------------------
export const LoadingScreen = () => (
  <div className="loading-screen">
    <LoadingSpinner size="spinner-lg" />
    <span className="loading-text">Loading Application...</span>
  </div>
);

// ------------------ Sidebar Component ------------------
const Sidebar = () => {
  const { role, currentUser, logout, ROLE_ADMIN } = useAuth();
  const { navigate } = useRouter();

  if (!currentUser) return null;

  const isActive = (path) => window.location.hash.slice(1) === path;

  const adminMenu = [
  { name: "Dashboard", path: "/admin" },
  { name: "Assets", path: "/admin/assets" },
  { name: "Assignments", path: "/admin/assignments" },
  { name: "Employees", path: "/admin/employees" },
  { name: "Categories", path: "/admin/categories" },
  { name: "Departments", path: "/admin/departments" },
];


  const employeeMenu = [
    { name: "My Dashboard", path: "/employee" },
    { name: "My Assets", path: "/employee/assets" },
  ];

    // 💡 THE CHANGE: Fallback to checking the exact string 'Admin' 
    // or using toLowerCase() if the ROLE_ADMIN constant is unreliable or mismatched.
    // We are temporarily checking if the role is 'Admin' as a direct string 
    // if ROLE_ADMIN is undefined or incorrect.

    // A safer, more robust check:
    const isAdmin = (role?.toLowerCase() === 'admin'); 
    
    // Use the robust check if ROLE_ADMIN is not reliably provided by useAuth
    // Otherwise, use the original line: const menu = role === ROLE_ADMIN ? adminMenu : employeeMenu;
    const menu = isAdmin ? adminMenu : employeeMenu; 
    
    // If you are certain ROLE_ADMIN is provided by useAuth and you fixed the casing in useAuth:
    // const menu = role === ROLE_ADMIN ? adminMenu : employeeMenu;

  return (
    <aside className="sidebar">
      {/* Branding */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">AssetTracker</h2>
        <span className="sidebar-role">{role}</span>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-menu">
        {menu.map((item) => (
          <div
            key={item.name}
            className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            {item.name}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          {currentUser?.first_name || currentUser?.email}
        </div>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </aside>
  );
};

// ------------------ Layout ------------------
const DashboardLayout = ({ children }) => (
  <div className="layout-container">
    <Sidebar />
    <main className="layout-main">{children}</main>
  </div>
);

export default DashboardLayout;
export { LoadingSpinner };