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
            const existing = state.items.find((i) =>
                i.id === item.id &&
                (!i.size || i.size.id === item.size?.id)
            );

            if (existing) {
                existing.quantity += item.quantity;
                // Update price tier if quantity changes
                if (existing.size?.price_tiers) {
                    const sortedTiers = [...existing.size.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity);
                    existing.price_tier = sortedTiers.find(tier => existing.quantity >= tier.min_quantity) || null;
                    if (existing.price_tier) {
                        existing.price = existing.price_tier.price;
                    }
                }
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
            const { id, quantity, priceTier } = action.payload;
            const item = state.items.find((i) => i.id === id);
            if (item) {
                item.quantity = quantity;
                if (priceTier) {
                    item.price_tier = priceTier;
                    item.price = priceTier.price;
                } else if (item.size?.price_tiers) {
                    // Recalculate price tier if not provided
                    const sortedTiers = [...item.size.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity);
                    item.price_tier = sortedTiers.find(tier => quantity >= tier.min_quantity) || null;
                    if (item.price_tier) {
                        item.price = item.price_tier.price;
                    } else {
                        item.price = item.size.price;
                        item.price_tier = null;
                    }
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