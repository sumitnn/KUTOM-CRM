// src/features/cart/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

const loadCart = () => {
    try {
        const data = localStorage.getItem("cart");
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveCart = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
};

const initialState = {
    items: loadCart(),
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItem(state, action) {
            const item = action.payload;
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                state.items.push(item);
            }
            saveCart(state.items);
        },
        removeItem(state, action) {
            state.items = state.items.filter((i) => i.id !== action.payload);
            saveCart(state.items);
        },
        updateQuantity(state, action) {
            const { id, quantity } = action.payload;
            const item = state.items.find((i) => i.id === id);
            if (item) item.quantity = quantity;
            saveCart(state.items);
        },
        clearCart(state) {
            state.items = [];
            saveCart([]);
        },
    },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
