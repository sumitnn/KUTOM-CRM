// src/features/brand/brandApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const brandApi = createApi({
    reducerPath: 'brandApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Brand'],
    endpoints: (builder) => ({
        getBrands: builder.query({
            query: () => ({
                url: '/brands/',
                method: 'GET',
            }),
            providesTags: ['Brand'],
        }),
        getBrandById: builder.query({
            query: (id) => ({
                url: `/brands/${id}/`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Brand', id }],
        }),
        createBrand: builder.mutation({
            query: (formData) => ({
                url: '/brands/',
                method: 'POST',
                data: formData, // axiosBaseQuery expects `data` for POST body
                headers: {
                    // For multipart/form-data, axiosBaseQuery can handle it if formData is FormData instance
                    // 'Content-Type': 'multipart/form-data' usually set automatically by axios with FormData
                },
            }),
            invalidatesTags: ['Brand'],
        }),
        updateBrand: builder.mutation({
            query: ({ id, formData }) => ({
                url: `/brands/${id}/`,
                method: 'PUT',
                data: formData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Brand', id }],
        }),
        deleteBrand: builder.mutation({
            query: (id) => ({
                url: `/brands/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Brand'],
        }),
    }),
});

export const {
    useGetBrandsQuery,
    useGetBrandByIdQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation,
} = brandApi;
