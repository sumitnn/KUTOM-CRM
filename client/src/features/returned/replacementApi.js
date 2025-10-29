import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const replacementApi = createApi({
    reducerPath: 'replacementApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Replacements'],
    endpoints: (builder) => ({
        // Create replacement request
        createReplacement: builder.mutation({
            query: (replacementData) => ({
                url: `/replacement/create/`,
                method: 'POST',
                data: replacementData
            }),
            invalidatesTags: ['Replacements'],
        }),

        // Get replacement requests list
        getReplacements: builder.query({
            query: ({ page = 1, pageSize = 10,is_own=false, status }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    page_size: pageSize.toString(),
                    is_own:is_own,
                    ...(status && { status })
                });
                return {
                    url: `/replacement/list/?${params}`,
                    method: "GET"
                };
            },
            providesTags: ['Replacements'],
        }),

        
        updateStatus: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/replacements/${id}/update-status/`,
                method: 'POST',
                data
            }),
            invalidatesTags: ['Replacements'],
        }),

       
    }),
});

export const {
    useCreateReplacementMutation,
    useGetReplacementsQuery,
    useApproveReplacementMutation,
    useCompleteReplacementMutation,
    useUpdateStatusMutation
} = replacementApi;