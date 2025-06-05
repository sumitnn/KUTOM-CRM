import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery'; // adjust path if needed

export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Product'],
    endpoints: (builder) => ({
        getAllProducts: builder.query({
            query: () => ({
                url: '/products/',
                method: 'GET',
            }),
            providesTags: ['Product'],
        }),

        getMyProducts: builder.query({
            query: () => ({
                url: '/products/my-products/',
                method: 'GET',
            }),
            providesTags: ['Product'],
        }),

        getProductById: builder.query({
            query: (id) => ({
                url: `/products/${id}/`,
                method: 'GET',
            }),
        }),

        createProduct: builder.mutation({
            query: (data) => ({
                url: '/products/',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Product'],
        }),

        updateProduct: builder.mutation({
            query: ({ id, data }) => ({
                url: `/products/${id}/`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: ['Product'],
        }),

        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `/products/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product'],
        }),
    }),
});

export const {
    useGetAllProductsQuery,
    useGetMyProductsQuery,        
    useGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;
