import { useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import

import { useRefreshTokenMutation } from "../features/auth/authApi";
import { toast } from "react-toastify";

const useAutoRefreshToken = () => {
    const [refreshToken] = useRefreshTokenMutation();
    const refreshTimeout = useRef(null);

    const scheduleRefresh = (token) => {
        try {
            const decoded = jwtDecode(token); // ✅ Correct usage
            const expiry = decoded.exp * 1000;
            const now = Date.now();
            const timeUntilExpiry = expiry - now;
            const refreshTime = timeUntilExpiry - 30 * 1000;

            if (refreshTime > 0) {
                refreshTimeout.current = setTimeout(() => {
                    attemptRefresh();
                }, refreshTime);
            }
        } catch (err) {
            console.error("Failed to decode token", err);
        }
    };

    const attemptRefresh = async () => {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) return;

        try {
            const res = await refreshToken(refresh).unwrap();
            const newAccessToken = res.access;
            localStorage.setItem("access_token", newAccessToken);
            scheduleRefresh(newAccessToken);
            console.log("✅ Access token refreshed");
        } catch (err) {
            console.error("❌ Token refresh failed", err);
            toast.error("Session expired. Please login again.");
            localStorage.clear();
            setTimeout(() => {
                window.location.href = "/login";
            }, 1500);
        }
    };

    useEffect(() => {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
            scheduleRefresh(accessToken);
        }

        return () => {
            if (refreshTimeout.current) {
                clearTimeout(refreshTimeout.current);
            }
        };
    }, []);
};

export default useAutoRefreshToken;
