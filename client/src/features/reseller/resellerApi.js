
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const resellerApi = createApi({
    reducerPath: 'resellerApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        fetchReseller: builder.query({
            query: () => ({
                url: '/users-list/?role=reseller',
                method: 'GET',
            }),
        }),
        createReseller: builder.mutation({
            query: (resellerData) => ({
                url: '/register/',
                method: 'POST',
                data: { ...resellerData, role: 'reseller' },
            }),
        }),
        updateReseller: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-user/${id}/`,
                method: 'PUT',
                data,
            }),
        }),
        deleteReseller: builder.mutation({
            query: (id) => ({
                url: `/delete-user/${id}/`,
                method: 'DELETE',
                data: { user_id: id },
            }),
        }),
    }),
});

export const {
    useFetchResellerQuery,
    useCreateResellerMutation,
    useUpdateResellerMutation,
    useDeleteResellerMutation,
} = resellerApi;
