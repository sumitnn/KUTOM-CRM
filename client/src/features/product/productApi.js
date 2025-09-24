import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Product', 'ProductSize','MY-Product'],
    endpoints: (builder) => ({
        getAllProducts: builder.query({
            query: (params = {}) => ({
                url: "products/",
                method: "GET",
                params: {
                    ...(params.search && { search: params.search }),
                    ...(params.category && { category: params.category }),
                    ...(params.subCategory && { sub_category: params.subCategory }),
                    ...(params.page && { page: params.page }),
                    ...(params.pageSize && { page_size: params.pageSize }),
                },
            }),
            providesTags: ["Product"],
        }),

        getMyProducts: builder.query({
            query: (params = {}) => ({
                url: '/products/my-products/',
                method: 'GET',
                params: {
                    page: params.page || 1,
                    page_size: params.pageSize || 10,
                    search: params.search || '',
                    featured: params.featured || '',
                    category: params.category || '',
                    brand: params.brand || '',
                    sort_by: params.sortField || 'name',
                    sort_direction: params.sortDirection || 'asc',
                },
            }),
            providesTags: ['MY-Product'],
        }),

        getProductById: builder.query({
            query: (id) => ({
                url: `/products/${id}/`,
                method: 'GET',
            }),
        }),
        getAdminProductById: builder.query({
            query: (id) => ({
                url: `/admin-products/${id}/`,
                method: 'GET',
            }),
        }),
        updateProductPrice: builder.mutation({
            query: ({ productId, variantId, priceData }) => ({
                url: `/products/${productId}/variants/${variantId}/price/`,
                method: 'PUT',
                data: priceData,
            }),
            invalidatesTags: ['MY-Product', 'Product'],
        }),
        updateProductFeaturedStatus: builder.mutation({
            query: ({ productId, isFeatured }) => ({
                url: `/products/${productId}/featured/`,
                method: 'PUT',
                data: { is_featured: isFeatured },
            }),
            invalidatesTags: ['MY-Product', 'Product'],
        }),
        updateCommission: builder.mutation({
            query: ({ productId, commissionData }) => ({
                url: `/products/${productId}/commission/`,
                method: 'PUT',
                data: commissionData,
            }),
            invalidatesTags: ['MY-Product', 'Product', 'Commission'],
        }),

        getCommission: builder.query({
            query: (productId) => ({
                url: `/products/${productId}/commission/`,
                method: 'GET',
            }),
            providesTags: ['Commission'],
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

        updateProductStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/products/${id}/status/`,
                method: 'PUT',
                data: { status }, 
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Product', id },
                { type: 'Product', id: 'LIST' }
            ],
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
            query: ({ status, page = 1, pageSize = 10 }) => ({
                url: `/products/by-status/`,
                method: 'GET',
                params: {
                    status,
                    page,
                    page_size: pageSize
                },
            }),
            providesTags: ['Product'],
        }),

        getVendorActiveProducts: builder.query({
            query: (params = {}) => ({
                url: 'vendor/products/',
                method: 'GET',
                params: {
                    ...(params.page && { page: params.page }),
                    ...(params.pageSize && { page_size: params.pageSize }),
                },
            }),
            providesTags: ['Product'],
        }),
        getAdminAllProducts: builder.query({
            query: (params = {}) => ({
                url: 'admin/products/',
                method: 'GET',
                params: {
                    ...(params.page && { page: params.page }),
                    ...(params.pageSize && { page_size: params.pageSize }),
                },
            }),
            providesTags: ['Product'],
        }),
        getAdminActiveProducts: builder.query({
            query: (params = {}) => ({
                url: 'admin/products/',
                method: 'GET',
                params: {
                    ...(params.page && { page: params.page }),
                    ...(params.pageSize && { page_size: params.pageSize }),
                },
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
        getAdminProductSizes: builder.query({
            query: (productId) => ({
                url: `admin/products/${productId}/sizes/`,
                method: 'GET',
            }),
            providesTags: ['AdminProductSize'],
        }),
    }),
});

export const {
    useGetAllProductsQuery,
    useLazyGetAllProductsQuery,
    useGetMyProductsQuery,
    useLazyGetMyProductsQuery,
    useGetProductByIdQuery,
    useLazyGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useUpdateProductStatusMutation,
    useDeleteProductMutation,
    useGetProductStatsQuery,
    useLazyGetProductStatsQuery,
    useGetProductsByStatusQuery,
    useLazyGetProductsByStatusQuery,
    useGetVendorActiveProductsQuery,
    useLazyGetVendorActiveProductsQuery,
    useGetProductSizesQuery,
    useLazyGetProductSizesQuery,
    useGetAdminActiveProductsQuery,
    useGetAdminAllProductsQuery,
    useGetAdminProductSizesQuery,
    useGetAdminProductByIdQuery,
    useGetCommissionQuery,
    useUpdateCommissionMutation,
    useUpdateProductFeaturedStatusMutation,
    useUpdateProductPriceMutation
} = productApi;