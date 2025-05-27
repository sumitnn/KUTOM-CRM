import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';
export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Product'],
    endpoints: (builder) => ({
        // Get all products
        getProducts: builder.query({
            query: () => '/products/',
            providesTags: ['Product'],
        }),

        // Get a single product by ID (optional)
        getProductById: builder.query({
            query: (id) => `/products/${id}/`,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        }),

        // Add new product
        addProduct: builder.mutation({
            query: (newProduct) => ({
                url: '/products/',
                method: 'POST',
                body: newProduct,
            }),
            invalidatesTags: ['Product'],
        }),

        // Update existing product
        updateProduct: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/products/${id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'Product'],
        }),

        // Delete a product
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
    useGetProductsQuery,
    useGetProductByIdQuery,
    useAddProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;
