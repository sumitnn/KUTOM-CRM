
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const newAccountApplicationApi = createApi({
    reducerPath: 'newAccountApplicationApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['NewAccountApplication'],
    endpoints: (builder) => ({

        // 🔹 Admin - fetch all applications
        getAllAccountApplications: builder.query({
            query: (params = {}) => ({
                url: '/applications/',
                method: 'GET',
                params: {
                    ...(params.status && { status: params.status }),
                    ...(params.search && { search: params.search }),
                    ...(params.search_type && { search_type: params.search_type }),
                },
            }),
            providesTags: ['NewAccountApplication']
          }),

        // 🔹 Admin - approve an application
        approveAccountApplication: builder.mutation({
            query: (id) => ({
                url: `/applications/${id}/approve/`,
                method: 'POST'
            }),
            invalidatesTags: ['NewAccountApplication']
        }),

        // 🔹 Admin - reject an application
        rejectAccountApplication: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/applications/${id}/reject/`,
                method: 'POST',
                data: { reason }  
            }),
            invalidatesTags: ['NewAccountApplication']
          }),
    }),
});

export const {
    useGetAllAccountApplicationsQuery,
    useApproveAccountApplicationMutation,
    useRejectAccountApplicationMutation
} = newAccountApplicationApi;
