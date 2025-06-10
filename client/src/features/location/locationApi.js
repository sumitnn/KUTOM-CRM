import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const locationApi = createApi({
    reducerPath: 'locationApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    endpoints: (builder) => ({
        // Fetch list of states
        getStates: builder.query({
            query: () => ({
                url: '/states/',
                method: 'GET',
            }),
        }),

        // Fetch districts based on the selected state
        getDistricts: builder.query({
            query: (stateId) => ({
                url: `/states/${stateId}/districts/`,
                method: 'GET',
            }),
        }),
    }),
});

export const {
    useGetStatesQuery,
    useGetDistrictsQuery,
} = locationApi;
