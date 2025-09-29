// commissionsApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const commissionsApi = createApi({
    reducerPath: 'commissionsApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Commission'],
    endpoints: (builder) => ({
        // Get commission for a specific product
        getProductCommission: builder.query({
            query: (productId) => ({
                url: `/commissions/${productId}/`,
                method: 'GET',
            }),
            providesTags: (result, error, productId) => [{ type: 'Commission', id: productId }],
        }),

        // Update commission for a product
        updateProductCommission: builder.mutation({
            query: ({ productId, ...data }) => ({
                url: `/commissions/${productId}/`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: (result, error, { productId }) => [{ type: 'Commission', id: productId }],
        }),

        // Create commission for a product
        createProductCommission: builder.mutation({
            query: (data) => ({
                url: '/commissions/',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Commission'],
        }),

        // List all commissions (optional)
        listCommissions: builder.query({
            query: ({ page = 1, pageSize = 10, search = '' } = {}) => ({
                url: '/commissions/',
                method: 'GET',
                params: {
                    page,
                    page_size: pageSize,
                    search,
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map(({ id }) => ({ type: 'Commission', id })),
                        { type: 'Commission', id: 'LIST' },
                    ]
                    : [{ type: 'Commission', id: 'LIST' }],
        }),

        // Delete commission (optional)
        deleteCommission: builder.mutation({
            query: (productId) => ({
                url: `/commissions/${productId}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Commission'],
        }),
    }),
});

export const {
    useGetProductCommissionQuery,
    useUpdateProductCommissionMutation,
    useCreateProductCommissionMutation,
    useListCommissionsQuery,
    useDeleteCommissionMutation,
} = commissionsApi;