// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";

import authReducer from "../features/auth/authSlice";

import { orderApi } from "../features/order/orderApi";
import { walletApi } from "../features/walletApi";
import { topupApi } from "../features/topupApi";
import { stockistApi } from "../features/stockist/stockistApi";
import { vendorApi } from "../features/vendor/VendorApi";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [vendorApi.reducerPath]:vendorApi.reducer,
        [stockistApi.reducerPath]:stockistApi.reducer,
        [orderApi.reducerPath]: orderApi.reducer,
        [walletApi.reducerPath]: walletApi.reducer,
        [topupApi.reducerPath]:topupApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, vendorApi.middleware, stockistApi.middleware, orderApi.middleware,
            walletApi.middleware,
            topupApi.middleware
        ),
});
