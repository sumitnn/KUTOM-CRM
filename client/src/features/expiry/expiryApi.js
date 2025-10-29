import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const expiryApi = createApi({
    reducerPath: 'expiryApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['ExpiryProducts', 'ExpiryRequests'],
    endpoints: (builder) => ({
        // Get expiring products list
        getExpiringProducts: builder.query({
            query: ({ page = 1, pageSize = 10 }) => ({
                url: `/expiry/products/?page=${page}&page_size=${pageSize}`,
                method: "GET"
            }),
            providesTags: ['ExpiryProducts'],
        }),

        // Create expiry request
        createExpiryRequest: builder.mutation({
            query: (expiryData) => ({
                url: `/expiry/request/create/`,
                method: 'POST',
                data: expiryData
            }),
            invalidatesTags: ['ExpiryRequests'],
        }),

        // Approve expiry request
        approveExpiryRequest: builder.mutation({
            query: (requestId) => ({
                url: `/expiry/request/${requestId}/approve/`,
                method: 'POST'
            }),
            invalidatesTags: ['ExpiryRequests'],
        }),

        // Complete expiry request
        completeExpiryRequest: builder.mutation({
            query: (requestId) => ({
                url: `/expiry/request/${requestId}/complete/`,
                method: 'POST'
            }),
            invalidatesTags: ['ExpiryRequests'],
        }),
    }),
});

export const {
    useGetExpiringProductsQuery,
    useCreateExpiryRequestMutation,
    useApproveExpiryRequestMutation,
    useCompleteExpiryRequestMutation
} = expiryApi;