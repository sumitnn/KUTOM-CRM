// features/wallet/walletApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const walletApi = createApi({
    reducerPath: "walletApi",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_BACKEND_API_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("access_token");
            if (token) {
                headers.set("authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getWallet: builder.query({
            query: () => `/wallet/`,
        }),
        getTransactions: builder.query({
            query: ({ page = 1 } = {}) => `/wallet/transactions/?page=${page}`,
        }),
        updateWalletAmount: builder.mutation({
            query: ({ userId, data }) => ({
                url: `/wallet/update/${userId}/`,
                method: "PUT",
                body: data,
            }),
        }),
    }),
});

export const {
    useGetWalletQuery,
    useGetTransactionsQuery,
    useUpdateWalletAmountMutation,
} = walletApi;
