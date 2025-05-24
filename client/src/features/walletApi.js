// features/wallet/walletApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '..//utils/axiosBaseQuery'; 

export const walletApi = createApi({
    reducerPath: 'walletApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getWallet: builder.query({
            query: () => ({
                url: '/wallet/',
                method: 'GET',
            }),
        }),
        getTransactions: builder.query({
            query: ({ page = 1 } = {}) => ({
                url: `/wallet/transactions/?page=${page}`,
                method: 'GET',
            }),
        }),
        updateWalletAmount: builder.mutation({
            query: ({ userEmail, data }) => ({
                url: `/wallet/update/${userEmail}/`,
                method: 'PUT',
                data, 
            }),
        }),
    }),
});

export const {
    useGetWalletQuery,
    useGetTransactionsQuery,
    useUpdateWalletAmountMutation,
} = walletApi;
