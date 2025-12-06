/* src/api/axiosInstance.js */
import axios from 'axios';
import { getRefreshToken, getAccessToken, setAccessToken, clearAuthStorage } from './authService';

// ✅ Use Vite environment variable
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // don't send credentials by default; JWT tokens are in headers/localStorage
});

// Refresh token control (queueing logic)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
failedQueue.forEach(prom => {
if (error) prom.reject(error);
else prom.resolve(token);
});
failedQueue = [];
};

instance.interceptors.request.use(
(config) => {
const token = getAccessToken();
if (token) {
config.headers = config.headers || {};
config.headers.Authorization = `Bearer ${token}`;
}
return config;
},
(error) => Promise.reject(error)
);

instance.interceptors.response.use(
(response) => response,
async (error) => {
const originalRequest = error.config;


if (!originalRequest) return Promise.reject(error);

// If 401 and not an auth route, try refresh
if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('auth/token/refresh')) {
  originalRequest._retry = true;

  if (isRefreshing) {
    // Wait for token refresh to finish and then retry
    return new Promise(function (resolve, reject) {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return instance(originalRequest);
    }).catch((err) => Promise.reject(err));
  }

  isRefreshing = true;

  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // no refresh: force logout by clearing storage and rejecting
      clearAuthStorage();
      isRefreshing = false;
      return Promise.reject(error);
    }

    const refreshResponse = await instance.post('auth/token/refresh/', { refresh: refreshToken });
    const newAccessToken = refreshResponse.data.access;
    setAccessToken(newAccessToken);

    processQueue(null, newAccessToken);

    // retry original
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    isRefreshing = false;
    return instance(originalRequest);
  } catch (err) {
    processQueue(err, null);
    clearAuthStorage();
    isRefreshing = false;
    return Promise.reject(err);
  }
}

return Promise.reject(error);


}
);

export default instance;
