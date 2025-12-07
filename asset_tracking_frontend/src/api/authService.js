/* src/api/authService.js
Helper functions: login, logout, get/set tokens (localStorage)
*/
import axios from './axiosInstance';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const ROLE_KEY = 'role';
const USER_KEY = 'user';

export const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';


export const setAccessToken = (token) => {
    if (token) localStorage.setItem(ACCESS_KEY, token);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);

export const setRefreshToken = (token) => {
    if (token) localStorage.setItem(REFRESH_KEY, token);
};

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const setRole = (role) => {
    if (role) localStorage.setItem(ROLE_KEY, role);
};

export const getRole = () => localStorage.getItem(ROLE_KEY);

export const setUser = (user) => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
};

export const clearAuthStorage = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
};

// Login: call Django token endpoint with { email, password }
// organization_id removed per request.
export const login = async ({ email, password }) => {
    const res = await axios.post('auth/token/', { 
        email: email, 
        password: password, 
        // organization_id removed here
    }); 
    
    const { access, refresh } = res.data || {};
    // Assume role comes from the server or default to Employee if not provided
    const role = res.data.role || 'Employee';

    setAccessToken(access);
    setRefreshToken(refresh);
    setRole(role);
    if (res.data.user) setUser(res.data.user);

    return res.data;
};

export const logout = async () => {
    clearAuthStorage();
};

export default {
    login,
    logout,
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    getRole,
    getUser,
    clearAuthStorage,
};