// salesApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const salesApi = createApi({
    reducerPath: 'salesApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getVendorSales: builder.query({
            query: ({ range = 'today', search = '', startDate, endDate }) => ({
                url: `/sales/vendor/`,
                method: 'GET',
                params: {
                    range,
                    search,
                    ...(startDate && { start_date: startDate }),
                    ...(endDate && { end_date: endDate })
                }
            }),
        }),
        exportVendorSales: builder.mutation({
            query: ({ range = 'today', search = '', startDate, endDate }) => ({
                url: `/sales/vendor/export/`,
                method: 'GET',
                params: {
                    range,
                    search,
                    ...(startDate && { start_date: startDate }),
                    ...(endDate && { end_date: endDate })
                },
                responseHandler: (response) => response.blob(),
            }),
        }),
    }),
});

export const {
    useGetVendorSalesQuery,
    useExportVendorSalesMutation
} = salesApi;