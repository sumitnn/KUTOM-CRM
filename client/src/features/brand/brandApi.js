// src/features/brand/brandApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const brandApi = createApi({
    reducerPath: 'brandApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Brand'],
    endpoints: (builder) => ({
        getBrands: builder.query({
            query: (search) => {
                const params = {};
                if (search) {
                    params.search = search;
                }
                return {
                    url: '/brands/',
                    method: 'GET',
                    params: params
                };
            },
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
              
            }),
            invalidatesTags: ['Brand'],
        }),
        updateBrand: builder.mutation({
            query: ({ id, data }) => ({
                url: `/brands/${id}/`,
                method: 'PUT',
                data,
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
