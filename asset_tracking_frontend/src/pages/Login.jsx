/* src/pages/Login.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function Login() {
    const { login, isAuthenticated, role } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Determine the route based on the stored role
            navigate(role === 'Admin' ? '/admin' : '/employee', { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        try {
            // Call the login function from AuthContext with only email and password
            const res = await login({ email, password }); 

            // Get the role from the response or the context state
            const nextRole = res.role || role;
            if (nextRole === 'Admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/employee', { replace: true });
            }
        } catch (err) {
            console.error("Login Error:", err);
            // Extract a user-friendly error message
            const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Login failed';
            
            // Handle error response object (e.g., from Django REST Framework)
            let displayMsg = typeof msg === 'string' 
                ? msg 
                : (msg.code || 'Login failed: Check credentials.');
                
            setError(displayMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <style>
                {`
                /* Tailwind-like utility classes for styling */
                .login-page .card { 
                    background-color: white; 
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); 
                    border-radius: 0.75rem; 
                    padding: 2rem; 
                    width: 100%; 
                    max-width: 28rem; 
                }
                .login-page .card-title { 
                    font-size: 1.875rem; 
                    font-weight: 800; 
                    color: #111827; 
                    text-align: center; 
                    margin-bottom: 1.5rem; 
                }
                .login-info { 
                    text-align: center; 
                    font-size: 0.875rem; 
                    color: #4b5563; 
                    margin-bottom: 1.5rem; 
                }
                .form-group { 
                    margin-bottom: 1.5rem; 
                }
                .input-field { 
                    appearance: none; 
                    position: relative; 
                    display: block; 
                    width: 100%; 
                    padding: 0.75rem 1rem; 
                    border: 1px solid #d1d5db; 
                    color: #111827; 
                    border-radius: 0.5rem; 
                    outline: none; 
                    transition: all 150ms; 
                }
                .input-field:focus { 
                    border-color: #4f46e5; 
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5); /* Custom ring effect */
                }
                .btn-primary { 
                    position: relative; 
                    width: 100%; 
                    display: flex; 
                    justify-content: center; 
                    padding: 0.75rem 1rem; 
                    border: none; 
                    font-size: 0.875rem; 
                    font-weight: 600; 
                    border-radius: 0.5rem; 
                    color: white; 
                    background-color: #4f46e5; 
                    transition: all 150ms; 
                }
                .btn-primary:hover:not(:disabled) { 
                    background-color: #4338ca; 
                }
                .btn-primary:disabled { 
                    opacity: 0.6; 
                    cursor: not-allowed; 
                    background-color: #9ca3af; /* A softer gray when disabled */
                }
                .alert-error { 
                    padding: 0.75rem; 
                    font-size: 0.875rem; 
                    font-weight: 500; 
                    color: #b91c1c; 
                    background-color: #fee2e2; 
                    border: 1px solid #fca5a5;
                    border-radius: 0.5rem; 
                    text-align: center; 
                    margin-top: 0.75rem; 
                }
                `}
            </style>
            <div className="login-page">
                <div className="card">
                    <h2 className="card-title">Asset Management Login</h2>
                    <p className="login-info">
                        Enter your email and password to access the system.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="Email"
                                type="email"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                className="input-field"
                                placeholder="Password"
                                required
                            />
                        </div>
                        
                        <button disabled={loading} className="btn-primary" type="submit">
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Log In'
                            )}
                        </button>
                        {error && <div className="alert-error">{error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}