import React, { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../features/cart/cartSlice";
import { useCreateBulkOrdersMutation } from "../features/order/orderApi";
import { useCreateOrderRequestMutation, useCreateOrderRequestResellerMutation } from "../features/order/orderRequest";
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";
import { BsShieldCheck } from "react-icons/bs";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const LazyImage = lazy(() => import("./LazyImage"));

// Updated bulk price calculation logic
const getApplicableBulkPrice = (variant, quantity) => {
  if (!variant?.bulk_prices?.length) return null;
  
  // Sort bulk prices by max_quantity in descending order
  const sortedBulkPrices = [...variant.bulk_prices].sort((a, b) => b.max_quantity - a.max_quantity);
  
  // Find the first bulk price where quantity >= max_quantity
  return sortedBulkPrices.find(bulk => quantity >= bulk.max_quantity);
};

const calculateItemPrice = (item) => {
  const bulkPrice = getApplicableBulkPrice(item.variant, item.quantity);
  
  if (bulkPrice) {
    return bulkPrice.price;
  }
  
  // Return base price (first bulk price or variant price)
  return item.variant?.bulk_prices?.[0]?.price || item.price || 0;
};

const calculateGSTForItem = (item) => {
  const itemPrice = calculateItemPrice(item);
  const subtotal = Number(itemPrice) * (item.quantity || 1);
  
  let gstAmount = 0;
  
  if (item.variant?.product_variant_prices?.[0]) {
    const variantPricing = item.variant.product_variant_prices[0];
    
    if (variantPricing.gst_tax) {
      gstAmount = Number(variantPricing.gst_tax) * (item.quantity || 1);
    } else if (variantPricing.gst_percentage) {
      gstAmount = (subtotal * Number(variantPricing.gst_percentage)) / 100;
    }
  } else {
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
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  
  const [placeBulkOrder, { isLoading: isBulkOrderLoading }] = useCreateBulkOrdersMutation();
  const [createOrderRequest, { isLoading: isOrderRequestLoading }] = useCreateOrderRequestMutation();
  const [createOrderRequestReseller, { isLoading: isResellerOrderRequestLoading }] = useCreateOrderRequestResellerMutation();

  const isLoading = isBulkOrderLoading || isOrderRequestLoading || isResellerOrderRequestLoading;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (calculateItemPrice(item) || 0) * (item.quantity || 1),
    0
  );

  const totalGST = cartItems.reduce(
    (acc, item) => acc + calculateGSTForItem(item),
    0
  );

  const shippingCost = 0;
  const totalPrice = subtotal + shippingCost + totalGST;

  const handleQuantityChange = (id, newQuantity) => {
    const item = cartItems.find(item => item.id === id);
    if (!item) return;

    const bulkPrice = getApplicableBulkPrice(item.variant, newQuantity);

    dispatch(updateQuantity({
      id,
      quantity: Math.max(1, newQuantity),
      bulkPrice
    }));
  };

  const getBasePrice = (item) => {
    return item.variant?.bulk_prices?.[0]?.price || item.price || 0;
  };

  const getBulkPriceInfo = (item) => {
    return getApplicableBulkPrice(item.variant, item.quantity);
  };

  const handleCheckout = async () => {
    console.log(cartItems)
    try {
      if (role === "stockist" || role === "reseller") {
        const orderRequestData = {
          note: `Order request from ${user?.email} (${role})`,
          items: cartItems.map((item) => ({
            product: item.id,
            rolebaseid:item.rolebaseid,
            variant: item.variant?.id || item.size?.id,
            quantity: item.quantity,
            unit_price: calculateItemPrice(item),
            total_price: (calculateItemPrice(item) * item.quantity),
            gst_amount: calculateGSTForItem(item),
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
      return "Submit Order Request";
    } else if (role === "reseller") {
      return "Submit Order Request";
    } else {
      return "Proceed to Checkout";
    }
  };

  const getOrderTypeMessage = () => {
    if (role === "stockist" || role === "reseller") {
      return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800 font-medium text-sm">
              {role === "stockist" 
                ? "As a stockist, your order will be submitted as a request for admin approval."
                : "As a reseller, your order will be submitted as a request for stockist approval."}
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
        Looks like you haven't added any items to your cart yet. Start shopping to discover amazing products!
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to={`/${role}/products`}
          className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200 hover:shadow-lg"
        >
          <FiShoppingBag className="mr-2" />
          Continue Shopping
        </Link>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-8 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200"
        >
          <FiArrowLeft className="mr-2" />
          Go to Dashboard Page
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
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
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Your Shopping Cart</h1>
                <p className="text-gray-500 mt-1 font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                onClick={() => dispatch(clearCart())}
                className="mt-2 sm:mt-0 text-red-500 hover:text-red-700 font-medium text-sm flex items-center cursor-pointer transition-colors"
              >
                <FiTrash2 className="mr-1" /> Clear all
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
                    const itemPrice = calculateItemPrice(item);
                    const basePrice = getBasePrice(item);
                    const bulkPriceInfo = getBulkPriceInfo(item);
                    const itemGST = calculateGSTForItem(item);
                    const { id, name, quantity, image, variant } = item;
                    
                    return (
                      <div key={`${id}-${variant?.id}`} className="p-4 sm:p-6 flex flex-col sm:flex-row group hover:bg-gray-50 transition-colors">
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
                              
                              {bulkPriceInfo && (
                                <div className="mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                                  🎉 Bulk discount: {bulkPriceInfo.max_quantity}+ units
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
                              className="mt-2 sm:mt-0 sm:ml-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 self-start sm:self-center"
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
                                {bulkPriceInfo && Number(itemPrice) < Number(basePrice) && (
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
                    {role === "stockist" ? "Order Request Summary" : 
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
                    <p className="text-gray-900 font-bold">₹{subtotal.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">GST (Tax):</p>
                    <p className="text-gray-900 font-bold">₹{totalGST.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">Shipping:</p>
                    <p className="text-gray-900 font-bold">₹{shippingCost.toFixed(2)}</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-2">
                    <div className="flex justify-between">
                      <p className="text-lg font-extrabold text-gray-900">Total</p>
                      <p className="text-xl font-extrabold text-indigo-600">
                        ₹{totalPrice.toFixed(2)}
                      </p>
                    </div>
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
                      Continue Shopping
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

export default MyCart;