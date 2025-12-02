// // EmployeeDashboard.jsx (Correct)
// import { getAssignments } from "../api/api";

// export default function EmployeeDashboard({ onLogout }) {
//   return (
//     <div>
//       <button onClick={onLogout}>Logout</button>
//       <h1>Employee Dashboard</h1>
//       {/* Later: show assigned assets, request return, fines */}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { getAssignments, returnAssignment, changePassword } from "../api/api";
import { jwtDecode } from "jwt-decode";

// Helper component for displaying the assignment list
const EmployeeAssignments = ({ userId, assignments, setAssignments, setError }) => {
  const [returnStatus, setReturnStatus] = useState({});

  const handleReturnRequest = async (assignmentId) => {
    setReturnStatus(prev => ({ ...prev, [assignmentId]: 'loading' }));
    try {
      await returnAssignment(assignmentId);
      
      // Update the local state or ideally, refetch the assignments
      setAssignments(prev => 
        prev.map(a => a.id === assignmentId ? { ...a, status: 'Return Requested' } : a)
      );
      setReturnStatus(prev => ({ ...prev, [assignmentId]: 'success' }));
    } catch (err) {
      console.error("Return failed:", err);
      setError("Failed to request return. Please try again.");
      setReturnStatus(prev => ({ ...prev, [assignmentId]: 'error' }));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">My Current Assignments</h2>
      
      {assignments.length === 0 ? (
        <p className="text-lg p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          You currently have no assets assigned.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            // NOTE: Assuming the asset object is nested or flattened
            const assetName = assignment.asset_name || assignment.asset?.name || 'Unknown Asset';
            const status = returnStatus[assignment.id] || assignment.status;
            const isReturnable = assignment.status === 'Assigned' || assignment.status === 'Overdue';
            const fineDisplay = assignment.fine_amount > 0 
                ? <span className="text-red-600 font-bold">Fine: ${assignment.fine_amount.toFixed(2)}</span>
                : <span className="text-green-600">No Fines</span>;

            return (
              <div key={assignment.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <p className="text-lg font-bold truncate">{assetName}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Assigned:</span> {new Date(assignment.assigned_date).toLocaleDateString()}
                </p>
                {assignment.due_date && (
                  <p className="text-sm text-red-500">
                    <span className="font-medium">Due By:</span> {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                )}
                
                <div className="mt-3 flex justify-between items-center">
                  <span className={`text-sm font-semibold p-1 rounded ${assignment.status === 'Overdue' ? 'bg-red-200 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    Status: {assignment.status}
                  </span>
                  {fineDisplay}
                </div>

                {isReturnable && (
                    <button
                      onClick={() => handleReturnRequest(assignment.id)}
                      disabled={status === 'loading' || status === 'Return Requested'}
                      className={`mt-4 w-full p-2 rounded text-white font-semibold transition ${
                        status === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 
                        status === 'success' ? 'bg-green-500 hover:bg-green-600' : 
                        'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {status === 'loading' ? 'Requesting Return...' : 
                       status === 'success' ? 'Request Sent!' : 
                       'Request Asset Return'}
                    </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// Helper component for password change form
const EmployeeChangePassword = ({ setError }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    
    setLoading(true);

    try {
      await changePassword({ 
        old_password: currentPassword, 
        new_password: newPassword 
      });
      setMessage("Password successfully updated!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Password change failed:", err);
      setError(err.response?.data?.detail || "Failed to update password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">Change Your Password</h2>
      {message && <p className="text-green-600 mb-4 font-medium">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="password" 
          placeholder="Current Password" 
          value={currentPassword} 
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input 
          type="password" 
          placeholder="New Password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input 
          type="password" 
          placeholder="Confirm New Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};


// Main Employee Dashboard Component
export default function EmployeeDashboard({ onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('assignments'); // State for internal routing
  
  // Get User ID from Token
  const token = localStorage.getItem("accessToken");
  const decoded = token ? jwtDecode(token) : {};
  const userId = decoded.user_id; // Assuming user_id is in the token payload

  useEffect(() => {
    // Only fetch assignments when the assignments view is active
    if (view !== 'assignments') return; 

    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Backend handles filtering assignments to only show the employee's
        const { data } = await getAssignments(); 
        setAssignments(data); 
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError("Failed to load assignments. Your session may have expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [view]);


  const renderContent = () => {
    if (loading) return <div className="p-8 text-center text-lg">Loading your data...</div>;
    if (error) return <p className="p-8 text-red-500 font-bold">{error}</p>;

    switch (view) {
      case 'assignments':
        return (
          <EmployeeAssignments 
            userId={userId}
            assignments={assignments}
            setAssignments={setAssignments}
            setError={setError}
          />
        );
      case 'changePassword':
        return <EmployeeChangePassword setError={setError} />;
      default:
        return <p>Select an option from the sidebar.</p>;
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
          <h2 className="text-2xl font-extrabold text-blue-600 mb-8 border-b pb-2">Employee Panel</h2>
          <nav className="space-y-2">
            <button 
              onClick={() => setView('assignments')}
              className={getMenuItemClasses('assignments')}
            >
              My Assignments & Fines
            </button>
            <button 
              onClick={() => setView('changePassword')}
              className={getMenuItemClasses('changePassword')}
            >
              Change Password
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