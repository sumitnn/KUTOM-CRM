import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const notificationApi = createApi({
    reducerPath: 'notificationApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getTodayNotifications: builder.query({
            query: () => ({
                url: '/notifications/today/',
                method: 'GET',
            }),
        }),
    }),
});

export const { useGetTodayNotificationsQuery } = notificationApi;
