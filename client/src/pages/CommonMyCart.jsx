import React, { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../features/cart/cartSlice";
import { useCreateBulkOrdersMutation } from "../features/order/orderApi";
import { useCreateOrderRequestMutation, useCreateOrderRequestResellerMutation } from "../features/order/orderRequest";
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft, FiUser, FiPercent, FiCheck } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";
import { BsShieldCheck } from "react-icons/bs";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const LazyImage = lazy(() => import("./LazyImage"));

// Get base price (without GST & discount) according to role
const getBasePrice = (variantPrices, role) => {
  if (!variantPrices || variantPrices.length === 0) return 0;
  
  const priceData = variantPrices[0];
  switch (role) {
    case "stockist":
      return parseFloat(priceData.stockist_actual_price || priceData.actual_price);
    case "reseller":
      return parseFloat(priceData.reseller_actual_price || priceData.actual_price);
    default:
      return parseFloat(priceData.actual_price);
  }
};

// Get role-based discount percentage
const getDiscountPercentage = (variantPrices, role) => {
  if (!variantPrices || variantPrices.length === 0) return 0;
  
  const priceData = variantPrices[0];
  return role === "stockist" ? priceData.stockist_discount : 
         role === "reseller" ? priceData.reseller_discount : 
         0;
};

// Get role-based GST percentage
const getGstPercentage = (variantPrices, role) => {
  if (!variantPrices || variantPrices.length === 0) return 0;
  
  const priceData = variantPrices[0];
  return role === "stockist" ? priceData.stockist_gst : 
         role === "reseller" ? priceData.reseller_gst : 
         priceData.gst_percentage;
};

// Calculate price breakdown for single item (same as product detail page)
const calculatePriceBreakdown = (variantPrices, role) => {
  if (!variantPrices || variantPrices.length === 0) {
    return {
      basePrice: 0,
      discountPercentage: 0,
      discountAmount: 0,
      priceAfterDiscount: 0,
      gstPercentage: 0,
      gstAmount: 0,
      finalPrice: 0
    };
  }

  const basePrice = getBasePrice(variantPrices, role);
  const discountPercentage = getDiscountPercentage(variantPrices, role);
  const gstPercentage = getGstPercentage(variantPrices, role);
  
  // Calculate discount amount
  const discountAmount = (basePrice * discountPercentage) / 100;
  const priceAfterDiscount = basePrice - discountAmount;
  
  // Calculate GST amount
  const gstAmount = (priceAfterDiscount * gstPercentage) / 100;
  const finalPrice = priceAfterDiscount + gstAmount;

  return {
    basePrice,
    discountPercentage,
    discountAmount,
    priceAfterDiscount,
    gstPercentage,
    gstAmount,
    finalPrice
  };
};

// Calculate total for current quantity (same as product detail page)
const calculateTotalPrice = (variantPrices, quantity, role) => {
  if (!variantPrices || variantPrices.length === 0) {
    return {
      totalBase: 0,
      totalDiscount: 0,
      totalPriceAfterDiscount: 0,
      totalGst: 0,
      totalFinal: 0
    };
  }

  const breakdown = calculatePriceBreakdown(variantPrices, role);
  
  return {
    totalBase: breakdown.basePrice * quantity,
    totalDiscount: breakdown.discountAmount * quantity,
    totalPriceAfterDiscount: breakdown.priceAfterDiscount * quantity,
    totalGst: breakdown.gstAmount * quantity,
    totalFinal: breakdown.finalPrice * quantity
  };
};

// Get available quantity from variant prices
const getAvailableQuantity = (variantPrices) => {
  if (!variantPrices || variantPrices.length === 0) return 0;
  return variantPrices[0].total_available_quantity;
};

const CommonMyCart = ({ role }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  
  const [placeBulkOrder, { isLoading: isBulkOrderLoading }] = useCreateBulkOrdersMutation();
  const [createOrderRequest, { isLoading: isOrderRequestLoading }] = useCreateOrderRequestMutation();
  const [createOrderRequestReseller, { isLoading: isResellerOrderRequestLoading }] = useCreateOrderRequestResellerMutation();
  
  const isLoading = isBulkOrderLoading || isOrderRequestLoading || isResellerOrderRequestLoading;

  // Calculate cart totals using the same logic as product detail page
  const cartTotals = cartItems.reduce((totals, item) => {
    const variantPrices = item.variant?.product_variant_prices;
    if (!variantPrices || variantPrices.length === 0) return totals;

    const itemTotal = calculateTotalPrice(variantPrices, item.quantity, role);
    
    return {
      subtotal: totals.subtotal + itemTotal.totalBase,
      totalDiscount: totals.totalDiscount + itemTotal.totalDiscount,
      totalPriceAfterDiscount: totals.totalPriceAfterDiscount + itemTotal.totalPriceAfterDiscount,
      totalGst: totals.totalGst + itemTotal.totalGst,
      totalFinal: totals.totalFinal + itemTotal.totalFinal
    };
  }, {
    subtotal: 0,
    totalDiscount: 0,
    totalPriceAfterDiscount: 0,
    totalGst: 0,
    totalFinal: 0
  });

  const shippingCost = 0;
  const totalPrice = cartTotals.totalFinal + shippingCost;

  // Get max available quantity for an item
  const getMaxAvailableQuantity = (item) => {
    if (item.variant?.product_variant_prices?.[0]?.total_available_quantity) {
      return Number(item.variant.product_variant_prices[0].total_available_quantity);
    }
    return 0; 
  };

  const handleQuantityChange = (cartItemId, newQuantity) => {
    const item = cartItems.find(item => item.cartItemId === cartItemId);
    if (!item) return;

    const maxAvailable = getMaxAvailableQuantity(item);
  
    // Prevent ordering more than available quantity
    if (maxAvailable === 0) {
      toast.error(`Sorry, This Product is currently out of stock`);
      return;
    }
    if (newQuantity > maxAvailable) {
      toast.error(`Only ${maxAvailable} units available for ${item.name}`);
      return;
    }

    dispatch(updateQuantity({
      cartItemId,
      quantity: Math.max(1, newQuantity)
    }));
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeItem(cartItemId));
  };

  const handleCheckout = async () => {
    // Check if any item exceeds available quantity before checkout
    const outOfStockItems = cartItems.filter(item => {
      const maxAvailable = getMaxAvailableQuantity(item);
      return item.quantity > maxAvailable;
    });
    
    if (outOfStockItems.length > 0) {
      if (role === "admin") {
        toast.error("Some items are Out Of Stock. Please contact the vendor to add more stock.");
      } else {
        toast.error("Some items exceed available quantity. Please adjust quantities.");
      }
      return;
    }

    try {
      if (role === "stockist" || role === "reseller") {
        const orderRequestData = {
          note: `Order request from ${user?.email} (${role})`,
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            rolebaseid: item.rolebaseid,
            variant: item.variant?.id,
            quantity: item.quantity
          }))
        };

        if (role === "stockist") {
          await createOrderRequest(orderRequestData).unwrap();
          toast.success("Order request submitted successfully! Waiting for admin approval.");
        } else if (role === "reseller") {
          await createOrderRequestReseller(orderRequestData).unwrap();
          toast.success("Order request submitted successfully! Waiting for stockist approval.");
        }
      } else {
        const orderData = {
          items: cartItems.map((item) => {
            const variantPrices = item.variant?.product_variant_prices;
            const breakdown = variantPrices ? calculatePriceBreakdown(variantPrices, role) : null;
            
            return {
              product_id: item.product_id,
              rolebaseid: item.rolebaseid,
              quantity: item.quantity,
              variant_id: item.variant?.id || null,
              unit_price: breakdown ? breakdown.finalPrice : item.final_price || 0,
              gst_tax: breakdown ? breakdown.gstAmount : item.gst_amount || 0,
              gst_percentage: breakdown ? breakdown.gstPercentage : item.gst_percentage || 0,
              discount_amount: breakdown ? breakdown.discountAmount : item.discount_amount || 0,
              discount_percentage: breakdown ? breakdown.discountPercentage : item.discount_percentage || 0,
            };
          }),
          subtotal: cartTotals.subtotal,
          shipping: shippingCost,
          gst: cartTotals.totalGst,
          discount: cartTotals.totalDiscount,
          total: totalPrice,
        };

        await placeBulkOrder(orderData).unwrap();
        toast.success("Order placed successfully!");
      }

      dispatch(clearCart());
      
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err?.data?.message || err?.data?.error || "Something went wrong.");
    }
  };

  const getCheckoutButtonText = () => {
    if (isLoading) {
      return (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      );
    }
    
    if (role === "stockist") {
      return "Submit Order Request to Admin";
    } else if (role === "reseller") {
      return "Submit Order Request to Stockist";
    } else {
      return "Proceed to Checkout";
    }
  };

  const getRoleBadge = () => {
    if (role === "stockist") {
      return {
        text: "Stockist Cart",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <FiUser className="mr-1" />
      };
    } else if (role === "reseller") {
      return {
        text: "Reseller Cart",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <FiPercent className="mr-1" />
      };
    }
    return {
      text: "Shopping Cart",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <FiShoppingBag className="mr-1" />
    };
  };

  const getOrderTypeMessage = () => {
    if (role === "stockist" || role === "reseller") {
      return (
        <div className={`${role === "stockist" ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border rounded-xl p-4 mb-4`}>
          <div className="flex items-center">
            <svg className={`w-5 h-5 ${role === "stockist" ? 'text-blue-600' : 'text-purple-600'} mr-2`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className={`${role === "stockist" ? 'text-blue-800' : 'text-purple-800'} font-medium text-sm`}>
              {role === "stockist" 
                ? "As a stockist, your order will be submitted as a request for admin approval. You'll receive special wholesale pricing."
                : "As a reseller, your order will be submitted as a request for stockist approval. You'll receive special reseller pricing."}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Empty cart state component
  const EmptyCart = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12">
      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
        <FiShoppingBag className="w-16 h-16 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h3>
      <p className="text-gray-500 max-w-md mb-8">
        {role === "stockist" 
          ? "Start adding wholesale products to your cart to place bulk orders."
          : role === "reseller"
          ? "Start adding products to your cart to place reseller orders."
          : "Looks like you haven't added any items to your cart yet. Start shopping to discover amazing products!"}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to={`/${role}/products`}
          className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200 hover:shadow-lg"
        >
          <FiShoppingBag className="mr-2" />
          {role === "stockist" ? "Browse Wholesale Products" : 
           role === "reseller" ? "Browse Reseller Products" : "Continue Shopping"}
        </Link>
        <button
          onClick={() => navigate(`/${role}/dashboard`)}
          className="inline-flex items-center px-8 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200"
        >
          <FiArrowLeft className="mr-2" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-8xl mx-auto">
        {/* Header - Only show when cart has items */}
        {cartItems.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={() => navigate(`/${role}/products`)}
              className="btn btn-ghost btn-sm mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Products
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {role === "stockist" ? "Stockist Order Cart" : 
                     role === "reseller" ? "Reseller Order Cart" : "Your Shopping Cart"}
                  </h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${roleBadge.color}`}>
                    {roleBadge.icon}
                    {roleBadge.text}
                  </span>
                </div>
                <p className="text-gray-500 font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
              <button
                onClick={() => dispatch(clearCart())}
                className="mt-2 sm:mt-0 text-red-500 hover:text-red-700 font-medium text-sm flex items-center cursor-pointer transition-colors"
              >
                <FiTrash2 className="mr-1" /> Clear all items
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Cart Section */}
            <div className="lg:w-2/3">
              <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {getOrderTypeMessage()}
                  {cartItems.map((item) => {
                    const variantPrices = item.variant?.product_variant_prices;
                    const breakdown = variantPrices ? calculatePriceBreakdown(variantPrices, role) : null;
                    const itemTotal = variantPrices ? calculateTotalPrice(variantPrices, item.quantity, role) : null;
                    
                    const { cartItemId, name, quantity, image, variant } = item;
                    const maxAvailable = getMaxAvailableQuantity(item);
                    const isMaxQuantity = quantity >= maxAvailable;
                    
                    return (
                      <div key={cartItemId} className="p-4 sm:p-6 flex flex-col sm:flex-row group hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 relative mb-4 sm:mb-0">
                          <Suspense fallback={<div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg animate-pulse" />}>
                            <LazyImage
                              src={image || "/placeholder.png"}
                              alt={name}
                              className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover cursor-pointer"
                              onError={(e) => {
                                if (!e.target.src.includes("/placeholder.png")) {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.png";
                                }
                              }}
                            />
                          </Suspense>
                        
                          {variant?.name && (
                            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-white/90 text-xs font-bold px-2 py-1 rounded-md shadow-sm cursor-default">
                              {variant.name}
                            </span>
                          )}
                        </div>

                        <div className="sm:ml-6 flex-grow">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-extrabold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2">
                                {name}
                              </h3>
                              
                              {/* Available Quantity Info */}
                              <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                Available: {maxAvailable} units
                              </div>
                              
                              {/* Discount and GST badges */}
                              {breakdown && (
                                <div className="mt-2 space-y-1">
                                  {breakdown.discountPercentage > 0 && (
                                    <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded inline-block mr-2">
                                      <FiPercent className="inline mr-1" />
                                      {breakdown.discountPercentage}% Role Discount
                                    </div>
                                  )}
                                  {breakdown.gstPercentage > 0 && (
                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                      GST: {breakdown.gstPercentage}%
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveItem(cartItemId)}
                              className="mt-2 sm:mt-0 sm:ml-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 self-start sm:self-center"
                              title="Remove item"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center">
                              <button
                                onClick={() => handleQuantityChange(cartItemId, quantity - 1)}
                                className={`p-2 rounded-lg ${quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'} transition-colors`}
                                disabled={quantity <= 1}
                              >
                                <FiMinus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={maxAvailable}
                                value={quantity}
                                onChange={(e) => handleQuantityChange(cartItemId, Math.max(1, Number(e.target.value)))}
                                className="mx-2 w-14 text-center border border-gray-300 rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <button
                                onClick={() => handleQuantityChange(cartItemId, quantity + 1)}
                                className={`p-2 rounded-lg ${isMaxQuantity ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'} transition-colors`}
                                disabled={isMaxQuantity}
                                title={isMaxQuantity ? `Maximum ${maxAvailable} units available` : ''}
                              >
                                <FiPlus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-right">
                              {/* Price breakdown per unit */}
                              {breakdown && (
                                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="text-sm text-gray-600 mb-2 font-semibold">Price per unit:</div>
                                  
                                  <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-500">Base Price:</span>
                                    <span className="font-medium">₹{breakdown.basePrice.toFixed(2)}</span>
                                  </div>
                                  
                                  {breakdown.discountPercentage > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1">
                                      <span className="text-red-500">Discount ({breakdown.discountPercentage}%):</span>
                                      <span className="font-medium text-red-500">-₹{breakdown.discountAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  {breakdown.discountPercentage > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1 bg-green-50 px-2 py-1 rounded">
                                      <span className="text-green-600 font-medium">After Discount:</span>
                                      <span className="font-medium text-green-600">₹{breakdown.priceAfterDiscount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  {breakdown.gstPercentage > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1">
                                      <span className="text-blue-500">GST ({breakdown.gstPercentage}%):</span>
                                      <span className="font-medium text-blue-500">+₹{breakdown.gstAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center text-base font-bold mt-2 pt-2 border-t border-gray-300">
                                    <span className="text-gray-900">Final Price:</span>
                                    <span className="text-green-600">₹{breakdown.finalPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}

                              {/* Total for this item */}
                              {itemTotal && (
                                <div className="bg-white border border-green-200 rounded-lg p-3">
                                  <div className="text-lg font-bold text-green-600 mb-1">
                                    Total: ₹{itemTotal.totalFinal.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {quantity} × ₹{breakdown?.finalPrice.toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center">
                  <TbTruckDelivery className="text-indigo-600 text-xl sm:text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Free Delivery</p>
                    <p className="text-gray-500 text-xs">On orders over ₹500</p>
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center">
                  <FiShoppingBag className="text-indigo-600 text-xl sm:text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Easy Returns</p>
                    <p className="text-gray-500 text-xs">30-day return policy</p>
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center">
                  <BsShieldCheck className="text-indigo-600 text-xl sm:text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Secure Checkout</p>
                    <p className="text-gray-500 text-xs">100% secure payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white shadow-sm rounded-xl overflow-hidden sticky top-6">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {role === "stockist" ? "Stockist Order Summary" : 
                     role === "reseller" ? "Reseller Order Summary" : "Order Summary"}
                  </h2>
                  {(role === "stockist" || role === "reseller") && (
                    <p className="text-sm text-blue-600 mt-1">
                      {role === "stockist" 
                        ? "Requires admin approval before processing"
                        : "Requires stockist approval before processing"}
                    </p>
                  )}
                </div>

                <div className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">Subtotal ({cartItems.length} items)</p>
                    <p className="text-gray-900 font-bold">₹{cartTotals.subtotal.toFixed(2)}</p>
                  </div>
                  
                  {/* Show Discount for stockist and reseller */}
                  {cartTotals.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-medium">Total Discount:</p>
                      <p className="text-red-600 font-bold">-₹{cartTotals.totalDiscount.toFixed(2)}</p>
                    </div>
                  )}
                  
                  {/* Price after discount */}
                  {cartTotals.totalDiscount > 0 && (
                    <div className="flex justify-between bg-green-50 p-2 rounded border border-green-100">
                      <p className="text-gray-700 font-medium">Total After Discount:</p>
                      <p className="text-green-600 font-bold">₹{cartTotals.totalPriceAfterDiscount.toFixed(2)}</p>
                    </div>
                  )}
                  
                  {/* GST */}
                  {cartTotals.totalGst > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-medium">Total GST:</p>
                      <p className="text-blue-600 font-bold">+₹{cartTotals.totalGst.toFixed(2)}</p>
                    </div>
                  )}
                  
                  {/* Shipping message */}
                  {role === "reseller" && (
  <div className="flex justify-between">
    <p className="text-gray-600 font-medium">Shipping Price:</p>
    <p className="text-red-700 font-bold text-sm">Calculated on Dispatching Time</p>
  </div>
)}

                  
                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-2">
                    <div className="flex justify-between">
                      <p className="text-lg font-extrabold text-gray-900">Total Amount</p>
                      <p className="text-xl font-extrabold text-indigo-600">
                        ₹{totalPrice.toFixed(2)}
                      </p>
                    </div>
                    {cartTotals.totalDiscount > 0 && (
                      <p className="text-xs text-green-600 text-right mt-1">
                        You saved ₹{cartTotals.totalDiscount.toFixed(2)} with {role} discount!
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                  <button
                    disabled={cartItems.length === 0 || isLoading}
                    className={`w-full flex justify-center items-center px-6 py-3 sm:py-4 border border-transparent rounded-lg shadow-sm text-base font-extrabold text-white ${
                      isLoading || cartItems.length === 0
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                    onClick={handleCheckout}
                  >
                    {getCheckoutButtonText()}
                  </button>
                  <div className="mt-4 flex justify-center">
                    <Link
                      to={`/${role}/products`}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-bold cursor-pointer transition-colors"
                    >
                      {role === "stockist" ? "Browse More Wholesale Products" : 
                       role === "reseller" ? "Browse More Reseller Products" : "Continue Shopping"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommonMyCart;