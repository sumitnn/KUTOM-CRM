import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const resellerApi = createApi({
    reducerPath: ['resellerApi','StockistReseller'],
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        fetchResellers: builder.query({
            query: (params = {}) => ({
                url: '/users-list/',
                method: 'GET',
                params: {
                    role: 'reseller',
                    ...(params.status && { status: params.status }),
                    ...(params.search && { search: params.search }),
                    ...(params.search_type && { search_type: params.search_type }),
                },
            }),
            providesTags: ['Reseller']
        }),
        fetchMyReseller: builder.query({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();

                // Add pagination params
                if (params.page) queryParams.append('page', params.page);
                if (params.limit) queryParams.append('limit', params.limit);

                // Add filter params
                if (params.search) queryParams.append('search', params.search);
                if (params.state) queryParams.append('state', params.state);
                if (params.district) queryParams.append('district', params.district);
                if (params.postal_code) queryParams.append('postal_code', params.postal_code);

                return {
                    url: `/assigned-resellers/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
                    method: 'GET',
                };
            },
            providesTags: ['StockistReseller'],
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
        updateResellerStatus: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-user-status/${id}/`,
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
    useFetchResellersQuery,
    useFetchMyResellerQuery,
    useCreateResellerMutation,
    useUpdateResellerMutation,
    useUpdateResellerStatusMutation,
    useDeleteResellerMutation,
} = resellerApi;
