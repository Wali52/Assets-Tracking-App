// // import React, { useState, useEffect, useCallback } from 'react';
// // import { LogOut, LayoutDashboard, KeyRound, User, ChevronRight, RefreshCw, XCircle } from 'lucide-react';

// // // --- MOCK CONSTANTS & API SIMULATION ---
// // const MOCK_API_URL = 'http://mock-backend/api/v1/';
// // const MOCK_TOKENS = {
// //   admin: {
// //     accessToken: 'admin_access_token_12345',
// //     refreshToken: 'admin_refresh_token_abcde',
// //     role: 'Admin',
// //   },
// //   employee: {
// //     accessToken: 'employee_access_token_67890',
// //     refreshToken: 'employee_refresh_token_fghij',
// //     role: 'Employee',
// //   },
// // };

// // // Global state to simulate token expiration and refresh logic
// // let isRefreshing = false;
// // let failedQueue = [];

// // // Function to simulate the actual network request (fetch/axios call)
// // // This will simulate success, 401 failure, and the need for refresh.
// // const mockRequest = async (config) => {
// //   await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency

// //   const token = localStorage.getItem('accessToken');
// //   const role = localStorage.getItem('role');

// //   // --- 1. Simulate Token Expiration (401) ---
// //   // In a real app, the backend verifies the token and returns 401.
// //   // Here, we simulate expiration after 3 successful requests.
// //   if (config.url === 'protected-resource/' && config.method === 'GET') {
// //     let callCount = parseInt(localStorage.getItem('callCount') || '0', 10);
// //     localStorage.setItem('callCount', callCount + 1);

// //     if (callCount >= 3) {
// //       console.log('MOCK API: Simulating 401 UNAUTHORIZED for resource request.');
// //       localStorage.setItem('callCount', '0'); // Reset counter for next cycle
// //       return Promise.reject({ response: { status: 401, message: 'Access token expired.' }, config });
// //     }
// //   }

// //   // --- 2. Simulate successful request (or refresh token failure) ---
// //   if (!token) {
// //     return Promise.reject({ response: { status: 403, message: 'No token found.' } });
// //   }

// //   // Success payload
// //   const responseData = {
// //     'auth/token/': { access: MOCK_TOKENS[role.toLowerCase()].accessToken, refresh: MOCK_TOKENS[role.toLowerCase()].refreshToken, role },
// //     'auth/token/refresh/': { access: MOCK_TOKENS[role.toLowerCase()].accessToken }, // New access token
// //     'protected-resource/': { message: `Data loaded successfully for ${role}. Call count: ${localStorage.getItem('callCount')}` },
// //   };

// //   return Promise.resolve({ data: responseData[config.url], status: 200, headers: { Authorization: `Bearer ${token}` } });
// // };


// // // --- CUSTOM API INSTANCE IMPLEMENTATION (Mimicking axiosConfig.js) ---

// // // 1. Refresh Token Function
// // const refreshAccessToken = async () => {
// //   const refreshToken = localStorage.getItem("refreshToken");
// //   if (!refreshToken) return null;

// //   try {
// //     const res = await mockRequest({
// //       method: 'POST',
// //       url: 'auth/token/refresh/',
// //       data: { refresh: refreshToken },
// //     });

// //     localStorage.setItem("accessToken", res.data.access);
// //     return res.data.access;
// //   } catch (err) {
// //     // Force logout on refresh failure (refreshToken is invalid)
// //     console.error('REFRESH FAILED. Forcing logout.', err);
// //     localStorage.clear();
// //     window.location.reload();
// //     return null;
// //   }
// // };

// // // 2. Request Wrapper function (Mimics api.get/post/put/delete)
// // const api = {
// //   // We only implement 'get' for demonstration, but all methods would use this wrapper
// //   get: async (url, config = {}) => {
// //     const originalRequest = { url, method: 'GET', ...config, _retry: false };

// //     // --- Request Interceptor Logic ---
// //     const token = localStorage.getItem("accessToken");
// //     if (token) originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };

// //     // --- Main Request Logic ---
// //     const makeRequest = async (requestConfig) => {
// //       try {
// //         // This is where the actual network call happens
// //         const response = await mockRequest(requestConfig);
// //         return response;
// //       } catch (error) {
// //         // --- Response Interceptor Logic (401 Handling) ---
// //         const status = error.response?.status;
// //         const original = error.config;

// //         // Check for 401 Unauthorized and ensure we haven't already retried
// //         if (status === 401 && !original._retry) {
// //           original._retry = true;

// //           if (isRefreshing) {
// //             // If already refreshing, queue the request
// //             return new Promise((resolve, reject) => {
// //               failedQueue.push({ resolve, reject, original });
// //             });
// //           }

// //           // Start refresh process
// //           isRefreshing = true;

// //           const newToken = await refreshAccessToken();
// //           isRefreshing = false;

// //           // Process the queue with the new token
// //           failedQueue.forEach(p => {
// //             p.original.headers.Authorization = `Bearer ${newToken}`;
// //             p.resolve(api.get(p.original.url, p.original)); // Retry
// //           });
// //           failedQueue = [];

// //           if (newToken) {
// //             // Retry the original request with the new token
// //             original.headers.Authorization = `Bearer ${newToken}`;
// //             return api.get(original.url, original);
// //           }
// //         }
// //         return Promise.reject(error);
// //       }
// //     };

// //     return makeRequest(originalRequest);
// //   },

// //   // Mock login function (external to the interceptor flow, as in api.js)
// //   login: async (username, password) => {
// //     // In a real app, this posts to /auth/token/
// //     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate login latency

// //     const inputUser = username.trim().toLowerCase();
    
// //     // Determine which mock role to use for token retrieval:
// //     // Any username logs in. If it's "admin", they get the Admin role.
// //     // Otherwise, they default to the Employee role.
// //     const mockRole = inputUser === 'admin' ? 'admin' : 'employee';

// //     // The logic below ensures that even if inputUser is "john.doe",
// //     // we fetch the tokens for the 'employee' mock role, allowing successful login.
// //     const tokens = MOCK_TOKENS[mockRole];
// //     localStorage.setItem("accessToken", tokens.accessToken);
// //     localStorage.setItem("refreshToken", tokens.refreshToken);
// //     localStorage.setItem("role", tokens.role); // Role will be 'Admin' or 'Employee'
// //     localStorage.setItem('callCount', '0'); // Initialize call counter
    
// //     // Successful login returns the mock role's tokens
// //     return { status: 200, data: { ...tokens } };
// //   }
// // };


// // // --- UI COMPONENTS ---

// // const Card = ({ children, title }) => (
// //   <div className="p-6 bg-white shadow-xl rounded-xl w-full max-w-lg transition-all duration-300 hover:shadow-2xl">
// //     {title && <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">{title}</h2>}
// //     {children}
// //   </div>
// // );

// // // LoginPage (Simulated)
// // const LoginPage = ({ onLogin }) => {
// //   const [username, setUsername] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState('');

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!username || !password) return setError('Both fields are required.');

// //     setLoading(true);
// //     setError('');

// //     try {
// //       await api.login(username, password);
// //       onLogin(); // App component handles state update from localStorage
// //     } catch (err) {
// //       setError(err.response?.message || 'Login failed.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
// //       <Card title="Asset Management Login">
// //         <p className="text-sm text-gray-500 mb-6">
// //           Use "admin" for Admin access, or *any other username* for Employee access. Password is not checked.
// //         </p>
// //         <form onSubmit={handleSubmit} className="space-y-4">
// //           <input
// //             type="text"
// //             placeholder="Username (e.g., john.doe or admin)"
// //             value={username}
// //             onChange={(e) => setUsername(e.target.value)}
// //             className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
// //             disabled={loading}
// //           />
// //           <input
// //             type="password"
// //             placeholder="Password"
// //             value={password}
// //             onChange={(e) => setPassword(e.target.value)}
// //             className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
// //             disabled={loading}
// //           />
// //           <button
// //             type="submit"
// //             className={`w-full p-3 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center ${
// //               loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
// //             }`}
// //             disabled={loading}
// //           >
// //             {loading ? (
// //               <span className="flex items-center">
// //                 <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Logging In...
// //               </span>
// //             ) : (
// //               'Log In'
// //             )}
// //           </button>
// //           {error && (
// //             <div className="flex items-center text-red-600 bg-red-100 p-3 rounded-lg">
// //               <XCircle className="w-5 h-5 mr-2" /> {error}
// //             </div>
// //           )}
// //         </form>
// //       </Card>
// //     </div>
// //   );
// // };

// // // Dashboard Base Component
// // const DashboardLayout = ({ role, onLogout, children }) => {
// //   const [message, setMessage] = useState('Welcome! Click the button below to test token refresh.');
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState('');

// //   // Function to test the interceptor logic
// //   const testProtectedResource = useCallback(async () => {
// //     setLoading(true);
// //     setError('');
// //     setMessage('Requesting protected resource...');

// //     try {
// //       const response = await api.get('protected-resource/');
// //       setMessage(`SUCCESS: ${response.data.message}`);
// //       console.log('API Call Succeeded:', response.data.message);
// //     } catch (err) {
// //       if (err.response?.status !== 401) {
// //         setError(`Error: ${err.message || 'Failed to fetch data'}`);
// //       }
// //       setMessage(`FAILURE: ${err.response?.message || 'Check console for details.'}`);
// //       console.error('API Call Failed:', err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   return (
// //     <div className="min-h-screen bg-gray-100">
// //       <header className="bg-white shadow-md">
// //         <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
// //           <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center">
// //             <LayoutDashboard className="w-7 h-7 mr-3" />
// //             {role} Dashboard
// //           </h1>
// //           <div className="flex items-center space-x-4">
// //             <span className="text-gray-600 hidden sm:inline">User Role: <span className="font-semibold text-indigo-600">{role}</span></span>
// //             <button
// //               onClick={onLogout}
// //               className="px-4 py-2 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition duration-150 flex items-center shadow-lg"
// //             >
// //               <LogOut className="w-4 h-4 mr-2" /> Log Out
// //             </button>
// //           </div>
// //         </div>
// //       </header>

// //       <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
// //         <div className="space-y-6">
// //           <Card title="API Token Refresh Test">
// //             <p className="text-gray-600 mb-4">
// //               Click the button three times to simulate a 401 token expiration. The fourth click will trigger the interceptor to attempt a refresh and retry the request automatically.
// //             </p>
// //             <div className={`p-4 rounded-lg font-mono mb-6 transition-all duration-300 ${error ? 'bg-red-100 text-red-800' : 'bg-indigo-50 text-indigo-800'}`}>
// //               <span className="font-bold mr-2">Status:</span>
// //               {loading ? (
// //                 <span className="flex items-center text-indigo-600">
// //                   <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing request...
// //                 </span>
// //               ) : (
// //                 message
// //               )}
// //             </div>
// //             <button
// //               onClick={testProtectedResource}
// //               disabled={loading}
// //               className={`w-full p-3 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center ${
// //                 loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
// //               }`}
// //             >
// //               <KeyRound className="w-5 h-5 mr-2" />
// //               {loading ? 'Testing...' : 'Test Protected API Endpoint'}
// //             </button>
// //           </Card>

// //           {children}
// //         </div>
// //       </main>
// //     </div>
// //   );
// // };

// // // Admin Dashboard Component
// // const AdminDashboard = (props) => (
// //   <DashboardLayout role="Admin" {...props}>
// //     <Card title="Admin Tools">
// //       <p className="text-lg text-gray-700">
// //         You have full access to manage Assets, Users, Departments, and System Settings.
// //       </p>
// //       <ul className="mt-4 space-y-2 text-indigo-600 font-medium">
// //         <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2"/>Manage Users (CRUD)</li>
// //         <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2"/>View Organization Metrics</li>
// //         <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2"/>Update System Settings</li>
// //       </ul>
// //     </Card>
// //   </DashboardLayout>
// // );

// // // Employee Dashboard Component
// // const EmployeeDashboard = (props) => (
// //   <DashboardLayout role="Employee" {...props}>
// //     <Card title="Employee Portal">
// //       <p className="text-lg text-gray-700">
// //         Welcome to your portal. You can view your assigned assets and request new ones.
// //       </p>
// //       <ul className="mt-4 space-y-2 text-indigo-600 font-medium">
// //         <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2"/>View My Assets</li>
// //         <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2"/>Request Asset Assignment</li>
// //         <li className="flex items-center"><ChevronRight className="w-4 h-4 mr-2"/>View Asset Catalog</li>
// //       </ul>
// //     </Card>
// //   </DashboardLayout>
// // );


// // // --- MAIN APP COMPONENT (app.jsx) ---
// // export default function App() { // Renamed the export for better compatibility with main.jsx
// //   const [isLoggedIn, setIsLoggedIn] = useState(false);
// //   const [role, setRole] = useState(null);
// //   const [isAuthReady, setIsAuthReady] = useState(false);

// //   // Check for existing access token and role on mount
// //   useEffect(() => {
// //     const token = localStorage.getItem("accessToken");
// //     const userRole = localStorage.getItem("role");
// //     if (token && userRole) {
// //       setIsLoggedIn(true);
// //       setRole(userRole);
// //     }
// //     setIsAuthReady(true);
// //   }, []);

// //   // Called after login
// //   const handleLogin = () => {
// //     const userRole = localStorage.getItem("role");
// //     setIsLoggedIn(true);
// //     setRole(userRole);
// //   };

// //   // Logout: clear tokens and reset state
// //   const handleLogout = () => {
// //     localStorage.clear();
// //     setIsLoggedIn(false);
// //     setRole(null);
// //     setIsAuthReady(true); // Reset to allow re-render
// //   };

// //   if (!isAuthReady) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
// //         <div className="text-center p-6 bg-white shadow-xl rounded-xl">
// //           <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />
// //           <p className="font-semibold text-gray-700">Checking session...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

// //   if (role === "Admin") {
// //     return <AdminDashboard onLogout={handleLogout} />;
// //   } else {
// //     return <EmployeeDashboard onLogout={handleLogout} />;
// //   }
// // }

// import React, { useState, useEffect, useCallback } from 'react';
// import { LogOut, LayoutDashboard, KeyRound, User, ChevronRight, RefreshCw, XCircle } from 'lucide-react';

// // --- STYLES (Normal CSS) ---
// // All styles are encapsulated within this single block for a clean, cohesive look.
// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

//   body {
//     font-family: 'Inter', sans-serif;
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//     background-color: #f7f9fc;
//   }

//   .app-container {
//     min-height: 100vh;
//     display: flex;
//     flex-direction: column;
//   }

//   /* --- Card Component Styles --- */
//   .card {
//     padding: 24px;
//     background-color: #ffffff;
//     box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
//     border-radius: 12px;
//     width: 100%;
//     max-width: 480px;
//     transition: all 0.3s ease;
//   }

//   .card-title {
//     font-size: 1.5rem; /* 24px */
//     font-weight: 700;
//     margin-bottom: 16px;
//     color: #1f2937;
//     border-bottom: 1px solid #e5e7eb;
//     padding-bottom: 8px;
//   }

//   /* --- Login Page Styles --- */
//   .login-page {
//     min-height: 100vh;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     padding: 20px;
//     background-color: #eef4ff;
//   }

//   .login-info {
//     font-size: 0.875rem;
//     color: #6b7280;
//     margin-bottom: 24px;
//   }

//   .form-group {
//     margin-bottom: 16px;
//   }

//   .input-field {
//     width: 100%;
//     padding: 12px;
//     border: 1px solid #d1d5db;
//     border-radius: 8px;
//     font-size: 1rem;
//     transition: border-color 0.2s, box-shadow 0.2s;
//   }

//   .input-field:focus {
//     outline: none;
//     border-color: #4f46e5;
//     box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
//   }

//   /* --- Button Styles --- */
//   .btn {
//     width: 100%;
//     padding: 12px;
//     color: white;
//     font-weight: 600;
//     border: none;
//     border-radius: 8px;
//     cursor: pointer;
//     transition: background-color 0.2s, transform 0.1s;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   }

//   .btn:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//   }

//   .btn-primary {
//     background-color: #4f46e5;
//   }
//   .btn-primary:hover:not(:disabled) {
//     background-color: #4338ca;
//   }

//   .btn-danger {
//     background-color: #ef4444;
//     width: auto;
//     padding: 8px 16px;
//   }
//   .btn-danger:hover:not(:disabled) {
//     background-color: #dc2626;
//   }

//   .btn-success {
//     background-color: #10b981;
//   }
//   .btn-success:hover:not(:disabled) {
//     background-color: #059669;
//   }
  
//   /* --- Alert/Error Styles --- */
//   .alert {
//     padding: 12px;
//     border-radius: 8px;
//     display: flex;
//     align-items: center;
//     font-size: 0.875rem;
//     margin-top: 16px;
//   }

//   .alert-error {
//     color: #991b1b;
//     background-color: #fee2e2;
//   }

//   /* --- Dashboard Styles --- */
//   .dashboard-header {
//     background-color: #ffffff;
//     box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
//     padding: 16px 0;
//   }

//   .header-content {
//     max-width: 1280px;
//     margin: 0 auto;
//     padding: 0 16px;
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//   }

//   .header-title {
//     font-size: 1.875rem; /* 30px */
//     font-weight: 800;
//     color: #4f46e5;
//     display: flex;
//     align-items: center;
//   }

//   .header-role {
//     color: #6b7280;
//     display: none;
//   }
  
//   .header-role span {
//     font-weight: 600;
//     color: #4f46e5;
//   }

//   @media (min-width: 640px) {
//     .header-role {
//       display: inline-block;
//       margin-right: 16px;
//     }
//   }

//   .dashboard-main {
//     max-width: 1280px;
//     margin: 0 auto;
//     padding: 40px 16px;
//   }

//   .dashboard-layout-grid {
//     display: flex;
//     flex-direction: column;
//     gap: 24px;
//   }
  
//   .api-status-box {
//     padding: 16px;
//     border-radius: 8px;
//     font-family: monospace;
//     margin-bottom: 24px;
//     transition: all 0.3s ease;
//     min-height: 40px;
//     display: flex;
//     align-items: center;
//   }

//   .status-info {
//     background-color: #e0e7ff;
//     color: #3730a3;
//   }

//   .status-error {
//     background-color: #fee2e2;
//     color: #991b1b;
//   }
  
//   .list-item {
//     display: flex;
//     align-items: center;
//     color: #4f46e5;
//     font-weight: 600;
//     margin-top: 8px;
//   }

//   /* Spin animation for loading icons */
//   .spin {
//     animation: spin 1s linear infinite;
//   }

//   @keyframes spin {
//     from {
//       transform: rotate(0deg);
//     }
//     to {
//       transform: rotate(360deg);
//     }
//   }
// `;

// // --- MOCK CONSTANTS & API SIMULATION ---
// const MOCK_TOKENS = {
//   admin: {
//     accessToken: 'admin_access_token_12345',
//     refreshToken: 'admin_refresh_token_abcde',
//     role: 'Admin',
//   },
//   employee: {
//     accessToken: 'employee_access_token_67890',
//     refreshToken: 'employee_refresh_token_fghij',
//     role: 'Employee',
//   },
// };

// // Global state to simulate token expiration and refresh logic
// let isRefreshing = false;
// let failedQueue = [];

// // Function to simulate the actual network request (fetch/axios call)
// const mockRequest = async (config) => {
//   await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency

//   const token = localStorage.getItem('accessToken');
//   const role = localStorage.getItem('role');

//   // --- 1. Simulate Token Expiration (401) ---
//   if (config.url === 'protected-resource/' && config.method === 'GET') {
//     let callCount = parseInt(localStorage.getItem('callCount') || '0', 10);
//     localStorage.setItem('callCount', callCount + 1);

//     if (callCount >= 3) {
//       console.log('MOCK API: Simulating 401 UNAUTHORIZED for resource request.');
//       localStorage.setItem('callCount', '0'); // Reset counter for next cycle
//       return Promise.reject({ response: { status: 401, message: 'Access token expired.' }, config });
//     }
//   }

//   // --- 2. Simulate successful request (or refresh token failure) ---
//   if (!token) {
//     return Promise.reject({ response: { status: 403, message: 'No token found.' } });
//   }

//   // Success payload
//   const responseData = {
//     'auth/token/': { access: MOCK_TOKENS[role.toLowerCase()].accessToken, refresh: MOCK_TOKENS[role.toLowerCase()].refreshToken, role },
//     'auth/token/refresh/': { access: MOCK_TOKENS[role.toLowerCase()].accessToken }, // New access token
//     'protected-resource/': { message: `Data loaded successfully for ${role}. Call count: ${localStorage.getItem('callCount')}` },
//   };

//   return Promise.resolve({ data: responseData[config.url], status: 200, headers: { Authorization: `Bearer ${token}` } });
// };


// // --- CUSTOM API INSTANCE IMPLEMENTATION (Interceptor Logic) ---

// // 1. Refresh Token Function
// const refreshAccessToken = async () => {
//   const refreshToken = localStorage.getItem("refreshToken");
//   if (!refreshToken) return null;

//   try {
//     const res = await mockRequest({
//       method: 'POST',
//       url: 'auth/token/refresh/',
//       data: { refresh: refreshToken },
//     });

//     localStorage.setItem("accessToken", res.data.access);
//     return res.data.access;
//   } catch (err) {
//     // Force logout on refresh failure
//     console.error('REFRESH FAILED. Forcing logout.', err);
//     localStorage.clear();
//     // Use window.location.href to force a full browser navigation reload
//     window.location.href = window.location.pathname; 
//     return null;
//   }
// };

// // 2. Request Wrapper function (Mimics api.get/post/put/delete)
// const api = {
//   get: async (url, config = {}) => {
//     const originalRequest = { url, method: 'GET', ...config, _retry: false };

//     // --- Request Interceptor Logic (Adding Token) ---
//     const token = localStorage.getItem("accessToken");
//     if (token) originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };

//     // --- Main Request Logic ---
//     const makeRequest = async (requestConfig) => {
//       try {
//         const response = await mockRequest(requestConfig);
//         return response;
//       } catch (error) {
//         // --- Response Interceptor Logic (401 Handling) ---
//         const status = error.response?.status;
//         const original = error.config;

//         if (status === 401 && !original._retry) {
//           original._retry = true;

//           if (isRefreshing) {
//             // Queue the request if a refresh is already in progress
//             return new Promise((resolve, reject) => {
//               failedQueue.push({ resolve, reject, original });
//             });
//           }

//           // Start the refresh process
//           isRefreshing = true;

//           const newToken = await refreshAccessToken();
//           isRefreshing = false;

//           // Process the queue with the new token
//           failedQueue.forEach(p => {
//             p.original.headers = { ...p.original.headers, Authorization: `Bearer ${newToken}` };
//             p.resolve(api.get(p.original.url, p.original)); // Retry queued request
//           });
//           failedQueue = [];

//           if (newToken) {
//             // Retry the original request with the new token
//             original.headers.Authorization = `Bearer ${newToken}`;
//             return api.get(original.url, original);
//           }
//         }
//         return Promise.reject(error);
//       }
//     };

//     return makeRequest(originalRequest);
//   },

//   // Mock login function
//   login: async (username, password) => {
//     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate login latency

//     const inputUser = username.trim().toLowerCase();
    
//     // Assign role based on username
//     const mockRole = inputUser === 'admin' ? 'admin' : 'employee';

//     const tokens = MOCK_TOKENS[mockRole];
//     localStorage.setItem("accessToken", tokens.accessToken);
//     localStorage.setItem("refreshToken", tokens.refreshToken);
//     localStorage.setItem("role", tokens.role);
//     localStorage.setItem('callCount', '0');
    
//     return { status: 200, data: { ...tokens } };
//   }
// };


// // --- UI COMPONENTS ---

// const Card = ({ children, title, className = '' }) => (
//   <div className={`card ${className}`}>
//     {title && <h2 className="card-title">{title}</h2>}
//     {children}
//   </div>
// );

// // LoginPage
// const LoginPage = ({ onLogin }) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!username || !password) return setError('Both fields are required.');

//     setLoading(true);
//     setError('');

//     try {
//       await api.login(username, password);
//       onLogin(); 
//     } catch (err) {
//       setError(err.response?.message || 'Login failed.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-page">
//       <Card title="Asset Management Login" className="max-w-md w-full">
//         <p className="login-info">
//           Use "admin" for Admin access, or *any other username* for Employee access. Password is not checked.
//         </p>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <input
//               type="text"
//               placeholder="Username (e.g., john.doe or admin)"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="input-field"
//               disabled={loading}
//             />
//           </div>
//           <div className="form-group">
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="input-field"
//               disabled={loading}
//             />
//           </div>
//           <button
//             type="submit"
//             className={`btn btn-primary ${loading ? 'btn:disabled' : ''}`}
//             disabled={loading}
//           >
//             {loading ? (
//               <span style={{ display: 'flex', alignItems: 'center' }}>
//                 <RefreshCw size={20} style={{ marginRight: 8 }} className="spin" /> Logging In...
//               </span>
//             ) : (
//               'Log In'
//             )}
//           </button>
//           {error && (
//             <div className="alert alert-error">
//               <XCircle size={20} style={{ marginRight: 8 }} /> {error}
//             </div>
//           )}
//         </form>
//       </Card>
//     </div>
//   );
// };

// // Dashboard Base Component
// const DashboardLayout = ({ role, onLogout, children }) => {
//   const [message, setMessage] = useState('Welcome! Click the button below to test token refresh.');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   // Function to test the interceptor logic
//   const testProtectedResource = useCallback(async () => {
//     setLoading(true);
//     setError('');
//     setMessage('Requesting protected resource...');

//     try {
//       const response = await api.get('protected-resource/');
//       setMessage(`SUCCESS: ${response.data.message}`);
//       console.log('API Call Succeeded:', response.data.message);
//     } catch (err) {
//       if (err.response?.status !== 401) {
//         setError(`Error: ${err.message || 'Failed to fetch data'}`);
//       }
//       setMessage(`FAILURE: ${err.response?.message || 'Check console for details.'}`);
//       console.error('API Call Failed:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return (
//     <div className="app-container">
//       <header className="dashboard-header">
//         <div className="header-content">
//           <h1 className="header-title">
//             <LayoutDashboard size={28} style={{ marginRight: 12 }} />
//             {role} Dashboard
//           </h1>
//           <div style={{ display: 'flex', alignItems: 'center' }}>
//             <span className="header-role">User Role: <span className="font-semibold text-indigo-600">{role}</span></span>
//             <button
//               onClick={onLogout}
//               className="btn btn-danger"
//             >
//               <LogOut size={16} style={{ marginRight: 8 }} /> Log Out
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="dashboard-main">
//         <div className="dashboard-layout-grid">
//           <Card title="API Token Refresh Test" className="max-w-full">
//             <p style={{ color: '#4b5563', marginBottom: 16 }}>
//               Click the button three times to simulate a 401 token expiration. The fourth click will trigger the interceptor to attempt a refresh and retry the request automatically.
//             </p>
//             <div className={`api-status-box ${error ? 'status-error' : 'status-info'}`}>
//               <span style={{ fontWeight: 700, marginRight: 8 }}>Status:</span>
//               {loading ? (
//                 <span style={{ display: 'flex', alignItems: 'center', color: '#4f46e5' }}>
//                   <RefreshCw size={16} style={{ marginRight: 8 }} className="spin" /> Processing request...
//                 </span>
//               ) : (
//                 message
//               )}
//             </div>
//             <button
//               onClick={testProtectedResource}
//               disabled={loading}
//               className={`btn btn-success ${loading ? 'btn:disabled' : ''}`}
//             >
//               <KeyRound size={20} style={{ marginRight: 8 }} />
//               {loading ? 'Testing...' : 'Test Protected API Endpoint'}
//             </button>
//           </Card>

//           {children}
//         </div>
//       </main>
//     </div>
//   );
// };

// // Admin Dashboard Component
// const AdminDashboard = (props) => (
//   <DashboardLayout role="Admin" {...props}>
//     <Card title="Admin Tools" className="max-w-full">
//       <p style={{ fontSize: '1.125rem', color: '#374151' }}>
//         You have full access to manage Assets, Users, Departments, and System Settings.
//       </p>
//       <ul style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
//         <li className="list-item"><ChevronRight size={16} style={{ marginRight: 8 }}/>Manage Users (CRUD)</li>
//         <li className="list-item"><ChevronRight size={16} style={{ marginRight: 8 }}/>View Organization Metrics</li>
//         <li className="list-item"><ChevronRight size={16} style={{ marginRight: 8 }}/>Update System Settings</li>
//       </ul>
//     </Card>
//   </DashboardLayout>
// );

// // Employee Dashboard Component
// const EmployeeDashboard = (props) => (
//   <DashboardLayout role="Employee" {...props}>
//     <Card title="Employee Portal" className="max-w-full">
//       <p style={{ fontSize: '1.125rem', color: '#374151' }}>
//         Welcome to your portal. You can view your assigned assets and request new ones.
//       </p>
//       <ul style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
//         <li className="list-item"><ChevronRight size={16} style={{ marginRight: 8 }}/>View My Assets</li>
//         <li className="list-item"><ChevronRight size={16} style={{ marginRight: 8 }}/>Request Asset Assignment</li>
//         <li className="list-item"><ChevronRight size={16} style={{ marginRight: 8 }}/>View Asset Catalog</li>
//       </ul>
//     </Card>
//   </DashboardLayout>
// );


// // --- MAIN APP COMPONENT ---
// export default function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [role, setRole] = useState(null);
//   const [isAuthReady, setIsAuthReady] = useState(false);

//   // Check for existing access token and role on mount
//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     const userRole = localStorage.getItem("role");
//     if (token && userRole) {
//       setIsLoggedIn(true);
//       setRole(userRole);
//     }
//     setIsAuthReady(true);
//   }, []);

//   // Called after login
//   const handleLogin = () => {
//     const userRole = localStorage.getItem("role");
//     setIsLoggedIn(true);
//     setRole(userRole);
//   };

//   // Logout: clear tokens and reset state
//   const handleLogout = () => {
//     localStorage.clear();
//     setIsLoggedIn(false);
//     setRole(null);
//     setIsAuthReady(true); 
//   };

//   // Inject CSS into the document head
//   useEffect(() => {
//     const styleTag = document.createElement('style');
//     styleTag.innerHTML = styles;
//     document.head.appendChild(styleTag);
//     return () => {
//       document.head.removeChild(styleTag);
//     };
//   }, []);


//   if (!isAuthReady) {
//     return (
//       <div className="login-page"> {/* Reusing the centering styles */}
//         <Card className="max-w-xs w-full">
//           <div style={{ textAlign: 'center' }}>
//             <RefreshCw size={32} style={{ margin: '0 auto 12px', color: '#4f46e5' }} className="spin" />
//             <p style={{ fontWeight: 600, color: '#4f46e5' }}>Checking session...</p>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

//   if (role === "Admin") {
//     return <AdminDashboard onLogout={handleLogout} />;
//   } else {
//     return <EmployeeDashboard onLogout={handleLogout} />;
//   }
// }

/* src/App.jsx */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import './index.css';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
const { isAuthenticated, role } = useAuth();
if (!isAuthenticated) return <Navigate to="/login" replace />;
if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/login" replace />;
return children;
};

export default function App() {
return ( <AuthProvider> <Router> <Routes>
<Route path="/login" element={<Login />} />


      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['Employee', 'Admin']}>
          <EmployeeDashboard />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  </Router>
</AuthProvider>


);
}
