/* src/pages/EmployeeDashboard.jsx */
import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function EmployeeDashboard() {
return ( <DashboardLayout> <div className="card"> <h3 className="card-title">Employee Portal</h3> <p>View your assigned assets, request returns, and check asset catalog.</p>
<ul style={{ marginTop: 12 }}> <li>• View My Assignments</li> <li>• Request Asset Assignment</li> <li>• Request Return</li> </ul> </div> </DashboardLayout>
);
}
