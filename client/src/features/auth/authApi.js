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
        refresh: builder.mutation({
            query: (refresh) => ({
                url: "/token/refresh/",
                method: "POST",
                data: { refresh },
            }),
        }),
    }),
});


export const { useLoginMutation, useLogoutMutation, useRefreshMutation } = authApi;
