
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
                    ...(params.role && { role: params.role }),
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
        updateProfileApprovalStatus: builder.mutation({
            query: ({ userId, data }) => ({
                url: `/update-profile-status/${userId}/`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: ['NewAccountApplication'],
        }),
        getProfileApprovalStatus: builder.query({
            query: (userId) => ({
                url: `/get-profile-status/${userId}/`,
                method: 'GET',
            }),
            providesTags: ['NewAccountApplication'],
        }),
        updateUserAccountKyc: builder.mutation({
            query: ({ userId}) => ({
                url: `/admin/user-kyc-verify/${userId}/`,
                method: 'POST',
                data: {}
            }),
            invalidatesTags: ['NewAccountApplication']
        })
    }),
   
});

export const {
    useGetAllAccountApplicationsQuery,
    useApproveAccountApplicationMutation,
    useRejectAccountApplicationMutation,
    useUpdateProfileApprovalStatusMutation,
    useGetProfileApprovalStatusQuery,
    useUpdateUserAccountKycMutation
} = newAccountApplicationApi;
