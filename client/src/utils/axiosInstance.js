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

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            error.response.data?.code === "token_not_valid" &&
            error.response.data?.messages?.[0]?.message === "Token is expired" &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await instance.post("/token/refresh/", { refresh: refreshToken });
                const newAccessToken = res.data.access;
                localStorage.setItem("access_token", newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
  

export default instance;
