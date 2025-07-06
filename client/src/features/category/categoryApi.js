import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../utils/axiosBaseQuery';

export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: axiosBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL }),
    tagTypes: ['MainCategory', 'Category', 'Subcategory'],
    endpoints: (builder) => ({
        //maincategory
        getMainCategories: builder.query({
            query: (search = '') => ({
                url: `/main-categories/?search=${search}`,
                method: 'GET',
            }),
            providesTags: ['MainCategory'],
        }),
        addMainCategory: builder.mutation({
            query: (newCategory) => ({
                url: '/main-categories/',
                method: 'POST',
                data: newCategory,
            }),
            invalidatesTags: ['MainCategory'],
        }),
        updateMainCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/main-categories/${id}/`,
                method: 'PUT',
                data
            }),
            invalidatesTags: ['MainCategory'],
        }),
        deleteMainCategory: builder.mutation({
            query: (id) => ({
                url: `/main-categories/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['MainCategory'],
        }),

        // Categories
        getCategories: builder.query({
            query: (search = '') => ({
                url: `/categories/?search=${search}`,
                method: 'GET',
            }),
            providesTags: ['Category'],
        }),
        addCategory: builder.mutation({
            query: (newCategory) => ({
                url: '/categories/',
                method: 'POST',
                data: newCategory,
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/categories/${id}/`,
                method: 'PATCH',
                data: data,
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
        getSubcategoriesByCategory: builder.query({
            query: (categoryId) => ({
                url: `/subcategories/${categoryId}/`,
                method: 'GET',
            }),
            providesTags: ['Subcategory'],
        }),
        getSubcategories: builder.query({
            query: (search = '') => ({
                url: `/subcategories/?search=${search}`,
                method: 'GET',
            }),
            providesTags: ['Subcategory'],
        }),
        addSubcategory: builder.mutation({
            query: (newSubcategory) => ({
                url: '/subcategories/',
                method: 'POST',
                data: newSubcategory,
            }),
            invalidatesTags: ['Subcategory'],
        }),
        updateSubcategory: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/subcategories/${id}/`,
                method: 'PUT',
                data: data,
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
    useGetSubcategoriesByCategoryQuery,
    useAddMainCategoryMutation,
    useDeleteMainCategoryMutation,
    useGetMainCategoriesQuery,
    useUpdateMainCategoryMutation
} = categoryApi;