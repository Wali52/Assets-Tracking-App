import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';

import { useRouter } from '../context/RouterContext.jsx';



export default function Login() {

    const { login, isAuthenticated, role } = useAuth();

    const { navigate } = useRouter(); // use custom navigate

    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');

    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);



    useEffect(() => {

        if (isAuthenticated) {

            navigate(role === 'Admin' ? '/admin' : '/employee');

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

            const res = await login({ email, password });

            const nextRole = res.role || role;

            navigate(nextRole === 'Admin' ? '/admin' : '/employee');

        } catch (err) {

            console.error("Login Error:", err);

            const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Login failed';

            setError(typeof msg === 'string' ? msg : (msg.code || 'Login failed: Check credentials.'));

        } finally {

            setLoading(false);

        }

    };



    return (

        <div className="login-container">

            <style>{`

                .login-container { min-height:100vh; display:flex; justify-content:center; align-items:center; background-color:#f3f4f6; padding:16px; }

                .login-card { background-color:#fff; border-radius:12px; padding:32px; max-width:400px; width:100%; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04); }

                .login-title { font-size:24px; font-weight:700; color:#111827; text-align:center; margin-bottom:24px; }

                .login-info { font-size:14px; color:#4b5563; text-align:center; margin-bottom:24px; }

                .form-group { margin-bottom:16px; }

                .input-field { width:90%; padding:12px 16px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none; transition:all 0.2s; }

                .input-field:focus { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,0.3); }

                .btn-primary { width:100%; padding:12px; font-size:14px; font-weight:600; border:none; border-radius:8px; color:white; background-color:#4f46e5; cursor:pointer; display:flex; justify-content:center; align-items:center; transition:background-color 0.2s; }

                .btn-primary:hover:not(:disabled) { background-color:#4338ca; }

                .btn-primary:disabled { background-color:#9ca3af; cursor:not-allowed; opacity:0.6; }

                .spinner { animation:spin 1s linear infinite; height:20px; width:20px; margin-right:8px; }

                @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }

                .alert-error { margin-top:12px; padding:12px; border-radius:8px; background-color:#fee2e2; color:#b91c1c; font-size:14px; text-align:center; }

            `}</style>



            <div className="login-card">

                <h2 className="login-title">Asset Management Login</h2>

                <p className="login-info">Enter your email and password to access the system.</p>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />

                    </div>

                    <div className="form-group">

                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />

                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>

                        {loading ? (

                            <svg className="spinner" viewBox="0 0 24 24">

                                <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="4" fill="none" />

                                <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>

                            </svg>

                        ) : 'Log In'}

                    </button>

                    {error && <div className="alert-error">{error}</div>}

                </form>

            </div>

        </div>

    );

}