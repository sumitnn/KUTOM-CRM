// features/topup/topupApi.js 
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../utils/axiosBaseQuery'; 

export const topupApi = createApi({
    reducerPath: 'topupApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getTopupRequest: builder.query({
            query: () => ({
                url: '/topup-request/',
                method: 'GET',
            }),
        }),
        updateTopupRequest: builder.mutation({
            query: ({ topupId, data }) => ({
                url: `/topup-request/update/${topupId}/`,
                method: 'PUT',
                data, 
            }),
        }),

        GetMyTopupRequest: builder.query({
            query: () => ({
                url: '/topup-request/',
                method: 'GET',
            }),
         
        }),
        CreateTopupRequest: builder.mutation({
            query: (formData) => ({
                url: "/topup-request/",
                method: "POST",
                data: formData,
            }),
          
        }),
        CreateWithdrawlRequest: builder.mutation({
            query: (formData) => ({
                url: "/withdrawl-request/",
                method: "POST",
                data: formData,
            }),

        }),
        getWithdrawlRequest: builder.query({
            query: () => ({
                url: '/withdrawl-request/',
                method: 'GET',
            }),
        }),
        getAdminWithdrawals: builder.query({
            query: (params) => ({
                url: '/admin/withdrawals/',
                method: 'GET',
                params,
            }),
            providesTags: ['Withdrawal'],
        }),
        getWithdrawalDetails: builder.query({
            query: (id) => ({
                url: `/admin/withdrawals/${id}/`,
                method: 'GET',
            }),
            providesTags: ['Withdrawal'],
        }),
        updateWithdrawal: builder.mutation({
            query: ({ id, data }) => ({
                url: `/admin/withdrawals/${id}/`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: ['Withdrawal'],
        })
    }),
});

export const {
    useGetTopupRequestQuery,
    useUpdateTopupRequestMutation,
    useCreateTopupRequestMutation,
    useGetMyTopupRequestQuery,
    useCreateWithdrawlRequestMutation,
    useGetWithdrawlRequestQuery,
    useGetAdminWithdrawalsQuery,
    useGetWithdrawalDetailsQuery,
    useUpdateWithdrawalMutation
} = topupApi;
