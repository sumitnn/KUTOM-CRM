// features/wallet/walletApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../utils/axiosBaseQuery';

export const walletApi = createApi({
    reducerPath: 'walletApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ["Wallet", "Transactions"],
    endpoints: (builder) => ({
        getWallet: builder.query({
            query: () => ({
                url: '/wallet/',
                method: 'GET',
            }),
            providesTags: ["Wallet"]
        }),
        getTransactions: builder.query({
            query: ({ page = 1, type, status, fromDate, toDate } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page);
                if (type) params.append('type', type);
                if (status) params.append('status', status);
                if (fromDate) params.append('fromDate', fromDate);
                if (toDate) params.append('toDate', toDate);

                return {
                    url: `/wallet/transactions/?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map(({ id }) => ({ type: 'Transactions', id })),
                        { type: 'Transactions', id: 'LIST' },
                    ]
                    : [{ type: 'Transactions', id: 'LIST' }],
        }),
        updateWalletAmount: builder.mutation({
            query: ({ userEmail, data }) => ({
                url: `/wallet/update/${userEmail}/`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: ["Wallet"]
        }),
        getWalletSummary: builder.query({
            query: () => ({
                url: "/wallet-summary/",
                method: "GET",
            }),
            providesTags: ["Wallet"],
        })
    }),
});

export const {
    useGetWalletQuery,
    useGetTransactionsQuery,
    useUpdateWalletAmountMutation,
    useGetWalletSummaryQuery
} = walletApi;