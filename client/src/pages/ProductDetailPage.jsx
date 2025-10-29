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
  const [selectedBulkPrice, setSelectedBulkPrice] = useState(null);

  // Extract product and variants from the response
  const product = productData?.product_detail;
  const variants = productData?.variants_detail || [];

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
        updateBulkPrice(defaultVariant, quantity);
      }
    }
  }, [product, variants]);

  const updateBulkPrice = (variant, qty) => {
    if (variant?.bulk_prices?.length > 0) {
      // Sort bulk prices by max_quantity in descending order
      const sortedBulkPrices = [...variant.bulk_prices].sort((a, b) => b.max_quantity - a.max_quantity);
      // Find the first bulk price where quantity >= max_quantity
      const applicableBulkPrice = sortedBulkPrices.find(bulk => qty >= bulk.max_quantity);
      setSelectedBulkPrice(applicableBulkPrice || null);
    } else {
      setSelectedBulkPrice(null);
    }
  };

  useEffect(() => {
    if (selectedVariant) {
      updateBulkPrice(selectedVariant, quantity);
    }
  }, [quantity, selectedVariant]);

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

  // Fixed: Check if exact same product + variant combination exists in cart
  const inCart = cartItems.some(
    (item) => item.id === product?.id && item.variant?.id === selectedVariant?.id
  );

  // Calculate price - use bulk price if available (all-inclusive), otherwise calculate from variant prices
  const calculatePrice = () => {
    // If bulk price is available, use it directly (all-inclusive)
    if (selectedBulkPrice) {
      return selectedBulkPrice.final_price;
    }
    
    // Otherwise, calculate price from product_variant_prices with discount
    if (selectedVariant?.product_variant_prices?.[0]) {
      const variantPrice = selectedVariant.product_variant_prices[0];
      const basePrice = Number(variantPrice.price);
      const discountAmount = basePrice * (variantPrice.discount / 100);
      return (basePrice - discountAmount).toFixed(2);
    }
    
    return 0;
  };

  // Calculate GST amount - return 0 if bulk pricing is applied (already included)
  const calculateGST = () => {
    // If bulk price is applied, GST is already included - return 0
    if (selectedBulkPrice) {
      return 0;
    }
    
    // Otherwise, calculate GST from product_variant_prices
    if (!selectedVariant?.product_variant_prices?.[0]) return 0;
    
    const variantPrice = selectedVariant.product_variant_prices[0];
    const priceWithoutGST = Number(calculatePrice());
    
    let gstAmount = 0;
    
    if (variantPrice.gst_tax) {
      gstAmount = Number(variantPrice.gst_tax) * quantity;
    } else if (variantPrice.gst_percentage) {
      gstAmount = (priceWithoutGST * (variantPrice.gst_percentage / 100)) * quantity;
    }
    
    return gstAmount.toFixed(2);
  };

  // Calculate final price
  const calculateFinalPrice = () => {
    const priceWithoutGST = Number(calculatePrice()) * quantity;
    const gstAmount = Number(calculateGST());
    return (priceWithoutGST + gstAmount).toFixed(2);
  };

  // Get base price with discount but without bulk pricing
  const getBasePrice = () => {
    if (!selectedVariant?.product_variant_prices?.[0]) return "0.00";
    
    const variantPrice = selectedVariant.product_variant_prices[0];
    const basePrice = Number(variantPrice.actual_price);
 
    return basePrice
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const handleAddToCart = () => {
  if (!selectedVariant) {
    toast.warning("Please select a variant before adding to cart.");
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

  const itemPrice = Number(calculatePrice());
  const gstAmount = selectedBulkPrice ? 0 : Number(calculateGST()) / quantity;
  const finalPrice = Number(calculateFinalPrice());

  const cartItem = {
    id: productData.id,
    product_id:product.id,
    cartItemId: cartItemId, // Unique identifier
    name: product.name,
    price: itemPrice,
    gst_percentage: selectedBulkPrice ? 0 : selectedVariant.product_variant_prices[0]?.gst_percentage || 0,
    gst_tax: selectedBulkPrice ? 0 : selectedVariant.product_variant_prices[0]?.gst_tax || 0,
    gst_amount: gstAmount,
    final_price: finalPrice,
    quantity: quantity,
    image: mainImage,
    variant: selectedVariant,
    bulk_price: selectedBulkPrice,
  };

  dispatch(addItem(cartItem));
  toast.success(`${quantity} item(s) added to cart!`);
  setQuantity(1); // Reset quantity
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

  const variantPrice = selectedVariant?.product_variant_prices?.[0];
  const hasBulkPricing = selectedBulkPrice !== null;

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
              {productData?.is_featured && (
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  <FiStar className="text-xs" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100">
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-3xl font-bold text-green-700">
                ₹{calculatePrice()}
                {hasBulkPricing && (
                  <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    All-inclusive ---
                  </span>
                )}
              </div>
              
              {variantPrice && variantPrice.discount > 0 && !hasBulkPricing && (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-500 line-through">
                    ₹{variantPrice.price}
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                    {variantPrice.discount}% OFF
                  </span>
                </div>
              )}
              
              {hasBulkPricing && Number(calculatePrice()) < Number(getBasePrice()) && (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-500 line-through">
                    ₹{getBasePrice()}
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-bold">
                    Bulk Discount
                  </span>
                </div>
              )}
            </div>
            
            {/* GST and Final Price - Only show if not bulk pricing */}
            {!hasBulkPricing && variantPrice && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {variantPrice.gst_percentage 
                      ? `GST (${variantPrice.gst_percentage}%):` 
                      : `GST (${variantPrice.gst_percentage}%):`}
                  </span>
                  <span className="font-semibold">₹{calculateGST()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Final Price ({quantity} items):</span>
                  <span className="text-green-700">₹{calculateFinalPrice()}</span>
                </div>
              </div>
            )}
            
            {/* For bulk pricing, show all-inclusive message */}
            {hasBulkPricing && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Price includes:</span>
                  <span className="font-semibold text-green-600">GST & Discount</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total Price ({quantity} items):</span>
                  <span className="text-green-700">₹{calculateFinalPrice()}</span>
                </div>
              </div>
            )}
            
            {selectedBulkPrice && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-semibold flex items-center gap-2">
                  <FiTag className="text-green-600" />
                  🎉 Bulk discount applied! (Minimum {selectedBulkPrice.max_quantity} units)
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  All-inclusive price (GST & discount included)
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
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      updateBulkPrice(variant, quantity);
                    }}
                    disabled={!variant.is_active}
                    className={`px-5 py-4 rounded-xl text-base font-semibold border-2 cursor-pointer transition-all min-w-[120px] ${
                      selectedVariant?.id === variant.id
                        ? "bg-primary text-white border-primary shadow-lg transform scale-105"
                        : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
                    } ${!variant.is_active ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                  >
                    <div className="text-center">
                      <div className="font-bold">{variant.name}</div>
                      <div className="text-sm font-normal mt-1 opacity-90">
                        {variant.is_default && "(Default)"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Prices Table */}
          {selectedVariant?.bulk_prices?.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
                <FiTag className="text-blue-500" />
                Bulk Pricing Tiers (All-inclusive)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left pb-3 font-bold text-gray-900">Minimum Quantity</th>
                      <th className="text-right pb-3 font-bold text-gray-900">All-inclusive Price</th>
                      <th className="text-right pb-3 font-bold text-gray-900">You Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedVariant.bulk_prices]
                      .sort((a, b) => a.max_quantity - b.max_quantity)
                      .map((bulk, index, array) => {
                        // Calculate base price with discount for comparison
                        const basePriceWithDiscount = getBasePrice();
                        const savings = (Number(basePriceWithDiscount) - Number(bulk.final_price)).toFixed(2);
                        return (
                          <tr 
                            key={bulk.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              selectedBulkPrice?.id === bulk.id ? 'bg-blue-50 font-semibold' : ''
                            }`}
                          >
                            <td className="py-3 font-semibold">
                              {bulk.max_quantity} + units
                            </td>
                            <td className="text-right font-bold text-green-600">
                              ₹{bulk.final_price}
                              <div className="text-xs text-gray-500 font-normal">(GST & discount included)</div>
                            </td>
                            <td className="text-right text-orange-600 font-semibold">
                              {savings > 0 ? `₹${savings}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
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
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn btn-circle btn-outline cursor-pointer hover:bg-gray-100 transition-colors"
                    disabled={product.status === "draft" || !productData?.is_featured || quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 text-center border-2 border-gray-300 rounded-xl py-2 text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="btn btn-circle btn-outline cursor-pointer hover:bg-gray-100 transition-colors"
                    disabled={product.status === "draft" || !productData?.is_featured}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {/* Action Buttons - Removed Buy Now button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-lg flex-1 cursor-pointer hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  disabled={
                    !selectedVariant ||
                    product.status === "draft" ||
                    !productData?.is_featured
                  }
                >
                  <FiShoppingCart className="text-md" />
                  {product.status === "draft" || !productData?.is_featured
                    ? "Unavailable"
                    : `Add to Cart - ₹${(Number(calculateFinalPrice())).toFixed(2)}`}
                  
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
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <strong className="text-gray-900">Status:</strong> 
                    <span className={`badge ${
                      product.status === 'published' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {product.status_display || product.status || "N/A"}
                    </span>
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
                  <p className="text-sm text-gray-600">Vendor ID: {productData?.user_unique_id || "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-1">{productData?.role_display || "Test"}</p>
                  
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