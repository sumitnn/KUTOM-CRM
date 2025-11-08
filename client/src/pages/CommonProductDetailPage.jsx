import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetAdminProductByIdQuery } from "../features/adminProduct/adminProductApi";
import { toast } from "react-toastify";
import { FiMinus, FiPlus, FiStar, FiTruck, FiShield, FiArrowLeft, FiPackage, FiShoppingCart, FiZoomIn, FiCheck, FiAlertCircle } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const CommonProductDetailPage = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const { data: productData, error, isLoading } = useGetAdminProductByIdQuery(id);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Extract product from the new API response structure
  const product = productData?.product_detail;
  const variantsDetail = productData?.variants_detail || [];
  const rolebasedproductid = productData?.id;

  useEffect(() => {
    if (product) {
      setMainImage(
        product.images?.find((img) => img.is_featured)?.image ||
          product.images?.[0]?.image ||
          "/placeholder.png"
      );
      if (variantsDetail.length > 0) {
        const defaultVariant = variantsDetail.find((v) => v.is_default) || variantsDetail[0];
        setSelectedVariant(defaultVariant);
      }
    }
  }, [product, variantsDetail]);

  // Image zoom functionality
  const handleImageMouseMove = (e) => {
    if (!isZoomed) return;
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // Create unique identifier for cart items
  const inCart = cartItems.some(
    (item) => item.cartItemId === `${product?.id}_${selectedVariant?.id}`
  );

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const maxQuantity = selectedVariant ? getAvailableQuantity(selectedVariant.product_variant_prices) : 1;
    setQuantity(Math.max(1, Math.min(value, maxQuantity)));
  };

  const incrementQuantity = () => {
    const maxQuantity = selectedVariant ? getAvailableQuantity(selectedVariant.product_variant_prices) : 1;
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    } else {
      toast.warning(`Maximum available quantity is ${maxQuantity}`);
    }
  };

  const decrementQuantity = () => {
    setQuantity(Math.max(1, quantity - 1));
  };

  // Get base price (without GST & discount) according to role
  const getBasePrice = (variantPrices) => {
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

  // Get final price (with GST & discount included) according to role
  const getFinalPrice = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return 0;
    
    const priceData = variantPrices[0];
    switch (role) {
      case "stockist":
        return parseFloat(priceData.stockist_price || priceData.actual_price);
      case "reseller":
        return parseFloat(priceData.reseller_price || priceData.actual_price);
      default:
        return parseFloat(priceData.price || priceData.actual_price);
    }
  };

  // Get role-based discount percentage
  const getDiscountPercentage = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return 0;
    
    const priceData = variantPrices[0];
    return role === "stockist" ? priceData.stockist_discount : 
           role === "reseller" ? priceData.reseller_discount : 
           0;
  };

  // Get role-based GST percentage
  const getGstPercentage = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return 0;
    
    const priceData = variantPrices[0];
    return role === "stockist" ? priceData.stockist_gst : 
           role === "reseller" ? priceData.reseller_gst : 
           priceData.gst_percentage;
  };

  // Calculate price breakdown for single item
  const calculatePriceBreakdown = (variantPrices) => {
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

    const basePrice = getBasePrice(variantPrices);
    const discountPercentage = getDiscountPercentage(variantPrices);
    const gstPercentage = getGstPercentage(variantPrices);
    
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

  // Calculate total for current quantity
  const calculateTotalPrice = () => {
    if (!selectedVariant?.product_variant_prices?.[0]) {
      return {
        totalBase: 0,
        totalDiscount: 0,
        totalPriceAfterDiscount: 0,
        totalGst: 0,
        totalFinal: 0
      };
    }

    const breakdown = calculatePriceBreakdown(selectedVariant.product_variant_prices);
    
    return {
      totalBase: breakdown.basePrice * quantity,
      totalDiscount: breakdown.discountAmount * quantity,
      totalPriceAfterDiscount: breakdown.priceAfterDiscount * quantity,
      totalGst: breakdown.gstAmount * quantity,
      totalFinal: breakdown.finalPrice * quantity
    };
  };

  const getAvailableQuantity = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return 0;
    return variantPrices[0].total_available_quantity;
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.warning("Please select a variant before adding to cart.");
      return;
    }

    const availableQuantity = getAvailableQuantity(selectedVariant.product_variant_prices);
    if (quantity > availableQuantity) {
      toast.warning(`Only ${availableQuantity} units available in stock`);
      return;
    }

    // Create unique identifier for cart items
    const cartItemId = `${product.id}_${selectedVariant.id}`;
    
    // Check if exact same product+variant combination exists
    const existingCartItem = cartItems.find(item => item.cartItemId === cartItemId);

    if (existingCartItem) {
      toast.info("This variant is already in your cart.");
      return;
    }

    const breakdown = calculatePriceBreakdown(selectedVariant.product_variant_prices);
    const total = calculateTotalPrice();

    const cartItem = {
      id: productData.id,
      product_id: product.id,
      cartItemId: cartItemId,
      name: product.name,
      base_price: breakdown.basePrice,
      discount_percentage: breakdown.discountPercentage,
      discount_amount: breakdown.discountAmount,
      price_after_discount: breakdown.priceAfterDiscount,
      gst_percentage: breakdown.gstPercentage,
      gst_amount: breakdown.gstAmount,
      final_price: breakdown.finalPrice,
      quantity: quantity,
      total_price: total.totalFinal,
      image: mainImage,
      variant: selectedVariant,
      rolebaseid: rolebasedproductid,
      maxQuantity: availableQuantity
    };

    dispatch(addItem(cartItem));
    toast.success(`${quantity} item(s) added to cart!`);
    setQuantity(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-lg loading-spinner text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Product not found</h2>
          <Link to={`/${role}/products`} className="btn btn-primary gap-2">
            <FiArrowLeft /> Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const showActionButtons = ["stockist", "reseller"].includes(role);
  const isProductAvailable = product.is_active && product.status === "published";

  // Current price breakdown
  const currentBreakdown = selectedVariant ? 
    calculatePriceBreakdown(selectedVariant.product_variant_prices) : 
    calculatePriceBreakdown([]);
  
  const totalPrice = calculateTotalPrice();
  const availableQuantity = selectedVariant ? 
    getAvailableQuantity(selectedVariant.product_variant_prices) : 0;

  // Stock status indicator
  const getStockStatus = () => {
    if (availableQuantity === 0) return { text: "Out of Stock", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
    if (availableQuantity <= 10) return { text: `Low Stock (${availableQuantity} left)`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    return { text: "In Stock", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="max-w-8xl mx-auto py-4 px-4 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <Link to={`/${role}/dashboard`} className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link to={`/${role}/products`} className="hover:text-gray-700 transition-colors">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="space-y-4">
          <div 
            className={`relative w-full bg-gray-50 rounded-2xl overflow-hidden border-2 cursor-${isZoomed ? 'zoom-out' : 'zoom-in'} transition-all duration-300 hover:shadow-lg`}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <div className="relative overflow-hidden">
              <img
                src={mainImage}
                alt={product.name}
                className={`w-full h-96 object-contain p-4 transition-transform duration-200 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={{
                  transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center'
                }}
              />
              
              {/* Zoom button */}
              <button
                onClick={toggleZoom}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all backdrop-blur-sm"
                title={isZoomed ? "Zoom Out" : "Zoom In"}
              >
                <FiZoomIn className="text-lg" />
              </button>
            </div>
            
            {productData?.is_featured && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                ⭐ Featured
              </span>
            )}
          </div>
          
          {/* Thumbnail Images */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {product.images?.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt={img.alt_text}
                className={`w-20 h-20 object-cover border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                  mainImage === img.image 
                    ? "border-primary ring-4 ring-primary/20 shadow-md" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => {
                  setMainImage(img.image);
                  setIsZoomed(false);
                }}
              />
            ))}
          </div>
          
          {/* Video Section */}
          {product.video_url && getEmbedUrl(product.video_url) && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Product Video
              </h3>
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <iframe
                  src={getEmbedUrl(product.video_url)}
                  className="w-full h-64"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Product video"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
              <span className="bg-gray-100 px-3 py-1 rounded-full">SKU: {product.sku}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color} ${stockStatus.border}`}>
                {stockStatus.text}
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                Price for: <strong>{role === 'stockist' ? 'Stockist' : role === 'reseller' ? 'Reseller' : 'Customer'}</strong>
              </span>
            </div>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({product.rating})</span>
              </div>
            )}
          </div>

          {/* Enhanced Price Section */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-baseline gap-3 flex-wrap mb-4">
              <div className="text-4xl font-bold text-gray-900">
                ₹{currentBreakdown.finalPrice.toFixed(2)}
              </div>
              
              {currentBreakdown.discountPercentage > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-500 line-through">
                    ₹{currentBreakdown.basePrice.toFixed(2)}
                  </span>
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    {currentBreakdown.discountPercentage}% OFF
                  </span>
                </div>
              )}
            </div>
            
            {/* Price Breakdown */}
            <div className="space-y-3 bg-white/70 p-4 rounded-xl border border-blue-50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Old Price:</span>
                <span className="font-semibold text-gray-900">₹{currentBreakdown.basePrice.toFixed(2)}</span>
              </div>
              
              {currentBreakdown.discountPercentage > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount ({currentBreakdown.discountPercentage}%):</span>
                    <span className="font-semibold text-red-500">-₹{currentBreakdown.discountAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm bg-green-50 p-2 rounded-lg border border-green-100">
                    <span className="text-gray-700 font-medium">Price After Discount:</span>
                    <span className="font-semibold text-green-600">₹{currentBreakdown.priceAfterDiscount.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              {currentBreakdown.gstPercentage > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">GST ({currentBreakdown.gstPercentage}%):</span>
                  <span className="font-semibold text-blue-500">+₹{currentBreakdown.gstAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900">Price After Discount & GST (per item)</span>
                  <span className="text-green-600">₹{currentBreakdown.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          {variantsDetail.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="font-semibold text-gray-800 mb-4 text-lg">Available Variants</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {variantsDetail.map((variant) => {
                  const variantBreakdown = calculatePriceBreakdown(variant.product_variant_prices);
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantAvailableQuantity = getAvailableQuantity(variant.product_variant_prices);
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.is_active || variantAvailableQuantity === 0}
                      className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 text-left group relative ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      } ${!variant.is_active || variantAvailableQuantity === 0 ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                    >
                      {/* Out of Stock Overlay */}
                      {variantAvailableQuantity === 0 && (
                        <div className="absolute inset-0 bg-red-50/80 rounded-xl flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {variant.name}
                        </div>
                        {isSelected && (
                          <FiCheck className="text-primary text-lg flex-shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{variantBreakdown.finalPrice.toFixed(2)}
                          </span>
                          {variantBreakdown.discountPercentage > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{variantBreakdown.basePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Price after discount */}
                        {variantBreakdown.discountPercentage > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            After discount: ₹{variantBreakdown.priceAfterDiscount.toFixed(2)}
                          </div>
                        )}
                        
                        {/* Discount & GST badges */}
                        <div className="flex flex-wrap gap-1">
                          {variantBreakdown.discountPercentage > 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                              {variantBreakdown.discountPercentage}% OFF
                            </span>
                          )}
                          {variantBreakdown.gstPercentage > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              GST {variantBreakdown.gstPercentage}%
                            </span>
                          )}
                        </div>

                        {/* Available Quantity */}
                        <div className="text-xs text-gray-600">
                          Available: <span className="font-bold">{variantAvailableQuantity} units</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Total Section */}
          {showActionButtons && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-800">Quantity:</span>
                    <div className="text-sm text-gray-600 mt-1 font-bold">
                      Available: <span className="font-semibold">{availableQuantity} units</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decrementQuantity}
                      className="w-12 h-12 cursor-pointer rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                      disabled={quantity <= 1 || !isProductAvailable || availableQuantity === 0}
                    >
                      <FiMinus className="text-gray-600" />
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={availableQuantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="w-20 text-center border-2 border-gray-200 rounded-xl py-3 px-3 font-semibold text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        disabled={!isProductAvailable || availableQuantity === 0}
                      />
                      {availableQuantity > 0 && (
                        <div className="absolute -bottom-4 left-0 right-0 text-xs text-gray-500 text-center font-bold">
                          Max: {availableQuantity}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={incrementQuantity}
                      className="w-12 h-12 cursor-pointer rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={!isProductAvailable || availableQuantity === 0 || quantity >= availableQuantity}
                    >
                      <FiPlus className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Stock Warning */}
                {availableQuantity > 0 && availableQuantity <= 10 && (
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <FiAlertCircle className="text-orange-500 flex-shrink-0" />
                    <div className="text-sm text-orange-700">
                      <strong>Low Stock:</strong> Only {availableQuantity} units remaining
                    </div>
                  </div>
                )}

                {/* Total Price Breakdown */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Old Price without GST and Discount ({quantity} items):</span>
                    <span className="font-semibold">₹{totalPrice.totalBase.toFixed(2)}</span>
                  </div>
                  
                  {currentBreakdown.discountPercentage > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Discount:</span>
                        <span className="font-semibold text-red-500">-₹{totalPrice.totalDiscount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm bg-green-50 p-2 rounded border border-green-100">
                        <span className="text-gray-700 font-medium">Total After Discount:</span>
                        <span className="font-semibold text-green-600">₹{totalPrice.totalPriceAfterDiscount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  {currentBreakdown.gstPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total GST:</span>
                      <span className="font-semibold text-blue-500">+₹{totalPrice.totalGst.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-gray-900">Total Amount:</span>
                      <span className="text-green-600 text-xl">₹{totalPrice.totalFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full cursor-pointer bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] flex items-center justify-center gap-3"
                  disabled={!selectedVariant || !isProductAvailable || availableQuantity === 0}
                >
                  <FiShoppingCart className="text-xl" />
                  {!isProductAvailable || availableQuantity === 0
                    ? "Out of Stock"
                    : `Add to Cart`}
                </button>

                {/* Stock Limit Message */}
                {availableQuantity === 0 && (
                  <div className="text-center text-red-600 font-medium py-2">
                    This product is currently out of stock
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiTruck className="text-2xl text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Fast Shipping</p>
                  <p className="text-sm text-gray-600">Above ₹9999</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FiShield className="text-2xl text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Secure Payment</p>
                  <p className="text-sm text-gray-600">100% Protected</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FiPackage className="text-2xl text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Easy Returns </p>
                  <p className="text-sm text-gray-600">10 Days Policy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {["description", "details", "pricing"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 font-semibold border-b-2 transition-all cursor-pointer capitalize ${
                    activeTab === tab
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "description" && (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {product.description || "No description available."}
                  </p>
                  {product.features && product.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">Key Features:</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-700">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Brand:</strong> {product.brand_name}</div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Category:</strong> {product.category_name}</div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Subcategory:</strong> {product.subcategory_name}</div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Weight:</strong> {product.weight} {product.weight_unit}</div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Product Type:</strong> {product.product_type_display}</div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Warranty:</strong> {product.warranty || "No warranty"}</div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg"><strong>Published:</strong> {product.status_display}</div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-4">
                  {variantsDetail.map((variant) => {
                    const variantBreakdown = calculatePriceBreakdown(variant.product_variant_prices);
                    const variantAvailableQuantity = getAvailableQuantity(variant.product_variant_prices);
                    
                    return (
                      <div key={variant.id} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-gray-900 text-lg">{variant.name} (SKU: {variant.sku})</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            variantAvailableQuantity === 0 
                              ? "bg-red-100 text-red-800" 
                              : variantAvailableQuantity <= 10 
                                ? "bg-orange-100 text-orange-800" 
                                : "bg-green-100 text-green-800"
                          }`}>
                            {variantAvailableQuantity === 0 ? "Out of Stock" : `${variantAvailableQuantity} Available`}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-blue-600 font-semibold text-sm mb-2">Old Price</div>
                            <div className="text-2xl font-bold text-gray-900">₹{variantBreakdown.basePrice.toFixed(2)}</div>
                          </div>
                          
                          {variantBreakdown.discountPercentage > 0 && (
                            <>
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="text-red-600 font-semibold text-sm mb-2">Discount</div>
                                <div className="text-2xl font-bold text-red-600">{variantBreakdown.discountPercentage}%</div>
                                <div className="text-sm text-gray-600 mt-1">-₹{variantBreakdown.discountAmount.toFixed(2)}</div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm bg-green-50">
                                <div className="text-green-600 font-semibold text-sm mb-2">After Discount</div>
                                <div className="text-2xl font-bold text-green-600">₹{variantBreakdown.priceAfterDiscount.toFixed(2)}</div>
                              </div>
                            </>
                          )}
                          
                          {variantBreakdown.gstPercentage > 0 && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="text-blue-600 font-semibold text-sm mb-2">GST</div>
                              <div className="text-2xl font-bold text-blue-600">{variantBreakdown.gstPercentage}%</div>
                              <div className="text-sm text-gray-600 mt-1">+₹{variantBreakdown.gstAmount.toFixed(2)}</div>
                            </div>
                          )}
                          
                          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white shadow-lg">
                            <div className="font-semibold text-sm mb-2 opacity-90">Final Price</div>
                            <div className="text-2xl font-bold">₹{variantBreakdown.finalPrice.toFixed(2)}</div>
                            <div className="text-xs opacity-90 mt-1">Inclusive of all taxes</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonProductDetailPage;