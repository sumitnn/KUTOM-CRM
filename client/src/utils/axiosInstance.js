// src/utils/axiosInstance.js
import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API_URL, // e.g. http://localhost:8000/api
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/token/refresh/")
        ) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers["Authorization"] = "Bearer " + token;
                    return instance(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh_token");

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_API_URL}/token/refresh/`,
                    { refresh: refreshToken }
                );

                const newAccessToken = response.data.access;
                localStorage.setItem("access_token", newAccessToken);

                instance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                return instance(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
