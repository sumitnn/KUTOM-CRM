import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const orderApi = createApi({
    reducerPath: 'orderApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        // Admin: all orders by filter
        getAdminOrders: builder.query({
            query: ({ filter = 'all', page = 1 }) => ({
                url: `/orders/admin/?filter=${filter}&page=${page}`,
                method: 'GET',
            }),
        }),

        // Reseller: all my orders (can be filtered by status)
        getMyOrders: builder.query({
            query: ({ status = 'all', page = 1 }) => ({
                url: `/orders/my-orders/?status=${status}&page=${page}`,
                method: 'GET',
            }),
        }),

        // Create order (already done)
        createOrder: builder.mutation({
            query: (orderData) => ({
                url: `/orders/`,
                method: 'POST',
                data: orderData,
            }),
        }),
        createBulkOrders: builder.mutation({
            query: (ordersArray) => ({
                url: '/orders/bulk-create/',
                method: 'POST',
                data: ordersArray,
            }),
        }),
        getOrderSummary: builder.query({
            query: () => ({
                url: '/orders/summary/',
                method: 'GET',
            }),
          }),
    }),
});

export const {
    useGetAdminOrdersQuery,
    useGetMyOrdersQuery,
    useCreateOrderMutation,
    useCreateBulkOrdersMutation,
    useGetOrderSummaryQuery
} = orderApi;
