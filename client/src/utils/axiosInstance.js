import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API_URL,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle token expiration
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If token is expired and we haven't retried yet
        if (
            error.response?.status === 401 &&
            error.response.data?.code === "token_not_valid" &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });

                const newAccessToken = res.data.access;
                localStorage.setItem("access_token", newAccessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                console.error("Refresh token invalid:", refreshError);
                localStorage.clear();
                window.location.href = "/login"; // Or navigate in React
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
