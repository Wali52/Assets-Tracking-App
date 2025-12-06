/* src/context/AuthContext.jsx - Now includes dependency logic for self-containment */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// --- Configuration & Constants ---
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const ROLE_KEY = 'role';
const USER_KEY = 'user';

// --- Auth Storage Service (authService.js Logic Integrated) ---
const authService = {
    setAccessToken: (token) => { if (token) localStorage.setItem(ACCESS_KEY, token); },
    getAccessToken: () => localStorage.getItem(ACCESS_KEY),
    setRefreshToken: (token) => { if (token) localStorage.setItem(REFRESH_KEY, token); },
    getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
    setRole: (role) => { if (role) localStorage.setItem(ROLE_KEY, role); },
    getRole: () => localStorage.getItem(ROLE_KEY),
    setUser: (user) => { if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); },
    getUser: () => {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    clearAuthStorage: () => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(ROLE_KEY);
        localStorage.removeItem(USER_KEY);
    },
    // Login function: organization_id removed per user request
    login: async ({ email, password }) => {
        const res = await apiClient.post('auth/token/', { 
            email: email, 
            password: password, 
        }); 
        
        const { access, refresh } = res.data || {};
        const role = res.data.role || 'Employee';
    
        authService.setAccessToken(access);
        authService.setRefreshToken(refresh);
        authService.setRole(role);
        if (res.data.user) authService.setUser(res.data.user);
    
        return res.data;
    },
    logout: async () => {
        authService.clearAuthStorage();
    }
};

// --- API Client Setup (axiosInstance.js Logic Integrated) ---
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

apiClient.interceptors.request.use(
    (config) => {
        const token = authService.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) return Promise.reject(error);

        // If 401 and not an auth route, try refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('auth/token/refresh')) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const refreshToken = authService.getRefreshToken();
                if (!refreshToken) {
                    authService.clearAuthStorage();
                    isRefreshing = false;
                    // Force redirect to login on failure (in a full React app, use navigate, but here we enforce signout)
                    // window.location.href = '/login'; // This is handled by routing higher up
                    return Promise.reject(error);
                }

                // Call the token refresh endpoint using standard axios instance
                const refreshResponse = await axios.post(`${API_BASE_URL}auth/token/refresh/`, { refresh: refreshToken });
                const newAccessToken = refreshResponse.data.access;
                authService.setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                isRefreshing = false;
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                authService.clearAuthStorage();
                isRefreshing = false;
                // window.location.href = '/login'; // This is handled by routing higher up
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);


// --- Auth Context and Provider ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [role, setRole] = useState(authService.getRole());
    const [isAuthenticated, setIsAuthenticated] = useState(!!authService.getAccessToken());
    const [currentUser, setCurrentUser] = useState(authService.getUser());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initial state load
        setRole(authService.getRole());
        setIsAuthenticated(!!authService.getAccessToken());
        setCurrentUser(authService.getUser());
    }, []);

    // FIX: login signature is correct, now calls the integrated authService.login
    const login = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await authService.login({ email, password });
            
            // Update local context state based on storage after successful login
            setRole(authService.getRole());
            setIsAuthenticated(true);
            setCurrentUser(authService.getUser());
            setLoading(false);
            return data;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const logout = async () => {
        await authService.logout();
        setRole(null);
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    const value = {
        role,
        isAuthenticated,
        currentUser,
        login,
        logout,
        loading,
        axios: apiClient, // expose the configured instance for API calls
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;