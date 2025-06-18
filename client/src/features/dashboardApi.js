// features/dashboard/dashboardApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../utils/axiosBaseQuery';

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getDashboardData: builder.query({
            query: (days = 1) => ({
                url: '/dashboard-summary/',
                method: 'GET',
                params: { days }
            }),
            providesTags: ['Dashboard']
        }),
    }),
});

export const { useGetDashboardDataQuery } = dashboardApi;