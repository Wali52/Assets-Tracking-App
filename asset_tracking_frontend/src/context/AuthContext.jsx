import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// --- Configuration & Constants ---
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const ROLE_KEY = 'role';
const USER_KEY = 'user';
const ORG_KEY = 'organization';
const ACTIVE_USER_KEY = 'activeUserId'; // ID of currently active user in this tab

// Define standard roles
export const ROLE_ADMIN = 'Admin';
export const ROLE_EMPLOYEE = 'Employee';

// --- Axios Instance ---
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
};

// Request Interceptor
apiClient.interceptors.request.use(
    config => {
        const token = authService.getAccessToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error)
);

// Response Interceptor for Token Refresh
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('auth/token/refresh')) {
            
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            isRefreshing = true;
            try {
                const refreshToken = authService.getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

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
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// --- Auth Service with Multi-Account Support ---
const authService = {
    _userKey: id => `${USER_KEY}_${id}`,
    _accessKey: id => `${ACCESS_KEY}_${id}`,
    _refreshKey: id => `${REFRESH_KEY}_${id}`,
    _roleKey: id => `${ROLE_KEY}_${id}`,
    _orgKey: id => `${ORG_KEY}_${id}`,

    setActiveUserId: id => sessionStorage.setItem(ACTIVE_USER_KEY, id),
    getActiveUserId: () => sessionStorage.getItem(ACTIVE_USER_KEY),

    setAccessToken: (token, userId) => sessionStorage.setItem(authService._accessKey(userId), token),
    getAccessToken: () => {
        const id = authService.getActiveUserId();
        return id ? sessionStorage.getItem(authService._accessKey(id)) : null;
    },

    setRefreshToken: (token, userId) => sessionStorage.setItem(authService._refreshKey(userId), token),
    getRefreshToken: () => {
        const id = authService.getActiveUserId();
        return id ? sessionStorage.getItem(authService._refreshKey(id)) : null;
    },

    setRole: (role, userId) => sessionStorage.setItem(authService._roleKey(userId), role),
    getRole: () => {
        const id = authService.getActiveUserId();
        return id ? sessionStorage.getItem(authService._roleKey(id)) : null;
    },

    setUser: (user) => {
        sessionStorage.setItem(authService._userKey(user.id), JSON.stringify(user));
        authService.setActiveUserId(user.id);
    },
    getUser: () => {
        const id = authService.getActiveUserId();
        if (!id) return null;
        const raw = sessionStorage.getItem(authService._userKey(id));
        return raw ? JSON.parse(raw) : null;
    },

    setOrganizationData: (org, userId) => sessionStorage.setItem(authService._orgKey(userId), JSON.stringify(org)),
    getOrganizationData: () => {
        const id = authService.getActiveUserId();
        if (!id) return null;
        const raw = sessionStorage.getItem(authService._orgKey(id));
        return raw ? JSON.parse(raw) : null;
    },

    clearAuthStorage: () => {
        const id = authService.getActiveUserId();
        if (!id) return;
        sessionStorage.removeItem(authService._accessKey(id));
        sessionStorage.removeItem(authService._refreshKey(id));
        sessionStorage.removeItem(authService._roleKey(id));
        sessionStorage.removeItem(authService._userKey(id));
        sessionStorage.removeItem(authService._orgKey(id));
        sessionStorage.removeItem(ACTIVE_USER_KEY);
    },

    login: async ({ email, password }) => {
        const res = await axios.post(`${API_BASE_URL}auth/token/`, { email, password });
        const { access, refresh, user } = res.data;

        if (!user) throw new Error("No user returned from server");

        // Use the role returned from server inside user object if available
        const role = user.role || res.data.role || ROLE_EMPLOYEE;

        authService.setUser(user);
        authService.setOrganizationData(user.organization, user.id);
        authService.setAccessToken(access, user.id);
        authService.setRefreshToken(refresh, user.id);
        authService.setRole(role, user.id);

        return { access, refresh, user, role };
    },

    logout: async () => {
        authService.clearAuthStorage();
    }
};

// --- Auth Context ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(authService.getUser());
    const [role, setRole] = useState(authService.getRole());
    const [isAuthenticated, setIsAuthenticated] = useState(!!authService.getAccessToken());
    const [organizationData, setOrganizationData] = useState(authService.getOrganizationData());
    const [loading, setLoading] = useState(false);

    const login = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await authService.login({ email, password });
            setCurrentUser(authService.getUser());
            setRole(authService.getRole()); // Correct role loaded from sessionStorage
            setOrganizationData(authService.getOrganizationData());
            setIsAuthenticated(true);
            setLoading(false);
            return data;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const logout = async () => {
        await authService.logout();
        setCurrentUser(null);
        setRole(null);
        setOrganizationData(null);
        setIsAuthenticated(false);
    };

    // Switch active user (without logging out)
    const switchUser = (userId) => {
        authService.setActiveUserId(userId);
        setCurrentUser(authService.getUser());
        setRole(authService.getRole());
        setOrganizationData(authService.getOrganizationData());
        setIsAuthenticated(!!authService.getAccessToken());
    };

    const value = {
        currentUser,
        role,
        isAuthenticated,
        organizationData,
        login,
        logout,
        switchUser,
        loading,
        axios: apiClient,
        ROLE_ADMIN,
        ROLE_EMPLOYEE,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
