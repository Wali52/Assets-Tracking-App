/* src/pages/EmployeeDashboard.jsx */
import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function EmployeeDashboard() {
  return (
    <DashboardLayout>
      <div className="card">
        <h3 className="card-title">Employee Portal</h3>
        <p>
          View your assigned assets, request returns, and check asset catalog.
        </p>
        <ul className="card-list">
          <li>• View My Assignments</li>
          <li>• Request Asset Assignment</li>
          <li>• Request Return</li>
        </ul>

        {/* Inline CSS */}
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
