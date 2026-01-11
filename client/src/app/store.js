// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";

import authReducer from "../features/auth/authSlice";

import { orderApi } from "../features/order/orderApi";
import { walletApi } from "../features/walletApi";
import { topupApi } from "../features/topupApi";
import { stockistApi } from "../features/stockist/StockistApi";
import { vendorApi } from "../features/vendor/VendorApi";
import { brandApi } from "../features/brand/brandApi";
import { categoryApi } from "../features/category/categoryApi";
import { productApi } from "../features/product/productApi";
import cartReducer from "../features/cart/cartSlice";
import { locationApi } from "../features/location/locationApi";
import { resellerApi } from "../features/reseller/resellerApi";
import { profileApi } from "../features/profile/profileApi";
import { announcementApi } from "../features/announcement/announcementApi";
import { dashboardApi } from "../features/dashboardApi";
import { stocksApi } from "../features/stocks/stocksApi";
import { notificationApi } from "../features/notification/notificationApi";
import { newAccountApplicationApi } from "../features/newapplication/newAccountApplicationApi";
import { salesApi } from "../features/sales/salesApi";
import { commissionsApi } from "../features/commission/commissionApi";

import { orderRequestApi } from "../features/order/orderRequest";
import { customerPurchaseApi } from "../features/customerpurchase/customerPurchaseApi";
import { expiryApi } from "../features/expiry/expiryApi";
import { replacementApi } from "../features/returned/replacementApi";
import { adminProductApi } from '../features/adminproduct/adminProductApi';


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
        [announcementApi.reducerPath]: announcementApi.reducer,
        [dashboardApi.reducerPath]: dashboardApi.reducer,
        [stocksApi.reducerPath]: stocksApi.reducer,
        [notificationApi.reducerPath]: notificationApi.reducer,
        [newAccountApplicationApi.reducerPath]: newAccountApplicationApi.reducer,
        [salesApi.reducerPath]: salesApi.reducer,
        [commissionsApi.reducerPath]: commissionsApi.reducer,
        [adminProductApi.reducerPath]: adminProductApi.reducer,
        [orderRequestApi.reducerPath]: orderRequestApi.reducer,
        [customerPurchaseApi.reducerPath]: customerPurchaseApi.reducer,
        [expiryApi.reducerPath]: expiryApi.reducer,
        [replacementApi.reducerPath]: replacementApi.reducer
       
        
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
            dashboardApi.middleware,
            stocksApi.middleware,
            notificationApi.middleware,
            newAccountApplicationApi.middleware,
            salesApi.middleware,
            commissionsApi.middleware,
            adminProductApi.middleware,
            orderRequestApi.middleware,
            customerPurchaseApi.middleware,
            replacementApi.middleware,
            expiryApi.middleware
        ),
});
