// axiosInstance.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1/";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";
const ACTIVE_USER_KEY = "activeUserId";

// ------------------
// MULTI-USER TOKEN ACCESS (MATCHES AuthContext)
// ------------------
const getActiveUserId = () => sessionStorage.getItem(ACTIVE_USER_KEY);

const getAccessToken = () => {
    const id = getActiveUserId();
    return id ? sessionStorage.getItem(`${ACCESS_KEY}_${id}`) : null;
};

const getRefreshToken = () => {
    const id = getActiveUserId();
    return id ? sessionStorage.getItem(`${REFRESH_KEY}_${id}`) : null;
};

const setAccessToken = (newToken) => {
    const id = getActiveUserId();
    if (id) sessionStorage.setItem(`${ACCESS_KEY}_${id}`, newToken);
};

const clearAuthStorage = () => {
    const id = getActiveUserId();
    if (!id) return;

    sessionStorage.removeItem(`${ACCESS_KEY}_${id}`);
    sessionStorage.removeItem(`${REFRESH_KEY}_${id}`);
    sessionStorage.removeItem(`${USER_KEY}_${id}`);
    sessionStorage.removeItem(ACTIVE_USER_KEY);
};

// ------------------
// AXIOS INSTANCE
// ------------------
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
};

// REQUEST → attach access token
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE → handle refresh logic
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("auth/token/refresh")
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const res = await axios.post(
                    `${API_BASE_URL}auth/token/refresh/`,
                    { refresh: refreshToken }
                );

                const newAccessToken = res.data.access;
                setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                isRefreshing = false;
                clearAuthStorage();
                window.location.hash = "/login";
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
