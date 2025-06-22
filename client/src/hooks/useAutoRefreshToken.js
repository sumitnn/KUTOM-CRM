// useAutoRefreshToken.js
import { useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useRefreshTokenMutation } from "../features/auth/authApi";
import { toast } from "react-toastify";

const useAutoRefreshToken = () => {
    const [refreshToken, { isError }] = useRefreshTokenMutation();
    const refreshTimeout = useRef(null);
    const isRefreshing = useRef(false);

    const scheduleRefresh = (token) => {
        try {
            if (!token) return;

            const decoded = jwtDecode(token);
            if (!decoded.exp) {
                throw new Error("Token has no expiration");
            }

            const expiry = decoded.exp * 1000;
            const now = Date.now();
            const timeUntilExpiry = expiry - now;

            // Refresh 1 minute before expiry (changed from 30s to 60s for more buffer)
            const refreshTime = Math.max(timeUntilExpiry - 60 * 1000, 0);

            // Clear any existing timeout
            if (refreshTimeout.current) {
                clearTimeout(refreshTimeout.current);
            }

            if (refreshTime > 0) {
                refreshTimeout.current = setTimeout(() => {
                    attemptRefresh();
                }, refreshTime);
                console.log(`Next refresh scheduled in ${refreshTime / 1000} seconds`);
            }
        } catch (err) {
            console.error("Token refresh scheduling failed:", err);
            handleRefreshFailure();
        }
    };

    const attemptRefresh = async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;

        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) {
            handleRefreshFailure();
            return;
        }

        try {
            const res = await refreshToken(refresh).unwrap();
            localStorage.setItem("access_token", res.access);
            scheduleRefresh(res.access);
            console.log("✅ Token refreshed successfully");
        } catch (err) {
            console.error("❌ Token refresh failed:", err);
            handleRefreshFailure();
        } finally {
            isRefreshing.current = false;
        }
    };

    const handleRefreshFailure = () => {
        localStorage.clear();
        toast.error("Your session has expired. Please login again.", {
            toastId: 'session-expired' // Prevent duplicate toasts
        });
        // Redirect after toast is shown
        setTimeout(() => {
            window.location.pathname = "/login";
        }, 2000);
    };

    useEffect(() => {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
            scheduleRefresh(accessToken);
        }

        // Set up interval to check token validity every 5 minutes
        const checkInterval = setInterval(() => {
            const token = localStorage.getItem("access_token");
            if (token) {
                try {
                    const { exp } = jwtDecode(token);
                    if (exp * 1000 < Date.now()) {
                        attemptRefresh();
                    }
                } catch {
                    handleRefreshFailure();
                }
            }
        }, 5 * 60 * 1000);

        return () => {
            clearInterval(checkInterval);
            if (refreshTimeout.current) {
                clearTimeout(refreshTimeout.current);
            }
        };
    }, []);

    // Handle refresh errors
    useEffect(() => {
        if (isError) {
            handleRefreshFailure();
        }
    }, [isError]);
};

export default useAutoRefreshToken;