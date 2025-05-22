// features/vendor/vendorApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const stockistApi = createApi({
    reducerPath: 'stockistApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_BACKEND_API_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        fetchStockist: builder.query({
            query: () => 'users-list/?role=stockist',
        }),
        createStockist: builder.mutation({
            query: (stockistData) => ({
                url: 'register/',
                method: 'POST',
                body: { ...stockistData, role: 'stockist' },
            }),
        }),
        updateStockist: builder.mutation({
            query: ({ id, data }) => ({
                url: `update-user/${id}/`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteStockist: builder.mutation({
            query: (id) => ({
                url: `delete-user/${id}/`,
                method: 'DELETE',
                body: { user_id: id },
            }),
        }),
    }),
});

export const {
    useFetchStockistQuery,
    useCreateStockistMutation,
    useUpdateStockistMutation,
    useDeleteStockistMutation,
} = stockistApi;
