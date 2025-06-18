// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";

import authReducer from "../features/auth/authSlice";

import { orderApi } from "../features/order/orderApi";
import { walletApi } from "../features/walletApi";
import { topupApi } from "../features/topupApi";
import { stockistApi } from "../features/stockist/stockistApi";
import { vendorApi } from "../features/vendor/VendorApi";
import { brandApi } from "../features/brand/brandApi";
import { categoryApi } from "../features/category/categoryApi";
import { productApi } from "../features/product/productApi";
import cartReducer from "../features/cart/cartSlice";
import { locationApi } from "../features/location/locationApi";
import { resellerApi } from "../features/reseller/resellerApi";
import { profileApi } from "../features/profile/profileApi";
import { announcementApi } from "../features/announcement/announcementApi";



export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart:cartReducer,
        [authApi.reducerPath]: authApi.reducer,
        [vendorApi.reducerPath]:vendorApi.reducer,
        [stockistApi.reducerPath]:stockistApi.reducer,
        [orderApi.reducerPath]: orderApi.reducer,
        [walletApi.reducerPath]: walletApi.reducer,
        [topupApi.reducerPath]: topupApi.reducer,
        [brandApi.reducerPath]: brandApi.reducer,
        [categoryApi.reducerPath]: categoryApi.reducer,
        [productApi.reducerPath]: productApi.reducer,
        [locationApi.reducerPath]: locationApi.reducer,
        [resellerApi.reducerPath]: resellerApi.reducer,
        [profileApi.reducerPath]: profileApi.reducer,
        [announcementApi.reducerPath]:announcementApi.reducer,
        
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, vendorApi.middleware, stockistApi.middleware, orderApi.middleware,
            walletApi.middleware,
            topupApi.middleware,
            brandApi.middleware,
            categoryApi.middleware,
            productApi.middleware,
            locationApi.middleware,
            resellerApi.middleware,
            profileApi.middleware,
            announcementApi.middleware,
        ),
});
