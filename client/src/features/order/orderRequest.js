// orderRequestApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const orderRequestApi = createApi({
    reducerPath: 'orderRequestApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['OrderRequest', 'StockistOrderRequests','ResellerOrderRequest'],
    endpoints: (builder) => ({
        // Get all order requests with filters and pagination
        getOrderRequests: builder.query({
            query: ({ status, user_email, page = 1, page_size = 10 }) => {
                const params = new URLSearchParams();
                if (status) params.append('status', status);
                if (user_email) params.append('user_email', user_email);
                params.append('page', page);
                params.append('page_size', page_size);

                return {
                    url: `/new-order-requests/?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['OrderRequest'],
        }),

        // Get order requests by status (for tabs)
        getOrderRequestsByStatus: builder.query({
            query: ({ status, page = 1, page_size = 10 }) => ({
                url: `/order-requests/status/${status}/?page=${page}&page_size=${page_size}`,
                method: 'GET',
            }),
            providesTags: ['OrderRequest','StockistOrderRequests'],
        }),

        getResellerOrderRequestsByStatus: builder.query({
            query: ({ status, page = 1, page_size = 10 }) => ({
                url: `/reseller-order-requests/status/${status}/?page=${page}&page_size=${page_size}`,
                method: 'GET',
            }),
            providesTags: ['OrderRequest', 'ResellerOrderRequest'],
        }),

        // Get specific order request details
        getOrderRequestById: builder.query({
            query: (id) => ({
                url: `/order-requests/${id}/`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'OrderRequest', id }],
        }),
        getResellerOrderRequestById: builder.query({
            query: (id) => ({
                url: `/reseller-order-requests/${id}/`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'OrderRequest', id }],
        }),

        // Create new order request
        createOrderRequest: builder.mutation({
            query: (orderRequestData) => ({
                url: '/new-order-requests/',
                method: 'POST',
                data: orderRequestData,
            }),
            invalidatesTags: ['StockistOrderRequests'],
        }),
        createOrderRequestReseller: builder.mutation({
            query: (orderRequestData) => ({
                url: '/reseller-order-requests/',
                method: 'POST',
                data: orderRequestData,
            }),
            invalidatesTags: ['ResellerOrderRequest'],
        }),

        // Update order request status (approve/reject/cancel)
        updateOrderRequestStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/order-requests/${id}/update-status/`,
                method: 'POST',
                data: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                'OrderRequest',
                { type: 'OrderRequest', id }
            ],
        }),
        updateResellerOrderRequestStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/reseller-order-requests/${id}/update-status/`,
                method: 'POST',
                data: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                'ResellerOrderRequest',
                { type: 'ResellerOrderRequest', id }
            ],
        }),

        // Update order request details (excluding status)
        updateOrderRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/order-requests/${id}/`,
                method: 'PATCH',
                data: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                'OrderRequest',
                { type: 'OrderRequest', id }
            ],
        }),

        // Delete order request
        deleteOrderRequest: builder.mutation({
            query: (id) => ({
                url: `/order-requests/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['OrderRequest'],
        }),
        getOrderRequestsReport: builder.query({
            query: ({ range = 'last_3_days', search = '', startDate, endDate, status = 'approved' }) => {
                const params = new URLSearchParams();
                params.append('range', range);
                if (search) params.append('search', search);
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);
                if (status) params.append('status', status);

                return {
                    url: `/order-requests/report/?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['StockistOrderRequests'],
        }),

        // Export order requests report
        exportOrderRequests: builder.mutation({
            query: ({ range = 'last_3_days', search = '', startDate, endDate, status = 'approved' }) => {
                const params = new URLSearchParams();
                params.append('range', range);
                if (search) params.append('search', search);
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);
                if (status) params.append('status', status);

                return {
                    url: `/order-requests/export/?${params.toString()}`,
                    method: 'GET',
                    responseHandler: (response) => response.text(), // keep if backend returns file/text
                };
            },
        }),
      
    }),
});

export const {
    useGetOrderRequestsQuery,
    useLazyGetOrderRequestsQuery,
    useGetOrderRequestsByStatusQuery,
    useLazyGetOrderRequestsByStatusQuery,
    useGetOrderRequestByIdQuery,
    useCreateOrderRequestMutation,
    useUpdateOrderRequestStatusMutation,
    useUpdateOrderRequestMutation,
    useDeleteOrderRequestMutation,
    useGetOrderRequestsReportQuery,
    useExportOrderRequestsMutation,
    useCreateOrderRequestResellerMutation,
    useGetResellerOrderRequestsByStatusQuery,
    useGetResellerOrderRequestByIdQuery,
    useUpdateResellerOrderRequestStatusMutation

} = orderRequestApi;




