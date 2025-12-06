/* src/pages/AdminDashboard.jsx */
import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function AdminDashboard() {
return ( <DashboardLayout> <div className="card"> <h3 className="card-title">Admin Tools</h3> <p>You can manage Users, Departments, Assets, Asset Categories, and Assignments.</p>
<ul style={{ marginTop: 12 }}> <li>• Manage Users (CRUD)</li> <li>• Manage Departments</li> <li>• Manage Assets & Categories</li> <li>• View Assignment History</li> </ul> </div> </DashboardLayout>
);
}
