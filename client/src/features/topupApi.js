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
                url: '/new-topup-request/',
                method: 'GET',
            }),
         
        }),
        CreateTopupRequest: builder.mutation({
            query: (formData) => ({
                url: "/new-topup-request/",
                method: "POST",
                data: formData,
            }),
          
          })
    }),
});

export const {
    useGetTopupRequestQuery,
    useUpdateTopupRequestMutation,
    useCreateTopupRequestMutation,
    useGetMyTopupRequestQuery
} = topupApi;
