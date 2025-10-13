import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const customerPurchaseApi = createApi({
    reducerPath: 'customerPurchaseApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['CustomerPurchase', 'CustomerPurchaseVaraints','CustomerPurchaseProducts'],
    endpoints: (builder) => ({
        // Create new customer purchase
        createCustomerPurchase: builder.mutation({
            query: (purchaseData) => ({
                url: '/customer/purchases/create/',
                method: 'POST',
                data: purchaseData,
            }),
            invalidatesTags: ['CustomerPurchase'],
        }),

        // Get all customer purchases with pagination
        getCustomerPurchases: builder.query({
            query: ({ page = 1, pageSize = 10 }) => ({
                url: `/customer/purchases/?page=${page}&page_size=${pageSize}`,
                method: 'GET',
            }),
            providesTags: ['CustomerPurchase'],
        }),

        // Get single purchase by ID
        getCustomerPurchase: builder.query({
            query: (id) => ({
                url: `/customer/purchases/${id}/`,
                method: 'GET',
            }),
            providesTags: ['CustomerPurchase'],
        }),

        // Get all purchases without pagination (for exports, etc.)
        getAllCustomerPurchases: builder.query({
            query: () => ({
                url: '/customer/purchases/',
                method: 'GET',
            }),
            providesTags: ['CustomerPurchase'],
        }),
        getCustomerPurchaseVaraiantList: builder.query({
            query: (id) => ({
                url: `/customer/varaints/?product_id=${id}`,
                method: 'GET',
                data: id
            }),
            providesTags: ['CustomerPurchaseVaraints'],
        }),

        // Get all purchases without pagination (for exports, etc.)
        getCustomerPurchasesProductList: builder.query({
            query: () => ({
                url: 'customer/products/',
                method: 'GET',
            }),
            providesTags: ['CustomerPurchaseProducts'],
        }),
    }),
});

export const {
    useCreateCustomerPurchaseMutation,
    useGetCustomerPurchasesQuery,
    useGetCustomerPurchaseQuery,
    useGetAllCustomerPurchasesQuery,
    useGetCustomerPurchaseVaraiantListQuery,
    useGetCustomerPurchasesProductListQuery
} = customerPurchaseApi;