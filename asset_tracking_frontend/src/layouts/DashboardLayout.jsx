import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useRouter } from '../context/RouterContext.jsx';
import "./dashboard.css"; // Add normal CSS

// --- Loading Spinner ---
const LoadingSpinner = ({ size = "spinner-md" }) => (
  <svg
    className={`spinner ${size}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="spinner-circle"
      cx="12"
      cy="12"
      r="10"
      strokeWidth="4"
    ></circle>
    <path
      className="spinner-path"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
         5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 
         5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Loading Screen ---
export const LoadingScreen = () => (
  <div className="loading-screen">
    <LoadingSpinner size="spinner-lg" />
    <span className="loading-text">Loading Application...</span>
  </div>
);

// --- Navbar ---
const Navbar = () => {
  const { currentUser, role, logout, ROLE_ADMIN } = useAuth();
  const { navigate } = useRouter();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!currentUser) return null;

  const navItems =
    role === ROLE_ADMIN
      ? [
          { name: "Dashboard", path: "/admin" },
          { name: "Assets", path: "/admin/assets" },
          { name: "Users", path: "/admin/users" },
        ]
      : [
          { name: "My Dashboard", path: "/employee" },
          { name: "My Assets", path: "/employee/assets" },
        ];

  const isActive = (path) =>
    window.location.hash.slice(1) === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Branding */}
        <div className="navbar-brand">
          AssetTracker
          <span className="role-badge">{role}</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          {navItems.map((item) => (
            <a
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`nav-link ${isActive(item.path) ? "active" : ""}`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          <span className="welcome-text">
            Welcome, {currentUser?.first_name || currentUser?.email}
          </span>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
};

// --- Dashboard Layout ---
const DashboardLayout = ({ children }) => (
  <div className="dashboard-container">
    <Navbar />
    <main className="dashboard-main">{children}</main>
  </div>
);

export default DashboardLayout;
export { LoadingSpinner };
