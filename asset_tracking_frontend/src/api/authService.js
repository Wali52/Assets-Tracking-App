import axios from './axiosInstance';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const ROLE_KEY = 'role';
const USER_KEY = 'user';

export const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';

// --- Use sessionStorage instead of localStorage ---
export const setAccessToken = (token) => {
    if (token) sessionStorage.setItem(ACCESS_KEY, token);
};
export const getAccessToken = () => sessionStorage.getItem(ACCESS_KEY);

export const setRefreshToken = (token) => {
    if (token) sessionStorage.setItem(REFRESH_KEY, token);
};
export const getRefreshToken = () => sessionStorage.getItem(REFRESH_KEY);

export const setRole = (role) => {
    if (role) sessionStorage.setItem(ROLE_KEY, role);
};
export const getRole = () => sessionStorage.getItem(ROLE_KEY);

export const setUser = (user) => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const getUser = () => {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
};

export const clearAuthStorage = () => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_KEY);
};

// Login: call Django token endpoint with { email, password }
export const login = async ({ email, password }) => {
    const res = await axios.post('auth/token/', { 
        email, 
        password, 
    }); 
    
    const { access, refresh } = res.data || {};
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
