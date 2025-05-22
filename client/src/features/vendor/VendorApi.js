// features/vendor/vendorApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const vendorApi = createApi({
    reducerPath: 'vendorApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_BACKEND_API_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        fetchVendors: builder.query({
            query: () => 'users-list/?role=vendor',
        }),
        createVendor: builder.mutation({
            query: (vendorData) => ({
                url: 'register/',
                method: 'POST',
                body: { ...vendorData, role: 'vendor' },
            }),
        }),
        updateVendor: builder.mutation({
            query: ({ id, data }) => ({
                url: `update-user/${id}/`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteVendor: builder.mutation({
            query: (id) => ({
                url: `delete-user/${id}/`,
                method: 'DELETE',
                body: { user_id: id },
            }),
        }),
    }),
});

export const {
    useFetchVendorsQuery,
    useCreateVendorMutation,
    useUpdateVendorMutation,
    useDeleteVendorMutation,
} = vendorApi;
