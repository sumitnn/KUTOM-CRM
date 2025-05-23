// src/features/auth/authApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../../utils/axiosBaseQuery";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "/login/",
                method: "POST",
                data: credentials,
            }),
        }),
        logout: builder.mutation({
            query: (refresh_token) => ({
                url: "/logout/",
                method: "POST",
                data: { refresh_token },
            }),
        }),
        refreshToken: builder.mutation({
            query: (refresh) => ({
                url: "/token/refresh/",
                method: "POST",
                data: { refresh },
            }),
        
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
    }),
});


export const { useLoginMutation, useLogoutMutation, useRefreshTokenMutation,useUpdatePasswordMutation } = authApi;
