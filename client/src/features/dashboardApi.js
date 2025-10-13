// features/dashboard/dashboardApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../utils/axiosBaseQuery';

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getDashboardData: builder.query({
            query: (period = 'today') => ({
                url: '/dashboard-summary/', // Your API endpoint
                method: 'GET',
                params: { period }
            }),
            providesTags: ['Dashboard'],
        }),
        getADMINDashboardData: builder.query({
            query: (period = 'today') => ({
                url: '/admin-dashboard-summary/', // Your API endpoint
                method: 'GET',
                params: { period }
            }),
            providesTags: ['Dashboard'],
        })
    }),
});

export const {
    useGetDashboardDataQuery,
    useGetADMINDashboardDataQuery

 } = dashboardApi;