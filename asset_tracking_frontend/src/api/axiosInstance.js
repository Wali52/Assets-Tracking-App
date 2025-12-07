import axios from 'axios';
import { API_BASE_URL, getAccessToken, getRefreshToken, setAccessToken, clearAuthStorage } from './authService';

// --- API Client Setup (Axios Instance with Interceptors) ---
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

// Request Interceptor: Add access token to headers
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest || !error.response) return Promise.reject(error);

        if (error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('auth/token/refresh')) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const refreshResponse = await axios.post(`${API_BASE_URL}auth/token/refresh/`, { refresh: refreshToken });
                const newAccessToken = refreshResponse.data.access;
                setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                isRefreshing = false;
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                clearAuthStorage();
                isRefreshing = false;
                window.location.hash = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
