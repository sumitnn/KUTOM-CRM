// features/stockist/stockistApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const stockistApi = createApi({
    reducerPath: 'stockistApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Stockist', 'DefaultStockist', 'StockistAssignment'],
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
        markDefaultStockist: builder.mutation({
            query: ({ id, is_default }) => ({
                url: `/mark-default-stockist/${id}/`,
                method: 'POST',
                data: { is_default },
            }),
            invalidatesTags: ['Stockist', 'DefaultStockist']
        }),

        getNotDefaultStockist: builder.query({
            query: () => ({
                url: '/not-default-stockist/',
                method: 'GET',
            }),
            providesTags: ['DefaultStockist']
        }),

        // Stockist Assignment APIs
        getStockistAssignment: builder.query({
            query: (resellerId) => ({
                url: `/stockist-assignments/${resellerId}/`,
                method: 'GET',
            }),
            providesTags: (result, error, resellerId) =>
                [{ type: 'StockistAssignment', id: resellerId }]
        }),

        assignStockistToReseller: builder.mutation({
            query: ({ resellerId, stockistId }) => ({
                url: '/stockist-assignments/',
                method: 'POST',
                data: { reseller_id: resellerId, stockist_id: stockistId },
            }),
            invalidatesTags: (result, error, { resellerId }) => [
                { type: 'StockistAssignment', id: resellerId },
                'StockistAssignment'
            ]
        }),

        removeStockistAssignment: builder.mutation({
            query: (resellerId) => ({
                url: `/stockist-assignments/${resellerId}/`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, resellerId) => [
                { type: 'StockistAssignment', id: resellerId },
                'StockistAssignment'
            ]
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
    useMarkDefaultStockistMutation,
    useGetNotDefaultStockistQuery,
    useGetStockistAssignmentQuery,
    useAssignStockistToResellerMutation,
    useRemoveStockistAssignmentMutation,
} = stockistApi;