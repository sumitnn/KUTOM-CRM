// features/vendor/vendorApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const vendorApi = createApi({
    reducerPath: 'vendorApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        fetchVendors: builder.query({
            query: (params = {}) => ({
                url: '/users-list/',
                method: 'GET',
                params: {
                    role: 'vendor',
                    ...(params.status && { status: params.status }),
                    ...(params.search && { search: params.search }),
                    ...(params.search_type && { search_type: params.search_type }),
                },
            }),
            providesTags: ['Vendor']
          }),
        createVendor: builder.mutation({
            query: (vendorData) => ({
                url: '/register/',
                method: 'POST',
                data: { ...vendorData, role: 'vendor' },
            }),
        }),
        updateVendor: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-user/${id}/`,
                method: 'PUT',
                data,
            }),
        }),
        updateVendorStatus: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-user-status/${id}/`,
                method: 'PUT',
                data,
            }),
        }),
        deleteVendor: builder.mutation({
            query: (id) => ({
                url: `/delete-user/${id}/`,
                method: 'DELETE',
                data: { user_id: id },
            }),
        }),
    }),
});
export const {
    useFetchVendorsQuery,
    useCreateVendorMutation,
    useUpdateVendorMutation,
    useDeleteVendorMutation,
    useUpdateVendorStatusMutation,
} = vendorApi;