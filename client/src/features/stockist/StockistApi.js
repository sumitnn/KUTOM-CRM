import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const stockistApi = createApi({
    reducerPath: 'stockistApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        fetchStockists: builder.query({
            query: (params = {}) => ({
                url: '/users-list/',
                method: 'GET',
                params: {
                    role: 'stockist',
                    ...(params.status && { status: params.status }),
                    ...(params.search && { search: params.search }),
                    ...(params.search_type && { search_type: params.search_type }),
                },
            }),
            providesTags: ['Stockist']
        }),
        fetchStockistsByState: builder.query({
            query: (stateId) => ({
                url: `/stockists/${stateId}/`,
                method: 'GET',
            }),
        }),
        createStockist: builder.mutation({
            query: (stockistData) => ({
                url: '/register/',
                method: 'POST',
                data: { ...stockistData, role: 'stockist' },
            }),
        }),
        updateStockist: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-user/${id}/`,
                method: 'PUT',
                data,
            }),
        }),
        updateStockistStatus: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-user-status/${id}/`,
                method: 'PUT',
                data,
            }),
        }),
        deleteStockist: builder.mutation({
            query: (id) => ({
                url: `/delete-user/${id}/`,
                method: 'DELETE',
                data: { user_id: id },
            }),
        }),
    }),
});

export const {
    useFetchStockistsQuery,
    useFetchStockistsByStateQuery,
    useCreateStockistMutation,
    useUpdateStockistMutation,
    useUpdateStockistStatusMutation,
    useDeleteStockistMutation,
} = stockistApi;
