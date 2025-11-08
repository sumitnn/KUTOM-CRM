import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetProductByIdQuery } from "../features/product/productApi";
import { toast } from "react-toastify";
import {
  FiMinus, FiPlus, FiChevronRight, FiShoppingCart, FiArrowLeft,
  FiTag, FiStar, FiTruck, FiShield, FiCheck
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

// Utility functions for consistent pricing calculation
export const getApplicableBulkPrice = (variant, quantity) => {
  if (!variant?.bulk_prices?.length) return null;
  
  // Sort bulk prices by threshold quantity in ascending order
  const sortedBulkPrices = [...variant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
  
  // Find the highest threshold that the quantity meets or exceeds
  let applicableBulkPrice = null;
  
  for (const bulkPrice of sortedBulkPrices) {
    if (quantity >= bulkPrice.max_quantity) {
      applicableBulkPrice = bulkPrice;
    } else {
      // Since they're sorted ascending, we can break when we find one that's too high
      break;
    }
  }
  
  return applicableBulkPrice;
};

export const calculateItemPrice = (variant, quantity) => {
  const bulkPrice = getApplicableBulkPrice(variant, quantity);
  
  // If bulk price is available, use the final price (all-inclusive)
  if (bulkPrice) {
    return Number(bulkPrice.final_price);
  }
  
  // Otherwise, use regular variant price (actual_price already includes discount + GST)
  if (variant?.product_variant_prices?.[0]) {
    const variantPrice = variant.product_variant_prices[0];
    return Number(variantPrice.actual_price); // Price after discount + GST
  }
  
  return 0;
};

export const calculateGSTForItem = (variant, quantity) => {
  const bulkPrice = getApplicableBulkPrice(variant, quantity);
  
  // If bulk price is applied, calculate GST from bulk price details
  if (bulkPrice) {
    const baseAmount = Number(bulkPrice.price) * quantity;
    return (baseAmount * Number(bulkPrice.gst_percentage)) / 100;
  }
  
  // Regular GST calculation for non-bulk items
  if (variant?.product_variant_prices?.[0]) {
    const variantPrice = variant.product_variant_prices[0];
    // Calculate base price after discount, then apply GST
    const basePrice = Number(variantPrice.price);
    const discountedPrice = basePrice * (1 - (variantPrice.discount / 100));
    const gstAmount = (discountedPrice * Number(variantPrice.gst_percentage)) / 100;
    return gstAmount * quantity;
  }
  
  return 0;
};

export const calculateDiscountForItem = (variant, quantity) => {
  const bulkPrice = getApplicableBulkPrice(variant, quantity);
  
  // If bulk price is applied, calculate discount from bulk price details
  if (bulkPrice) {
    const basePrice = getBasePrice(variant);
    const discountedPrice = Number(bulkPrice.price);
    const discountPerUnit = (basePrice - discountedPrice);
    return discountPerUnit * quantity;
  }
  
  // For regular pricing, calculate discount from variant price
  if (variant?.product_variant_prices?.[0]) {
    const variantPrice = variant.product_variant_prices[0];
    const basePrice = Number(variantPrice.price);
    const discountAmountPerUnit = basePrice * (variantPrice.discount / 100);
    return discountAmountPerUnit * quantity;
  }
  
  return 0;
};

export const getBasePrice = (variant) => {
  if (variant?.product_variant_prices?.[0]) {
    const variantPrice = variant.product_variant_prices[0];
    return Number(variantPrice.price); // Original price before any discount
  }
  return 0;
};

export const getActualPrice = (variant) => {
  if (variant?.product_variant_prices?.[0]) {
    const variantPrice = variant.product_variant_prices[0];
    return Number(variantPrice.actual_price); // Price after discount + GST
  }
  return 0;
};

export const getMaxAvailableQuantity = (variant) => {
  if (variant?.product_variant_prices?.[0]?.total_available_quantity) {
    return Number(variant.product_variant_prices[0].total_available_quantity);
  }
  return 0;
};

// New function to get discount percentage for display
export const getDiscountPercentage = (variant, quantity) => {
  const bulkPrice = getApplicableBulkPrice(variant, quantity);
  
  if (bulkPrice) {
    return Number(bulkPrice.discount);
  }
  
  if (variant?.product_variant_prices?.[0]) {
    return variant.product_variant_prices[0].discount;
  }
  
  return 0;
};

// New function to get GST percentage for display
export const getGSTPercentage = (variant, quantity) => {
  const bulkPrice = getApplicableBulkPrice(variant, quantity);
  
  if (bulkPrice) {
    return Number(bulkPrice.gst_percentage);
  }
  
  if (variant?.product_variant_prices?.[0]) {
    return variant.product_variant_prices[0].gst_percentage;
  }
  
  return 0;
};

// Calculate price after discount but before GST for normal products
export const getPriceAfterDiscount = (variant, quantity) => {
  const bulkPrice = getApplicableBulkPrice(variant, quantity);
  
  if (bulkPrice) {
    return Number(bulkPrice.price) * quantity;
  }
  
  if (variant?.product_variant_prices?.[0]) {
    const variantPrice = variant.product_variant_prices[0];
    const basePrice = Number(variantPrice.price);
    const discountAmount = basePrice * (variantPrice.discount / 100);
    const priceAfterDiscount = basePrice - discountAmount;
    return priceAfterDiscount * quantity;
  }
  
  return 0;
};

const ProductDetailsPage = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const { data: productData, error, isLoading } = useGetProductByIdQuery(id);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const product = productData?.product_detail;
  const variants = productData?.variants_detail || [];
  const isProductFeatured = productData?.is_featured;

  useEffect(() => {
    if (product) {
      setMainImage(
        product.images?.find((img) => img.is_featured)?.image ||
          product.images?.[0]?.image ||
          "/placeholder.png"
      );
      if (variants.length > 0) {
        const defaultVariant = variants.find((v) => v.is_default) || variants[0];
        setSelectedVariant(defaultVariant);
      }
    }
  }, [product, variants]);

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handleZoom = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Check if exact same product + variant combination exists in cart
  const inCart = cartItems.some(
    (item) => item.id === product?.id && item.variant?.id === selectedVariant?.id
  );

  // Calculate prices using utility functions
  const bulkPrice = selectedVariant ? getApplicableBulkPrice(selectedVariant, quantity) : null;
  const hasBulkPricing = bulkPrice !== null;
  const itemPrice = selectedVariant ? calculateItemPrice(selectedVariant, quantity) : 0;
  const gstAmount = selectedVariant ? calculateGSTForItem(selectedVariant, quantity) : 0;
  const discountAmount = selectedVariant ? calculateDiscountForItem(selectedVariant, quantity) : 0;
  const basePrice = selectedVariant ? getBasePrice(selectedVariant) : 0;
  const actualPrice = selectedVariant ? getActualPrice(selectedVariant) : 0;
  const maxAvailable = selectedVariant ? getMaxAvailableQuantity(selectedVariant) : 0;
  const discountPercentage = selectedVariant ? getDiscountPercentage(selectedVariant, quantity) : 0;
  const gstPercentage = selectedVariant ? getGSTPercentage(selectedVariant, quantity) : 0;
  const priceAfterDiscount = selectedVariant ? getPriceAfterDiscount(selectedVariant, quantity) : 0;

  // Final price calculation
  const calculateFinalPrice = () => {
    if (hasBulkPricing) {
      // For bulk pricing, final_price already includes everything per unit
      return (itemPrice * quantity).toFixed(2);
    }
    // For regular pricing: use actual_price which already includes GST and discount
    return (actualPrice * quantity).toFixed(2);
  };

  // Calculate subtotal (original price before any discount or GST)
  const calculateSubtotal = () => {
    return (basePrice * quantity).toFixed(2);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.max(1, value);
    
    // Check if quantity exceeds available stock
    if (maxAvailable > 0 && newQuantity > maxAvailable) {
      toast.error(`Only ${maxAvailable} units available for this variant`);
      return;
    }
    
    setQuantity(newQuantity);
  };

  const incrementQuantity = () => {
    if (!isMaxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.warning("Please select a variant before adding to cart.");
      return;
    }

    // Check if product is out of stock
    if (maxAvailable === 0) {
      toast.error("This product variant is currently out of stock");
      return;
    }

    // Check if quantity exceeds available stock
    if (quantity > maxAvailable) {
      toast.error(`Only ${maxAvailable} units available for this variant`);
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

    const cartItem = {
      id: productData.id,
      product_id: product.id,
      cartItemId: cartItemId,
      name: product.name,
      price: itemPrice,
      actual_price: actualPrice,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      final_price: Number(calculateFinalPrice()),
      quantity: quantity,
      image: mainImage,
      variant: selectedVariant,
      bulk_price: bulkPrice,
      max_available: maxAvailable
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
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-red-600">Product not found</h2>
        <Link to={`/${role}/products`} className="btn btn-outline mt-4 cursor-pointer">
          Back to Products
        </Link>
      </div>
    );
  }

  const isOutOfStock = maxAvailable === 0;
  const isMaxQuantity = quantity >= maxAvailable;

  return (
    <div className="max-w-8xl mx-auto py-4">
      {/* Back Button */}
      <button 
        onClick={() => navigate(`/${role}/products`)}
        className="btn btn-ghost btn-sm mb-4 cursor-pointer flex items-center gap-2"
      >
        <FiArrowLeft className="text-lg" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="space-y-4">
          <div
            className="relative w-full h-80 sm:h-96 lg:h-[500px] border-2 bg-gray-50 overflow-hidden rounded-2xl cursor-zoom-in shadow-sm"
            onClick={() => setZoom(!zoom)}
            onMouseMove={zoom ? handleZoom : null}
            onMouseLeave={() => setZoom(false)}
          >
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                zoom ? "scale-150" : "scale-100"
              }`}
              style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
            />
            {zoom && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm backdrop-blur-sm">
                Click to zoom out
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          <div className="flex gap-3 overflow-x-auto pb-4 px-1">
            {product.images?.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt="thumb"
                className={`w-16 h-16 sm:w-20 sm:h-20 object-cover border-2 rounded-lg cursor-pointer flex-shrink-0 transition-all ${
                  mainImage === img.image 
                    ? "border-primary shadow-md scale-105" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => setMainImage(img.image)}
              />
            ))}
          </div>
          
          {/* Video Section */}
          {product.video_url && getEmbedUrl(product.video_url) && (
            <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm border">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FiStar className="text-yellow-500" />
                Product Video
              </h3>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={getEmbedUrl(product.video_url)}
                  className="w-full h-48 sm:h-64 rounded-xl border-0"
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
          {/* Breadcrumb */}
          <div className="text-sm breadcrumbs text-gray-600">
            <ul>
              <li><Link to={`/${role}/products`} className="cursor-pointer hover:text-primary">Products</Link></li>
              <li><Link to={`/${role}/products`} className="cursor-pointer hover:text-primary">{product.category_name}</Link></li>
              <li className="text-primary font-semibold">{product.name}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>SKU: <strong className="font-mono">{product.sku}</strong></span>
              {isProductFeatured && (
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  <FiStar className="text-xs" />
                  Active
                </span>
              )}
              {!isProductFeatured && (
                <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  <FiStar className="text-xs" />
                  In-Active
                </span>
              )}
              {isOutOfStock && (
                <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Stock Information */}
          {selectedVariant && (
            <div className={`p-4 rounded-2xl border ${
              isOutOfStock 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {isOutOfStock ? 'Out of Stock' : 'Available Quantity:'}
                </span>
                <span className={`font-bold ${
                  isOutOfStock ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {isOutOfStock ? '0 units' : `${maxAvailable} units`}
                </span>
              </div>
              {!isOutOfStock && quantity > maxAvailable && (
                <div className="mt-2 text-sm text-red-600">
                  You cannot order more than available stock
                </div>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100">
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-3xl font-bold text-green-700">
                ₹{calculateFinalPrice()}
                {hasBulkPricing && (
                  <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Bulk Price
                  </span>
                )}
              </div>
              
              {/* Show original price with strike-through */}
              {basePrice > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-500 line-through">
                    ₹{calculateSubtotal()}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Price Breakdown - Show for both bulk and regular pricing */}
            <div className="mt-3 space-y-2 text-sm">
              {/* Original Price */}
              <div className="flex justify-between text-gray-600">
                <span>Original Price ({quantity} items):</span>
                <span className="font-semibold">₹{calculateSubtotal()}</span>
              </div>

              {/* Discount */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discountPercentage}%):</span>
                  <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {/* Price after discount */}
              {!hasBulkPricing && (
                <div className="flex justify-between text-gray-600">
                  <span>Price after discount:</span>
                  <span className="font-semibold">₹{priceAfterDiscount.toFixed(2)}</span>
                </div>
              )}
              
              {/* GST */}
              {gstAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>GST ({gstPercentage}%):</span>
                  <span className="font-semibold">+₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total Price:</span>
                <span className="text-green-700">₹{calculateFinalPrice()}</span>
              </div>
            </div>
            
            {hasBulkPricing && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-semibold flex items-center gap-2">
                  <FiTag className="text-green-600" />
                  🎉 Bulk discount applied! (Minimum {bulkPrice?.max_quantity} units)
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  You're saving {bulkPrice?.discount}% + GST benefits compared to regular pricing
                </div>
              </div>
            )}
          </div>

          {/* Variants Selection */}
          {variants.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
                <FiCheck className="text-green-500" />
                Available Variants
              </p>
              <div className="flex flex-wrap gap-3">
                {variants.map((variant) => {
                  const variantMaxAvailable = getMaxAvailableQuantity(variant);
                  const isVariantOutOfStock = variantMaxAvailable === 0;
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                      }}
                      disabled={!variant.is_active || isVariantOutOfStock}
                      className={`px-5 py-4 rounded-xl text-base font-semibold border-2 cursor-pointer transition-all min-w-[120px] ${
                        selectedVariant?.id === variant.id
                          ? "bg-primary text-white border-primary shadow-lg transform scale-105"
                          : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
                      } ${
                        !variant.is_active || isVariantOutOfStock 
                          ? "opacity-50 cursor-not-allowed grayscale" 
                          : ""
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold">{variant.name}</div>
                        <div className="text-sm font-normal mt-1 opacity-90">
                          {variant.is_default && "(Default)"}
                        </div>
                        {isVariantOutOfStock && (
                          <div className="text-xs text-red-600 mt-1">
                            Out of Stock
                          </div>
                        )}
                        {!isVariantOutOfStock && (
                          <div className="text-xs text-green-600 mt-1">
                            {variantMaxAvailable} available
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bulk Prices Table */}
          {selectedVariant?.bulk_prices?.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
                <FiTag className="text-blue-500" />
                Bulk Pricing Tiers
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left pb-3 font-bold text-gray-900">Minimum Quantity</th>
                      <th className="text-right pb-3 font-bold text-gray-900">Base Price</th>
                      <th className="text-right pb-3 font-bold text-gray-900">Discount</th>
                      <th className="text-right pb-3 font-bold text-gray-900">GST</th>
                      <th className="text-right pb-3 font-bold text-gray-900">Final Price</th>
                      <th className="text-right pb-3 font-bold text-gray-900">You Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedVariant.bulk_prices]
                      .sort((a, b) => a.max_quantity - b.max_quantity)
                      .map((bulk) => {
                        const variantFinalPrice = getActualPrice(selectedVariant); // Regular final price per unit
                        const savingsPerUnit = (variantFinalPrice - Number(bulk.final_price)).toFixed(2);
                        const totalSavings = (savingsPerUnit * bulk.max_quantity).toFixed(2);
                        const isActiveBulk = bulkPrice?.id === bulk.id;
                        
                        return (
                          <tr 
                            key={bulk.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              isActiveBulk ? 'bg-blue-50 font-semibold' : ''
                            }`}
                          >
                            <td className="py-3 font-semibold">
                              {bulk.max_quantity} + units
                              {isActiveBulk && (
                                <div className="text-xs text-green-600 mt-1">✓ Applied to your cart</div>
                              )}
                            </td>
                            <td className="text-right">
                              ₹{bulk.price}
                            </td>
                            <td className="text-right text-green-600 font-semibold">
                              {bulk.discount}%
                            </td>
                            <td className="text-right text-blue-600 font-semibold">
                              {bulk.gst_percentage}%
                            </td>
                            <td className="text-right font-bold text-green-600">
                              ₹{bulk.final_price}/unit
                            </td>
                            <td className="text-right text-orange-600 font-semibold">
                              ₹{totalSavings} total
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                * Savings calculated compared to regular single unit pricing
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          {["admin", "reseller"].includes(role) && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg text-gray-800">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementQuantity}
                    className="btn btn-circle btn-outline cursor-pointer hover:bg-gray-100 transition-colors"
                    disabled={isOutOfStock || !isProductFeatured || quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxAvailable}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 text-center border-2 border-gray-300 rounded-xl py-2 text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    disabled={isOutOfStock || !isProductFeatured}
                  />
                  <button
                    onClick={incrementQuantity}
                    className={`btn btn-circle btn-outline transition-colors ${
                      isMaxQuantity 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'cursor-pointer hover:bg-gray-100'
                    }`}
                    disabled={isOutOfStock || !isProductFeatured || isMaxQuantity}
                    title={isMaxQuantity ? `Maximum ${maxAvailable} units available` : ''}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {/* Bulk Price Notification */}
              {hasBulkPricing && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <FiTag className="text-green-600" />
                    <span className="font-semibold">
                      Bulk pricing active! You're saving {bulkPrice?.discount}% + GST benefits
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Minimum {bulkPrice?.max_quantity} units required for this price
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className={`btn btn-lg flex-1 flex items-center justify-center gap-2 transition-all duration-300 ${
                    isOutOfStock || !isProductFeatured || !selectedVariant
                      ? 'btn-disabled cursor-not-allowed'
                      : 'btn-primary cursor-pointer hover:shadow-lg'
                  }`}
                  disabled={isOutOfStock || !isProductFeatured || !selectedVariant}
                >
                  <FiShoppingCart className="text-md" />
                  {isOutOfStock
                    ? "Out of Stock"
                    : !isProductFeatured
                    ? "Product Unavailable"
                    : !selectedVariant
                    ? "Select Variant"
                    : `Add to Cart - ₹${calculateFinalPrice()}`}
                </button>
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                <FiCheck className="text-blue-500" />
                Product Description
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <FiStar className="text-yellow-500" />
                  Key Features
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                <FiTruck className="text-purple-500" />
                Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Brand:</strong> 
                    <span>{product.brand_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Category:</strong> 
                    <span>{product.category_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Subcategory:</strong> 
                    <span>{product.subcategory_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Weight:</strong> 
                    <span>{product.weight} {product.weight_unit}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Dimensions:</strong> 
                    <span>{product.dimensions}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Status:</strong>
                    <div className="flex gap-2">
                      <span
                        className={`badge font-bold ${
                          product.status === 'published' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {product.status || "draft"}
                      </span>
                      <span
                        className={`badge font-bold ${
                          isProductFeatured ? 'badge-success' : 'badge-secondary'
                        }`}
                      >
                        {isProductFeatured ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Warranty:</strong> 
                    <span className="flex items-center gap-1">
                      <FiShield className="text-green-500" />
                      {product.warranty || '0'} year(s)
                    </span>
                  </div>
                  {selectedVariant && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <strong className="text-gray-900">Variant SKU:</strong> 
                      <span className="font-mono">{selectedVariant.sku}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-2xl border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">Vendor Information</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                  {productData?.user_name?.charAt(0) || 'V'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{productData?.user_name || "N/A"}</p>
                  <p className="text-sm text-gray-600 font-bold">Vendor ID: {productData?.user_unique_id || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;