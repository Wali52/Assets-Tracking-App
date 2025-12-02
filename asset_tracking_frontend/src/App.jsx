// App.jsx (Correct)
import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  // Check for existing access token and role on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userRole = localStorage.getItem("role");
    if (token && userRole) {
      setIsLoggedIn(true);
      setRole(userRole);
    }
  }, []);

  // Called after login
  const handleLogin = () => {
    const userRole = localStorage.getItem("role");
    setIsLoggedIn(true);
    setRole(userRole);
  };

  // Logout: clear tokens and reset state
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setRole(null);
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  if (role === "Admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  } else {
    return <EmployeeDashboard onLogout={handleLogout} />;
  }
}