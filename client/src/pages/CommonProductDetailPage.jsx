import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetAdminProductByIdQuery } from "../features/adminProduct/adminProductApi";
import { toast } from "react-toastify";
import { FiMinus, FiPlus, FiStar, FiTruck, FiShield, FiArrowLeft, FiPackage, FiShoppingCart } from "react-icons/fi";
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
  const [selectedBulkPrice, setSelectedBulkPrice] = useState(null);

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
        updateBulkPrice(defaultVariant, quantity);
      }
    }
  }, [product, variantsDetail]);

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

  // Create unique identifier for cart items
  const inCart = cartItems.some(
    (item) => item.cartItemId === `${product?.id}_${selectedVariant?.id}`
  );

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    setQuantity(Math.max(1, quantity - 1));
  };

  // Get price based on role
  const getPriceForRole = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return "0.00";
    
    const priceData = variantPrices[0];
    switch (role) {
      case "stockist":
        return priceData.stockist_price || priceData.actual_price;
      case "reseller":
        return priceData.reseller_price || priceData.actual_price;
      default:
        return priceData.actual_price || priceData.price;
    }
  };

  // Get display price based on role
  const getDisplayPrice = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return "0.00";
    
    const priceData = variantPrices[0];
    switch (role) {
      case "stockist":
        return priceData.stockist_price || priceData.actual_price;
      case "reseller":
        return priceData.reseller_price || priceData.actual_price;
      default:
        return priceData.price || priceData.actual_price;
    }
  };

  const getAvailableQuantity = (variantPrices) => {
    if (!variantPrices || variantPrices.length === 0) return "0";
    return variantPrices[0].total_available_quantity;
  };

  // Calculate price - use bulk price if available (all-inclusive), otherwise calculate from variant prices
  const calculatePrice = () => {
    // If bulk price is available, use it directly (all-inclusive)
    if (selectedBulkPrice) {
      return selectedBulkPrice.final_price;
    }
    
    // Otherwise, calculate price from product_variant_prices
    if (selectedVariant?.product_variant_prices?.[0]) {
      const variantPrice = selectedVariant.product_variant_prices[0];
      const basePrice = Number(getPriceForRole(selectedVariant?.product_variant_prices));
      return basePrice.toFixed(2);
    }
    
    return "0.00";
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

  // Get base price without bulk pricing
  const getBasePrice = () => {
    if (!selectedVariant?.product_variant_prices?.[0]) return "0.00";
    return getPriceForRole(selectedVariant?.product_variant_prices);
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
      product_id: product.id,
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
      rolebaseid: rolebasedproductid,
      maxQuantity: 100 // You might want to get this from your API
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
  const hasBulkPricing = selectedBulkPrice !== null;

  // Price calculations
  const currentPrice = calculatePrice();
  const actualPrice = getBasePrice();
  const hasDiscount = currentPrice !== actualPrice && actualPrice;

  // Stock status indicator
  const getStockStatus = () => {
    const availableQuantity = 100; // Default value, replace with actual inventory data
    if (availableQuantity === 0) return { text: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    if (availableQuantity <= 10) return { text: `Low Stock (${availableQuantity} left)`, color: "text-orange-600", bg: "bg-orange-50" };
    return { text: "In Stock", color: "text-green-600", bg: "bg-green-50" };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="max-w-8xl mx-auto py-4">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <Link to={`/${role}/dashboard`} className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link to={`/${role}/products`} className="hover:text-gray-700">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="relative w-full bg-gray-50 rounded-xl overflow-hidden border">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-96 object-contain p-4"
            />
            {productData?.is_featured && (
              <span className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </span>
            )}
          </div>
          
          {/* Thumbnail Images */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images?.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt={img.alt_text}
                className={`w-20 h-20 object-cover border-2 rounded-lg cursor-pointer transition-all ${
                  mainImage === img.image ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
                }`}
                onClick={() => setMainImage(img.image)}
              />
            ))}
          </div>
          
          {/* Video Section */}
          {product.video_url && getEmbedUrl(product.video_url) && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FiStar className="text-yellow-500" /> Product Video
              </h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span>SKU: {product.sku}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
              <span>•</span>
              <span className="text-sm">
                Price for: <strong>{role === 'stockist' ? 'Stockist' : role === 'reseller' ? 'Reseller' : 'Customer'}</strong>
              </span>
            </div>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  <FiStar className="fill-current" />
                  <FiStar className="fill-current" />
                  <FiStar className="fill-current" />
                  <FiStar className="fill-current" />
                  <FiStar className="fill-current" />
                </div>
                <span className="text-sm text-gray-600">({product.rating})</span>
              </div>
            )}
          </div>

          {/* Enhanced Price Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100">
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-3xl font-bold text-green-700">
                ₹{calculatePrice()}
                {hasBulkPricing && (
                  <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    All-inclusive
                  </span>
                )}
              </div>
              
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
            {!hasBulkPricing && selectedVariant?.product_variant_prices?.[0] && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {selectedVariant.product_variant_prices[0].gst_percentage 
                      ? `GST (${selectedVariant.product_variant_prices[0].gst_percentage}%):` 
                      : `GST (Fixed):`}
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
                  <FiStar className="text-green-600" />
                  🎉 Bulk discount applied! (Minimum {selectedBulkPrice.max_quantity} units)
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  All-inclusive price (GST & discount included)
                </div>
              </div>
            )}
          </div>

          {/* Variants */}
          {variantsDetail.length > 0 && (
            <div className="border-t pt-6">
              <p className="font-semibold text-gray-700 mb-3">Available Variants</p>
              <div className="flex flex-wrap gap-2">
                {variantsDetail.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      updateBulkPrice(variant, quantity);
                    }}
                    disabled={!variant.is_active}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all cursor-pointer text-left min-w-[140px] ${
                      selectedVariant?.id === variant.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    } ${!variant.is_active ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                  >
                    <div className="font-semibold">{variant.name}</div>
                    <div className="text-sm mt-1">
                      ₹{getDisplayPrice(variant.product_variant_prices)}
                    </div>
                    
                    {/* Role-based label */}
                    {role && (
                      <span className="text-xs block mt-1 opacity-75">
                        {role === "stockist"
                          ? "Stockist"
                          : role === "reseller"
                          ? "Reseller"
                          : "Actual"}{" "}
                        Price
                      </span>
                    )}

                    {/* Available Quantity Display */}
                    <span className="text-xs block mt-1 text-gray-600">
                      Available:
                      <span className="font-semibold">
                        {getAvailableQuantity(variant.product_variant_prices)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Prices Table */}
          {selectedVariant?.bulk_prices?.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
                <FiStar className="text-blue-500" />
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
                      .map((bulk) => {
                        const basePrice = Number(getBasePrice());
                        const savings = (basePrice - Number(bulk.final_price)).toFixed(2);
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

          {/* Quantity Selector */}
          {showActionButtons && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementQuantity}
                    className="w-10 h-10 rounded-full border cursor-pointer border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1 || !isProductAvailable}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 text-center border border-gray-300 rounded-lg py-2 px-3 font-medium"
                    disabled={!isProductAvailable}
                  />
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 rounded-full border cursor-pointer border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    disabled={!isProductAvailable}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActionButtons && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary cursor-pointer hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!selectedVariant || !isProductAvailable}
              >
                <FiShoppingCart className="text-lg" />
                {!isProductAvailable
                  ? "Unavailable"
                  : `Add to Cart - ₹${calculateFinalPrice()}`}
              </button>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t">
            <div className="flex items-center gap-3">
              <FiTruck className="text-2xl text-primary" />
              <div>
                <p className="font-semibold">Free Shipping</p>
                <p className="text-sm text-gray-600">Above ₹999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiShield className="text-2xl text-primary" />
              <div>
                <p className="font-semibold">Secure Payment</p>
                <p className="text-sm text-gray-600">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiPackage className="text-2xl text-primary" />
              <div>
                <p className="font-semibold">Easy Returns</p>
                <p className="text-sm text-gray-600">30 Days Policy</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t pt-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("description")}
                className={`px-4 py-2 font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "description"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("pricing")}
                className={`px-4 py-2 font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "pricing"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pricing
              </button>
            </div>

            <div className="py-4">
              {activeTab === "description" && (
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description || "No description available."}
                  </p>
                  {product.features && product.features.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Key Features:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {product.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Brand:</strong> {product.brand_name}</div>
                  <div><strong>Category:</strong> {product.category_name}</div>
                  <div><strong>Subcategory:</strong> {product.subcategory_name}</div>
                  <div><strong>Weight:</strong> {product.weight} {product.weight_unit}</div>
                  <div><strong>Product Type:</strong> {product.product_type_display}</div>
                  <div><strong>Warranty:</strong> {product.warranty || "No warranty"}</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div><strong>Published:</strong> {product.status_display}</div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-4">
                  {variantsDetail.map((variant) => (
                    <div key={variant.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">{variant.name} (SKU: {variant.sku})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <strong className="text-blue-600">Actual Price</strong>
                          <p className="text-lg font-bold">₹{variant.product_variant_prices?.[0]?.actual_price}</p>
                        </div>
                        {role=="stockist" &&<div className="bg-white p-3 rounded border">
                          <strong className="text-green-600">Stockist Price</strong>
                          <p className="text-lg font-bold">₹{variant.product_variant_prices?.[0]?.stockist_price}</p>
                        </div> }
                        {role=="reseller" && <div className="bg-white p-3 rounded border">
                          <strong className="text-purple-600">Reseller Price</strong>
                          <p className="text-lg font-bold">₹{variant.product_variant_prices?.[0]?.reseller_price}</p>
                        </div>}
                        
                      </div>
                      <div className="mt-3 text-xs text-gray-600">
                        <strong>Your Role:</strong> {role || 'Customer'} | 
                        <strong> You Pay:</strong> ₹{getPriceForRole(variant.product_variant_prices)}
                      </div>
                    </div>
                  ))}
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