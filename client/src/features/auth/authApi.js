// src/features/auth/authApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../../utils/axiosBaseQuery";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "/login/",
                method: "POST",
                data: credentials,
            }),
            invalidatesTags: ['User'],
        }),
        logout: builder.mutation({
            query: (refresh_token) => ({
                url: "/logout/",
                method: "POST",
                data: { refresh_token },
            }),
            invalidatesTags: ['User'],
        }),
        refreshToken: builder.mutation({
            query: (refresh) => ({
                url: "/token/refresh/",
                method: "POST",
                data: { refresh }, // Changed from body to data for consistency
            }),
            transformErrorResponse: (response) => {
                if (response.status === 401) {
                    return { message: "Refresh token expired or invalid" };
                }
                return response.data;
            }
        }),
        updatePassword: builder.mutation({
            query: (data) => ({
                url: "/change-password/",
                method: "PUT",
                data: {
                    old_password: data.oldPassword,
                    new_password: data.newPassword,
                },
            }),
        }),
        getCurrentUser: builder.query({
            query: () => ({
                url: '/me/',
                method: 'GET',
            }),
            providesTags: ['User'],
            transformResponse: (response) => {
                
                return {
                    id: response.id,
                    email: response.email,
                    username: response.username,
                    role: response.role,
                    
                };
            },
            transformErrorResponse: (response) => {
                return {
                    status: response.status,
                    message: response.data?.message || 'Failed to fetch user data',
                };
            }
        }),
        // Optional: Add user registration endpoint if needed
        register: builder.mutation({
            query: (userData) => ({
                url: '/register/',
                method: 'POST',
                data: userData,
            }),
        }),
    }),
});

// Export all hooks, including the missing getCurrentUser
export const {
    useLoginMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
    useUpdatePasswordMutation,
    useGetCurrentUserQuery,
    useRegisterMutation,
} = authApi;