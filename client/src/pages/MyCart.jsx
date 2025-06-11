import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../features/cart/cartSlice";
import { useCreateBulkOrdersMutation } from "../features/order/orderApi";
import { FiTrash2, FiPlus, FiMinus } from "react-icons/fi";

const MyCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [placeBulkOrder, { isLoading }] = useCreateBulkOrdersMutation();

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

      await placeBulkOrder(orderData).unwrap();
      dispatch(clearCart());
      alert("Order placed successfully!");
    } catch (err) {
      alert("Order failed: " + (err?.data?.message || "Something went wrong."));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Shopping Cart</h1>
            <p className="text-gray-500 mt-1">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-1 text-gray-500">Start adding some items to your cart</p>
              <div className="mt-6">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Continue Shopping
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {cartItems.map(({ id, name, price, quantity, image }) => (
                  <div key={id} className="p-6 flex flex-col sm:flex-row">
                    <div className="flex-shrink-0">
                      <img
                        src={image || "/placeholder.png"}
                        alt={name}
                        className="w-24 h-24 rounded-md object-cover"
                        onError={(e) => {
                          if (!e.target.src.includes("/placeholder.png")) {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.png";
                          }
                        }}
                      />
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-6 flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{name}</h3>
                          <p className="mt-1 text-sm text-gray-500">₹{Number(price).toFixed(2)} each</p>
                        </div>
                        <button
                          onClick={() => dispatch(removeItem(id))}
                          className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ id, quantity: quantity - 1 }))
                            }
                            className={`p-1 rounded-md ${quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            disabled={quantity <= 1}
                          >
                            <FiMinus className="h-4 w-4" />
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
                            className="mx-2 w-12 text-center border border-gray-300 rounded-md py-1 text-sm"
                          />
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ id, quantity: quantity + 1 }))
                            }
                            className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-lg font-medium text-gray-900">
                          ₹{(Number(price) * quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <p className="text-base text-gray-600">Subtotal</p>
                  <p className="text-lg font-medium text-gray-900">₹{totalPrice.toFixed(2)}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                <div className="mt-6">
                  <button
                    disabled={cartItems.length === 0 || isLoading}
                    className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${isLoading || cartItems.length === 0 ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    onClick={handleCheckout}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Checkout'
                    )}
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                  <a
                    href="/"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Continue Shopping
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCart;