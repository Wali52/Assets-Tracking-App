import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 🔗 CSS IMPORTS
// 1. Import global base styles first
import './index.css';
// 2. Import dashboard-specific component styles (assuming dashboard.css is in the same directory)
import './layouts/dashboard.css'; 

createRoot(document.getElementById('root')).render(
    <React.StrictMode> 
        <App />
    </React.StrictMode>
);