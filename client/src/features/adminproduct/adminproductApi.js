// features/adminProduct/adminProductApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const adminProductApi = createApi({
    reducerPath: 'adminProductApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['AdminProduct'],
    endpoints: (builder) => ({
        getAdminProducts: builder.query({
            query: (params = {}) => ({
                url: '/admin-products/',
                method: 'GET',
                params: {
                    ...(params.search && { search: params.search }),
                    ...(params.category && { category: params.category }),
                    ...(params.subcategory && { subcategory: params.subcategory }),
                    ...(params.brand && { brand: params.brand }),
                    ...(params.is_active && { is_active: params.is_active }),
                },
            }),
            providesTags: ['AdminProduct'],
        }),
        getAdminProductById: builder.query({
            query: (id) => ({
                url: `/admin-products/${id}/`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'AdminProduct', id }],
        }),
        addToCart: builder.mutation({
            query: (data) => ({
                url: '/admin-products/add-to-cart/',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Cart'],
        }),
    }),
});

export const {
    useGetAdminProductsQuery,
    useGetAdminProductByIdQuery,
    useAddToCartMutation,
} = adminProductApi;