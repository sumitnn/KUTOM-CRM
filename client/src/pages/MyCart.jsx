import React, { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../features/cart/cartSlice";
import { useCreateBulkOrdersMutation } from "../features/order/orderApi";
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";
import { BsShieldCheck } from "react-icons/bs";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const LazyImage = lazy(() => import("./LazyImage"));

const calculateItemPrice = (item) => {
  // If we have bulk prices in the variant
  if (item.variant?.bulk_prices?.length > 0) {
    // Sort bulk prices by max_quantity in ascending order to find the best match
    const sortedBulkPrices = [...item.variant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
    
    // Find the appropriate bulk price based on quantity
    // We want the highest tier that the quantity qualifies for
    let applicableBulkPrice = null;
    
    for (const bulkPrice of sortedBulkPrices) {
      if (item.quantity <= bulkPrice.max_quantity) {
        applicableBulkPrice = bulkPrice;
        break;
      }
    }
    
    // If no tier found (quantity exceeds all), use the last (highest) tier
    if (!applicableBulkPrice && sortedBulkPrices.length > 0) {
      applicableBulkPrice = sortedBulkPrices[sortedBulkPrices.length - 1];
    }
    
    if (applicableBulkPrice) {
      return applicableBulkPrice.price;
    }
  }
  
  // If no bulk pricing, use the variant price or regular price
  return item.variant?.product_variant_prices?.[0]?.price || item.price;
};

const calculateGSTForItem = (item) => {
  const itemPrice = calculateItemPrice(item);
  const subtotal = Number(itemPrice) * (item.quantity || 1);
  
  // Calculate GST based on either fixed amount or percentage
  let gstAmount = 0;
  
  // Check if we have variant pricing with GST info
  if (item.variant?.product_variant_prices?.[0]) {
    const variantPricing = item.variant.product_variant_prices[0];
    
    if (variantPricing.gst_tax) {
      // If fixed GST tax amount is provided
      gstAmount = Number(variantPricing.gst_tax) * (item.quantity || 1);
    } else if (variantPricing.gst_percentage) {
      // If GST percentage is provided
      gstAmount = (subtotal * Number(variantPricing.gst_percentage)) / 100;
    }
  } else {
    // Fallback to item-level GST if available
    if (item.gst_tax) {
      gstAmount = Number(item.gst_tax) * (item.quantity || 1);
    } else if (item.gst_percentage) {
      gstAmount = (subtotal * Number(item.gst_percentage)) / 100;
    }
  }
  
  return gstAmount;
};

const MyCart = ({ role }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [placeBulkOrder, { isLoading }] = useCreateBulkOrdersMutation();

  // Calculate subtotal (price of all items without GST and shipping)
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (calculateItemPrice(item) || 0) * (item.quantity || 1),
    0
  );

  // Calculate total GST for all items
  const totalGST = cartItems.reduce(
    (acc, item) => acc + calculateGSTForItem(item),
    0
  );

  // Calculate shipping cost
  const shippingCost = 0;

  // Calculate final total
  const totalPrice = subtotal + shippingCost + totalGST;

  const handleQuantityChange = (id, newQuantity) => {
    const item = cartItems.find(item => item.id === id);
    if (!item) return;

    let bulkPrice = null;
    
    // Determine the appropriate bulk price based on the new quantity
    if (item.variant?.bulk_prices?.length > 0) {
      // Sort bulk prices by max_quantity in ascending order
      const sortedBulkPrices = [...item.variant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
      
      // Find the applicable bulk price
      let applicableBulkPrice = null;
      
      for (const bulkPrice of sortedBulkPrices) {
        if (newQuantity <= bulkPrice.max_quantity) {
          applicableBulkPrice = bulkPrice;
          break;
        }
      }
      
      // If no tier found (quantity exceeds all), use the last (highest) tier
      if (!applicableBulkPrice && sortedBulkPrices.length > 0) {
        applicableBulkPrice = sortedBulkPrices[sortedBulkPrices.length - 1];
      }
      
      if (applicableBulkPrice) {
        bulkPrice = applicableBulkPrice;
      }
    }

    dispatch(updateQuantity({
      id,
      quantity: Math.max(1, newQuantity),
      bulkPrice
    }));
  };

  const handleCheckout = async () => {
    try {
      const orderData = {
        items: cartItems.map(({ id, quantity, variant, bulk_price, gst_tax, gst_percentage }) => ({
          product_id: id,
          quantity,
          variant_id: variant?.id || null,
          bulk_price_id: bulk_price?.id || null,
          gst_tax: gst_tax || null,
          gst_percentage: gst_percentage || null
        })),
        subtotal,
        shipping: shippingCost,
        gst: totalGST,
        total: totalPrice,
      };

      await placeBulkOrder(orderData).unwrap();
      dispatch(clearCart());
      toast.success("Order placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Something went wrong.");
    }
  };

  // Helper function to get the base price (without any bulk discounts)
  const getBasePrice = (item) => {
    return item.variant?.product_variant_prices?.[0]?.price || item.price;
  };

  // Helper function to get the current bulk price tier info
  const getBulkPriceInfo = (item) => {
    if (item.variant?.bulk_prices?.length > 0) {
      const sortedBulkPrices = [...item.variant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
      
      let applicableBulkPrice = null;
      
      for (const bulkPrice of sortedBulkPrices) {
        if (item.quantity <= bulkPrice.max_quantity) {
          applicableBulkPrice = bulkPrice;
          break;
        }
      }
      
      // If no tier found (quantity exceeds all), use the last (highest) tier
      if (!applicableBulkPrice && sortedBulkPrices.length > 0) {
        applicableBulkPrice = sortedBulkPrices[sortedBulkPrices.length - 1];
      }
      
      return applicableBulkPrice;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Cart Section */}
          <div className="lg:w-2/3">
            <div className="bg-white shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Your Shopping Cart</h1>
                  <p className="text-gray-500 mt-1 font-medium">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => dispatch(clearCart())}
                    className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center cursor-pointer"
                  >
                    <FiTrash2 className="mr-1" /> Clear all
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 text-gray-400">
                    <FiShoppingBag className="w-full h-full" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h3>
                  <p className="mt-2 text-gray-500">Start adding some items to your cart</p>
                  <div className="mt-6">
                    <Link
                      to={`/${role}/products`}
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => {
                    const itemPrice = calculateItemPrice(item);
                    const basePrice = getBasePrice(item);
                    const bulkPriceInfo = getBulkPriceInfo(item);
                    const itemGST = calculateGSTForItem(item);
                    const { id, name, price, quantity, image, variant, color, description } = item;
                    
                    return (
                      <div key={id} className="p-6 flex flex-col sm:flex-row group hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 relative">
                          <Suspense fallback={<div className="w-32 h-32 bg-gray-200 rounded-lg animate-pulse" />}>
                            <LazyImage
                              src={image || "/placeholder.png"}
                              alt={name}
                              className="w-32 h-32 rounded-lg object-cover cursor-pointer"
                              onError={(e) => {
                                if (!e.target.src.includes("/placeholder.png")) {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.png";
                                }
                              }}
                            />
                          </Suspense>
                        
                          {variant?.name && (
                              <span className="absolute top-2 left-2 bg-white/90 text-xs font-bold px-2 py-1 rounded-md shadow-sm cursor-default">
                                {variant.name}
                              </span>
                            )}
                        </div>

                        <div className="mt-4 sm:mt-0 sm:ml-6 flex-grow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-extrabold text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors">
                                {name}
                              </h3>
                              {color && (
                                <div className="mt-1 flex items-center">
                                  <span className="text-sm text-gray-500 mr-2">Color:</span>
                                  <span 
                                    className="w-4 h-4 rounded-full border border-gray-300 cursor-pointer"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                </div>
                              )}
                              <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                                {description}
                              </p>
                              {bulkPriceInfo && (
                                <div className="mt-1 text-xs text-green-600">
                                  Bulk discount applied (up to {bulkPriceInfo.max_quantity} units)
                                </div>
                              )}
                              {variant?.product_variant_prices?.[0] && (
                                <div className="mt-1 text-xs text-blue-600">
                                  {variant.product_variant_prices[0].gst_tax ? 
                                    `GST: ₹${variant.product_variant_prices[0].gst_tax} per unit` : 
                                    `GST: ${variant.product_variant_prices[0].gst_percentage}%`
                                  }
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => dispatch(removeItem(id))}
                              className="ml-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                              title="Remove item"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center">
                              <button
                                onClick={() => handleQuantityChange(id, quantity - 1)}
                                className={`p-2 rounded-lg ${quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'} transition-colors`}
                                disabled={quantity <= 1}
                              >
                                <FiMinus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(id, Math.max(1, Number(e.target.value)))}
                                className="mx-2 w-14 text-center border border-gray-300 rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <button
                                onClick={() => handleQuantityChange(id, quantity + 1)}
                                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                              >
                                <FiPlus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-gray-500 font-bold">Unit Price</p>
                              <p className="text-lg font-extrabold text-gray-900">
                                ₹{Number(itemPrice).toFixed(2)}
                                {Number(itemPrice) < Number(basePrice) && (
                                  <span className="ml-1 text-sm text-gray-500 line-through">
                                    ₹{Number(basePrice).toFixed(2)}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                Subtotal: ₹{(Number(itemPrice) * quantity).toFixed(2)}
                              </p>
                              <p className="text-sm text-blue-600">
                                GST: ₹{itemGST.toFixed(2)}
                              </p>
                              <p className="text-lg font-bold text-indigo-600 mt-1">
                                Total: ₹{((Number(itemPrice) * quantity) + itemGST).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trust Badges */}
            {cartItems.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center">
                  <TbTruckDelivery className="text-indigo-600 text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Free Delivery</p>
                    <p className="text-gray-500 text-xs">On orders over ₹500</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center">
                  <FiShoppingBag className="text-indigo-600 text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Easy Returns</p>
                    <p className="text-gray-500 text-xs">30-day return policy</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center">
                  <BsShieldCheck className="text-indigo-600 text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Secure Checkout</p>
                    <p className="text-gray-500 text-xs">100% secure payment</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="lg:w-1/3">
              <div className="bg-white shadow-sm rounded-xl overflow-hidden sticky top-6">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-xl font-extrabold text-gray-900">Order Summary</h2>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">Subtotal</p>
                    <p className="text-gray-900 font-bold">₹{subtotal.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">GST (Tax):</p>
                    <p className="text-gray-900 font-bold">₹{totalGST.toFixed(2)}</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="flex justify-between">
                      <p className="text-lg font-extrabold text-gray-900">Total</p>
                      <p className="text-xl font-extrabold text-indigo-600">
                        ₹{totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    disabled={cartItems.length === 0 || isLoading}
                    className={`w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-lg shadow-sm text-base font-extrabold text-white ${
                      isLoading || cartItems.length === 0
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
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
                      'Proceed to Checkout'
                    )}
                  </button>
                  <div className="mt-4 flex justify-center">
                    <Link
                      to={`/${role}/products`}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-bold cursor-pointer transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCart;