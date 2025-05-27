import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['Category', 'Subcategory'],
    endpoints: (builder) => ({
        // Categories
        getCategories: builder.query({
            query: () => '/categories/',
            providesTags: ['Category'],
        }),
        addCategory: builder.mutation({
            query: (newCategory) => ({
                url: '/categories/',
                method: 'POST',
                body: newCategory,
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/categories/${id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Category'],
        }),
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `/categories/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Category', 'Subcategory'],
        }),

        // Subcategories
        getSubcategories: builder.query({
            query: () => '/subcategories/',
            providesTags: ['Subcategory'],
        }),
        addSubcategory: builder.mutation({
            query: (newSubcategory) => ({
                url: '/subcategories/',
                method: 'POST',
                body: newSubcategory,
            }),
            invalidatesTags: ['Subcategory'],
        }),
        updateSubcategory: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/subcategories/${id}/`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Subcategory'],
        }),
        deleteSubcategory: builder.mutation({
            query: (id) => ({
                url: `/subcategories/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Subcategory'],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useGetSubcategoriesQuery,
    useAddSubcategoryMutation,
    useUpdateSubcategoryMutation,
    useDeleteSubcategoryMutation,
} = categoryApi;
