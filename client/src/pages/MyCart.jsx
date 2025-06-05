import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../features/cart/cartSlice";
import { useCreateOrderMutation } from "../features/order/orderApi";

const MyCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [placeOrder, { isLoading }] = useCreateOrderMutation();

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );

  const handleCheckout = async () => {
    try {
      const orderData = {
        items: cartItems.map(({ id, quantity }) => ({
          product_id: id,
          quantity,
        })),
        total: totalPrice,
      };

      await placeOrder(orderData).unwrap();
      dispatch(clearCart());
      alert("Order placed successfully!");
    } catch (err) {
      alert("Order failed: " + (err?.data?.message || "Something went wrong."));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-8">My Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 py-20 text-xl">
            Your cart is empty.
          </p>
        ) : (
          <>
            <div className="space-y-6">
              {cartItems.map(({ id, name, price, quantity, image }) => (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b pb-4"
                >
                  <img
                    src={image || "/placeholder.png"}
                    alt={name}
                    className="w-20 h-20 rounded object-cover"
                    onError={(e) => {
                      if (!e.target.src.includes("/placeholder.png")) {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.png";
                      }
                    }}
                  />
                  <div className="flex-grow">
                    <h2 className="text-lg font-semibold">{name}</h2>
                    <p className="text-gray-600">₹{Number(price).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ id, quantity: quantity - 1 }))
                      }
                      className="btn btn-sm btn-outline"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        dispatch(
                          updateQuantity({
                            id,
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        )
                      }
                      className="w-12 text-center border rounded"
                    />
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ id, quantity: quantity + 1 }))
                      }
                      className="btn btn-sm btn-outline"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-20 text-right font-semibold">
                  ₹{(Number(price) * quantity).toFixed(2)}

                  </div>

                  <button
                    onClick={() => dispatch(removeItem(id))}
                    className="btn btn-sm btn-error ml-4"
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <p className="text-xl font-semibold">
                Total: ₹{totalPrice.toFixed(2)}
              </p>
              <button
                disabled={cartItems.length === 0 || isLoading}
                className="btn btn-primary px-6 py-2 text-lg"
                onClick={handleCheckout}
              >
                {isLoading ? "Processing..." : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyCart;
