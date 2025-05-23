
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const topupApi = createApi({
    reducerPath: "topupApi",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_BACKEND_API_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("access_token");
            if (token) {
                headers.set("authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getTopupRequest: builder.query({
            query: () => `/topup-request/`,
        }),
        updateTopupRequest: builder.mutation({
            query: ({ topupId, data }) => ({
                url: `/topup-request/update/${topupId}/`,
                method: "PUT",
                body: data,
              }),
        }),
    }),
});

export const {
    useGetTopupRequestQuery,
    useUpdateTopupRequestMutation
} = topupApi;
