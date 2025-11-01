import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const customerPurchaseApi = createApi({
    reducerPath: 'customerPurchaseApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['CustomerPurchase', 'CustomerPurchaseVaraints', 'CustomerPurchaseProducts','CustomerListSearch'],
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
                url: '/customer/products/',
                method: 'GET',
            }),
            providesTags: ['CustomerPurchaseProducts'],
        }),
        // Search customers endpoint
        searchCustomers: builder.query({
            query: (search) => ({
                url: `/customer/search-customers/?search=${search}`,
                method: 'GET',
            }),
            providesTags: ['CustomerListSearch'],
        }),
        getVariantBuyingPrice: builder.query({
            query: ({ variantId, userId, role = 'vendor' }) => ({
                url: `/customer/variant-price/?variant_id=${variantId}&user_id=${userId}&role=${role}`,
                method: 'GET',
            }),
        }),

        // Get variant buying price
        lazyGetVariantBuyingPrice: builder.query({
            query: ({ variantId, userId, role = 'vendor' }) => ({
                url: `/customer/variant-price/?variant_id=${variantId}&user_id=${userId}&role=${role}`,
                method: 'GET',
            }),
        }),
    }),
});

export const {
    useCreateCustomerPurchaseMutation,
    useGetCustomerPurchaseQuery,
    useGetAllCustomerPurchasesQuery,
    useGetCustomerPurchaseVaraiantListQuery,
    useGetCustomerPurchasesProductListQuery,
    useLazySearchCustomersQuery,
    useGetVariantBuyingPriceQuery,
    useLazyGetVariantBuyingPriceQuery // Add this export
   
} = customerPurchaseApi;