import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery'; // adjust path if needed

export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Product', 'ProductSize'],
    endpoints: (builder) => ({
        getAllProducts: builder.query({
            query: (params = {}) => ({
                url: "products/",
                method: "GET",
                params: {
                    ...(params.search && { search: params.search }),
                    ...(params.category && { category: params.category }),
                    ...(params.subCategory && { sub_category: params.subCategory }),
                },
            }),
            providesTags: ["Product"],
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
        getProductStats: builder.query({
            query: () => ({
                url: '/products/stats/',
                method: 'GET',
            }),
        }),
        getProductsByStatus: builder.query({
            query: (status) => ({
                url: `/products/by-status/`,
                method: 'GET',
                params: { status }, 
            }),
            providesTags: ['Product'],
        }),
        getVendorActiveProducts: builder.query({
            query: () => ({
                url: 'vendor/products/',
                method: 'GET',
            }),
            providesTags: ['Product'],
        }),

        getProductSizes: builder.query({
            query: (productId) => ({
                url: `vendor/products/${productId}/sizes/`,
                method: 'GET',
            }),
            providesTags: ['ProductSize'],
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
    useGetProductStatsQuery,
    useGetProductsByStatusQuery,
    useGetVendorActiveProductsQuery,
    useGetProductSizesQuery,
} = productApi;
