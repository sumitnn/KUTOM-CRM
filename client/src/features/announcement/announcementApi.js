import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const announcementApi = createApi({
    reducerPath: 'announcementApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Announcement'],
    endpoints: (builder) => ({
        getAnnouncements: builder.query({
            query: () => ({
                url: '/announcements/',
                method: 'GET',
            }),
            providesTags: ['Announcement'],
        }),

        createAnnouncement: builder.mutation({
            query: (data) => ({
                url: '/announcements/',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Announcement'],
        }),

        updateAnnouncement: builder.mutation({
            query: ({ id, data }) => ({
                url: `/announcements/${id}/`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: ['Announcement'],
        }),

        deleteAnnouncement: builder.mutation({
            query: (id) => ({
                url: `/announcements/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Announcement'],
        }),
    }),
});

export const {
    useGetAnnouncementsQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
} = announcementApi;
