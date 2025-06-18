import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const profileApi = createApi({
    reducerPath: 'profileApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        getPaymentDetails: builder.query({
            query: () => ({
                url: '/payment-details/',
                method: 'GET',
            }),
        }),
        getProfile: builder.query({
            query: () => ({
                url: '/profile/',
                method: 'GET',
            }),
        }),
        updateProfile: builder.mutation({
            query: (data) => ({
                url: '/profile/',
                method: 'PUT',
                data, 
            }),
        }),
        
    }),
});

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useGetPaymentDetailsQuery,
} = profileApi;
