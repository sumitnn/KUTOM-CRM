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
        [productApi.reducerPath]:productApi.reducer,
        
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, vendorApi.middleware, stockistApi.middleware, orderApi.middleware,
            walletApi.middleware,
            topupApi.middleware,
            brandApi.middleware,
            categoryApi.middleware,
            productApi.middleware,
        ),
});
