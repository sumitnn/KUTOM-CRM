
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';


export const stocksApi = createApi({
    reducerPath: 'stocksApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Stocks'],
    endpoints: (builder) => ({
        getStocks: builder.query({
            query: ({ status, page = 1, pageSize = 10 }) => ({
                url: `/stocks/?status=${status}&page=${page}&page_size=${pageSize}`,
                method: "GET"
            }),
            providesTags: ['Stocks'],
        }),

        createStock: builder.mutation({
            query: (stockData) => ({
                url: `/stocks/`,
                method: 'POST',
                data: stockData
            }),
            invalidatesTags: ['Stocks'],
        }),

        updateStock: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/stocks/${id}/`,
                method: 'PUT',
                data
            }),
            invalidatesTags: ['Stocks'],
        }),
    }),
});

export const {
    useGetStocksQuery,
    useCreateStockMutation,
    useUpdateStockMutation,
} = stocksApi;