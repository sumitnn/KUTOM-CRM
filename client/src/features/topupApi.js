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
    }),
});

export const {
    useGetTopupRequestQuery,
    useUpdateTopupRequestMutation,
} = topupApi;
