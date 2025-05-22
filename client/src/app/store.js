// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";
import { vendorApi } from "../features/vendor/vendorApi";
import authReducer from "../features/auth/authSlice";
import { stockistApi } from "../features/stockist/StockistApi";
import { orderApi } from "../features/order/orderApi";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [vendorApi.reducerPath]: vendorApi.reducer,
        [stockistApi.reducerPath]: stockistApi.reducer,
        [orderApi.reducerPath]: orderApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, vendorApi.middleware,stockistApi.middleware,orderApi.middleware),
});
