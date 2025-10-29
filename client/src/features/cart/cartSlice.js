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

            // BEST PRACTICE: Use cartItemId for exact matching
            const existing = state.items.find((i) => i.cartItemId === item.cartItemId);

            if (existing) {
                // If item already exists, update quantity
                existing.quantity += item.quantity;

                // Update bulk price if quantity changes
                if (existing.variant?.bulk_prices?.length > 0) {
                    const sortedBulkPrices = [...existing.variant.bulk_prices].sort((a, b) => b.max_quantity - a.max_quantity);
                    existing.bulk_price = sortedBulkPrices.find(bulk => existing.quantity >= bulk.max_quantity) || null;
                }
            } else {
                // If new item, add to cart
                state.items.push(item);
            }
            saveCart(state.items);
        },
        removeItem(state, action) {
            // Remove by cartItemId for precise removal
            state.items = state.items.filter((i) => i.cartItemId !== action.payload);
            saveCart(state.items);
        },
        updateQuantity(state, action) {
            const { cartItemId, quantity } = action.payload;
            const item = state.items.find((i) => i.cartItemId === cartItemId);

            if (item) {
                item.quantity = quantity;

                // Update bulk pricing based on new quantity
                if (item.variant?.bulk_prices?.length > 0) {
                    const sortedBulkPrices = [...item.variant.bulk_prices].sort((a, b) => b.max_quantity - a.max_quantity);
                    item.bulk_price = sortedBulkPrices.find(bulk => quantity >= bulk.max_quantity) || null;
                }
            }
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