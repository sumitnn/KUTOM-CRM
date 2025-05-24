// src/features/api/orderApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const orderApi = createApi({
    reducerPath: 'orderApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getAdminOrders: builder.query({
            query: ({ filter = 'all', page = 1 }) => ({
                url: `/orders/admin/?filter=${filter}&page=${page}`,
                method: 'GET',
            }),
        }),
    }),
});

export const { useGetAdminOrdersQuery } = orderApi;
