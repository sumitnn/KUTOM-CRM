// notificationApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const notificationApi = createApi({
    reducerPath: 'notificationApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Notifications'],
    endpoints: (builder) => ({
        getTodayNotifications: builder.query({
            query: () => ({
                url: '/notifications/today/',
                method: 'GET',
            }),
            providesTags: ['Notifications'],
        }),

        markNotificationAsRead: builder.mutation({
            query: (notificationId) => ({
                url: `/notifications/${notificationId}/read/`,
                method: 'PATCH', // or 'POST' depending on your backend
            }),
            invalidatesTags: ['Notifications'],
        }),

        markAllNotificationsAsRead: builder.mutation({
            query: () => ({
                url: '/notifications/mark-all-read/',
                method: 'POST',
            }),
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const {
    useGetTodayNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation
} = notificationApi;