import React, { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  updateQuantity,
  clearCart,
} from "../features/cart/cartSlice";
import { useCreateBulkOrdersMutation } from "../features/order/orderApi";
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";
import { BsShieldCheck } from "react-icons/bs";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  getApplicableBulkPrice,
  calculateItemPrice,
  calculateGSTForItem,
  calculateDiscountForItem,
  getBasePrice,
  getMaxAvailableQuantity,
  getActualPrice,
  getDiscountPercentage,
  getGSTPercentage,
  getPriceAfterDiscount
} from "../pages/ProductDetailPage";

const LazyImage = lazy(() => import("./LazyImage"));

const MyCart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  
  const [placeBulkOrder, { isLoading: isBulkOrderLoading }] = useCreateBulkOrdersMutation();
  
  const isLoading = isBulkOrderLoading;

  // Calculate cart totals using consistent functions - FIXED
  const subtotal = cartItems.reduce(
    (acc, item) => {
      const basePrice = getBasePrice(item.variant);
      return acc + (basePrice * item.quantity);
    },
    0
  );

  const totalGST = cartItems.reduce(
    (acc, item) => acc + calculateGSTForItem(item.variant, item.quantity),
    0
  );

  const totalDiscount = cartItems.reduce(
    (acc, item) => acc + calculateDiscountForItem(item.variant, item.quantity),
    0
  );

  const totalPriceAfterDiscount = cartItems.reduce(
    (acc, item) => acc + getPriceAfterDiscount(item.variant, item.quantity),
    0
  );

  const shippingCost = 0;
  const totalPrice = subtotal - totalDiscount + totalGST;

  const handleQuantityChange = (cartItemId, newQuantity) => {
    const item = cartItems.find(item => item.cartItemId === cartItemId);
    if (!item) return;

    const maxAvailable = getMaxAvailableQuantity(item.variant);
  
    // Prevent ordering more than available quantity
    if (maxAvailable === 0) {
      toast.error(`Sorry, This Product is currently out of stock`);
      return;
    }
    if (newQuantity > maxAvailable) {
      toast.error(`Only ${maxAvailable} units available for ${item.name}`);
      return;
    }

    const bulkPrice = getApplicableBulkPrice(item.variant, newQuantity);

    dispatch(updateQuantity({
      cartItemId,
      quantity: Math.max(1, newQuantity),
      bulkPrice
    }));
  };

  const getBulkPriceInfo = (item) => {
    return getApplicableBulkPrice(item.variant, item.quantity);
  };

  const hasBulkPricing = (item) => {
    return getApplicableBulkPrice(item.variant, item.quantity) !== null;
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeItem(cartItemId));
  };

  const handleCheckout = async () => {
    // Check if any item exceeds available quantity before checkout
    const outOfStockItems = cartItems.filter(item => {
      const maxAvailable = getMaxAvailableQuantity(item.variant);
      return item.quantity > maxAvailable;
    });
    
    if (outOfStockItems.length > 0) {
      toast.error("Some items exceed available stock. Please adjust quantities before checkout.");
      return;
    }

    // Check if any items are out of stock
    const completelyOutOfStock = cartItems.filter(item => {
      const maxAvailable = getMaxAvailableQuantity(item.variant);
      return maxAvailable === 0;
    });
    
    if (completelyOutOfStock.length > 0) {
      toast.error("Some items are out of stock. Please remove them before checkout.");
      return;
    }

    try {
      const orderData = {
        items: cartItems.map(({ id, product_id, quantity, variant, bulk_price }) => {
          const itemPrice = calculateItemPrice(variant, quantity);
          const gstPercentage = getGSTPercentage(variant, quantity);
          const gstAmount = calculateGSTForItem(variant, quantity);
          
          return {
            product_id: product_id,
            rolebaseid: id,
            quantity,
            variant_id: variant?.id || null,
            bulk_price_id: bulk_price?.id || null,
            gst_tax: gstAmount || null,
            gst_percentage: gstPercentage || null,
            unit_price: itemPrice,
          };
        }),
        subtotal,
        shipping: shippingCost,
        gst: totalGST,
        discount: totalDiscount,
        total: totalPrice,
      };

      await placeBulkOrder(orderData).unwrap();
      toast.success("Order placed successfully!");
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
    
    return "Proceed to Checkout";
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
          to="/admin/products"
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
    <div className="min-h-screen py-4 ">
      <div className="max-w-8xl mx-auto">
        {/* Header - Only show when cart has items */}
        {cartItems.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={() => navigate("/admin/products")}
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
                  {cartItems.map((item) => {
                    const itemPrice = calculateItemPrice(item.variant, item.quantity);
                    const basePrice = getBasePrice(item.variant);
                    const actualPrice = getActualPrice(item.variant);
                    const bulkPriceInfo = getBulkPriceInfo(item);
                    const itemGST = calculateGSTForItem(item.variant, item.quantity);
                    const itemDiscount = calculateDiscountForItem(item.variant, item.quantity);
                    const priceAfterDiscount = getPriceAfterDiscount(item.variant, item.quantity);
                    const hasBulk = hasBulkPricing(item);
                    const { cartItemId, name, quantity, image, variant } = item;
                    const maxAvailable = getMaxAvailableQuantity(item.variant);
                    const isMaxQuantity = quantity >= maxAvailable;
                    const isOutOfStock = maxAvailable === 0;
                    
                    // Calculate final price for this item
                    const itemFinalPrice = hasBulk 
                      ? (itemPrice * quantity) 
                      : (actualPrice * quantity);
                    
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
                          
                          {isOutOfStock && (
                            <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                              Out of Stock
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
                              <div className={`mt-1 text-xs px-2 py-1 rounded inline-block ${
                                isOutOfStock 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {isOutOfStock ? 'Out of Stock' : `Available: ${maxAvailable} units`}
                              </div>
                              
                              {bulkPriceInfo && (
                                <div className="mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                                  🎉 Bulk discount: {bulkPriceInfo.max_quantity}+ units 
                                  {bulkPriceInfo.discount > 0 && ` (${bulkPriceInfo.discount}% off)`}
                                  {bulkPriceInfo.gst_percentage > 0 && ` | GST: ${bulkPriceInfo.gst_percentage}%`}
                                </div>
                              )}
                              
                              {!hasBulk && variant?.product_variant_prices?.[0] && (
                                <div className="mt-1 text-xs text-blue-600">
                                  {`GST: ${variant.product_variant_prices[0].gst_percentage}%`}
                                  {variant.product_variant_prices[0].discount > 0 && 
                                    ` | Discount: ${variant.product_variant_prices[0].discount}%`
                                  }
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
                                disabled={quantity <= 1 || isOutOfStock}
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
                                disabled={isOutOfStock}
                              />
                              <button
                                onClick={() => handleQuantityChange(cartItemId, quantity + 1)}
                                className={`p-2 rounded-lg ${isMaxQuantity || isOutOfStock ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'} transition-colors`}
                                disabled={isMaxQuantity || isOutOfStock}
                                title={isMaxQuantity ? `Maximum ${maxAvailable} units available` : isOutOfStock ? 'Out of stock' : ''}
                              >
                                <FiPlus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-gray-500 font-medium">
                                {hasBulk ? "Bulk Price" : "Unit Price"}
                              </p>
                              <p className="text-lg font-extrabold text-gray-900">
                                ₹{hasBulk ? itemPrice.toFixed(2) : actualPrice.toFixed(2)}
                                {hasBulk && itemPrice < basePrice && (
                                  <span className="ml-1 text-sm text-gray-500 line-through">
                                    ₹{basePrice.toFixed(2)}
                                  </span>
                                )}
                                {!hasBulk && actualPrice < basePrice && (
                                  <span className="ml-1 text-sm text-gray-500 line-through">
                                    ₹{basePrice.toFixed(2)}
                                  </span>
                                )}
                              </p>
                              
                              {/* Price breakdown */}
                              <div className="text-xs space-y-1 mt-2">
                                <div className="flex justify-between">
                                  <span>Original:</span>
                                  <span>₹{(basePrice * quantity).toFixed(2)}</span>
                                </div>
                                
                                {itemDiscount > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Discount:</span>
                                    <span>-₹{itemDiscount.toFixed(2)}</span>
                                  </div>
                                )}
                                
                                {!hasBulk && (
                                  <div className="flex justify-between">
                                    <span>After discount:</span>
                                    <span>₹{priceAfterDiscount.toFixed(2)}</span>
                                  </div>
                                )}
                                
                                {itemGST > 0 && (
                                  <div className="flex justify-between text-blue-600">
                                    <span>GST:</span>
                                    <span>+₹{itemGST.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-lg font-bold text-indigo-600 mt-2 border-t pt-2">
                                Total: ₹{itemFinalPrice.toFixed(2)}
                              </p>
                              
                              {hasBulk && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Bulk pricing applied
                                </p>
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
                    <p className="font-bold text-sm">Bulk Pricing Also Available</p>
                    <p className="text-gray-500 text-xs">Special Discount</p>
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center">
                  <FiShoppingBag className="text-indigo-600 text-xl sm:text-2xl mr-3" />
                  <div>
                    <p className="font-bold text-sm">Easy Returns</p>
                    <p className="text-gray-500 text-xs">15-day return policy</p>
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
                  <h2 className="text-xl font-extrabold text-gray-900">Order Summary</h2>
                </div>

                <div className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">Subtotal ({cartItems.length} items)</p>
                    <p className="text-gray-900 font-bold">₹{subtotal.toFixed(2)}</p>
                  </div>
                  
                  {/* Show total discount if any */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-medium">Discount:</p>
                      <p className="text-green-600 font-bold">-₹{totalDiscount.toFixed(2)}</p>
                    </div>
                  )}
                  
                  {/* Show price after discount */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-medium">Price after discount:</p>
                      <p className="text-gray-900 font-bold">₹{totalPriceAfterDiscount.toFixed(2)}</p>
                    </div>
                  )}
                  
                  {/* Show total GST if any */}
                  {totalGST > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-medium">GST:</p>
                      <p className="text-blue-600 font-bold">₹{totalGST.toFixed(2)}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-medium">Shipping Price:</p>
                    <p className="text-red-700 font-bold text-sm">Deduct Later When Order Dispatched</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-2">
                    <div className="flex justify-between">
                      <p className="text-lg font-extrabold text-gray-900">Total</p>
                      <p className="text-xl font-extrabold text-indigo-600">
                        ₹{totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      (Includes all taxes and discounts)
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                  <button
                    disabled={cartItems.length === 0 || isLoading || cartItems.some(item => getMaxAvailableQuantity(item.variant) === 0)}
                    className={`w-full flex justify-center items-center px-6 py-3 sm:py-4 border border-transparent rounded-lg shadow-sm text-base font-extrabold text-white ${
                      isLoading || cartItems.length === 0 || cartItems.some(item => getMaxAvailableQuantity(item.variant) === 0)
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                    onClick={handleCheckout}
                  >
                    {getCheckoutButtonText()}
                  </button>
                  <div className="mt-4 flex justify-center">
                    <Link
                      to="/admin/products"
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