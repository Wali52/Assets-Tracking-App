/* src/pages/AdminDashboard.jsx */
import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="card">
        <h3 className="card-title">Admin Tools</h3>
        <p>You can manage Users, Departments, Assets, Asset Categories, and Assignments.</p>
        <ul className="card-list">
          <li>• Manage Users (CRUD)</li>
          <li>• Manage Departments</li>
          <li>• Manage Assets & Categories</li>
          <li>• View Assignment History</li>
        </ul>

        {/* Inline CSS for the card */}
        <style>{`
          .card {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: 20px auto;
          }

          .card-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937; /* dark gray */
            margin-bottom: 12px;
          }

          .card p {
            font-size: 14px;
            color: #4b5563; /* medium gray */
            line-height: 1.6;
          }

          .card-list {
            margin-top: 12px;
            padding-left: 20px;
            color: #374151;
            font-size: 14px;
            line-height: 1.6;
          }

          .card-list li {
            margin-bottom: 6px;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
