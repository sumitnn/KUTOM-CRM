import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetAdminProductByIdQuery } from "../features/adminProduct/adminProductApi";
import { toast } from "react-toastify";
import { FiMinus, FiPlus, FiStar, FiTruck, FiShield, FiArrowLeft, FiPackage } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const CommonProductDetailPage = ({ role }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const { data: productData, error, isLoading } = useGetAdminProductByIdQuery(id);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  // Extract product from the API response
  const product = productData?.results?.[0]?.product_detail;
  const inventory = productData?.results?.[0]?.inventories?.[0];
  const commission = productData?.results?.[0]?.commission;
  const lastHistory = inventory?.last_history;
  const availableQuantity = inventory?.total_quantity || 0;

  useEffect(() => {
    if (product) {
      setMainImage(
        product.images?.find((img) => img.is_featured)?.image ||
          product.images?.[0]?.image ||
          "/placeholder.png"
      );
      if (product.variants?.length) {
        setSelectedSize(product.variants[0]);
      }
    }
  }, [product]);

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const inCart = cartItems.some(
    (item) => item.id === product?.id && item.size?.id === selectedSize?.id
  );

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.max(1, Math.min(value, availableQuantity));
    setQuantity(newQuantity);
  };

  const incrementQuantity = () => {
    if (quantity < availableQuantity) {
      setQuantity(quantity + 1);
    } else {
      toast.warning(`Cannot order more than ${availableQuantity} items`);
    }
  };

  const decrementQuantity = () => {
    setQuantity(Math.max(1, quantity - 1));
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning("Select a size before adding to cart.");
      return;
    }

    if (availableQuantity === 0) {
      toast.error("This product is out of stock.");
      return;
    }

    if (quantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} items available in stock.`);
      return;
    }

    if (inCart) {
      toast.info("Item already in cart.");
      return;
    }

    dispatch(
      addItem({
        id: product.id,
        name: product.name,
        price: selectedSize?.product_variant_prices?.[0]?.price || product.price,
        quantity,
        image: mainImage,
        size: selectedSize,
        shipping_info: product.shipping_info,
        maxQuantity: availableQuantity
      })
    );

    toast.success("Added to cart!");
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
  const isProductAvailable = product.is_active && product.status === "published" && availableQuantity > 0;
  const currentPrice = selectedSize?.product_variant_prices?.[0]?.price || product.price;
  const actualPrice = selectedSize?.product_variant_prices?.[0]?.actual_price || currentPrice;
  const hasDiscount = currentPrice !== actualPrice;

  // Stock status indicator
  const getStockStatus = () => {
    if (availableQuantity === 0) return { text: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    if (availableQuantity <= 10) return { text: `Low Stock (${availableQuantity} left)`, color: "text-orange-600", bg: "bg-orange-50" };
    return { text: "In Stock", color: "text-green-600", bg: "bg-green-50" };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {productData?.results?.[0]?.is_featured && (
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

          {/* Price Section */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">₹{currentPrice}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-500 line-through">₹{actualPrice}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                  Save ₹{actualPrice - currentPrice}
                </span>
              </>
            )}
          </div>

          {/* Variants/Sizes */}
          {product.variants?.length > 0 && (
            <div className="border-t pt-6">
              <p className="font-semibold text-gray-700 mb-3">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedSize(variant)}
                    disabled={!variant.is_active}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      selectedSize?.id === variant.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    } ${!variant.is_active ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                  >
                    {variant.name} - ₹{variant.product_variant_prices?.[0]?.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {showActionButtons && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700">Quantity</span>
                <span className="text-sm text-gray-500">
                  Available: <strong>{availableQuantity}</strong> units
                </span>
              </div>
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
                  max={availableQuantity}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 text-center border border-gray-300 rounded-lg py-2 px-3 font-medium"
                  disabled={!isProductAvailable}
                />
                <button
                  onClick={incrementQuantity}
                  className="w-10 h-10 rounded-full border cursor-pointer border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= availableQuantity || !isProductAvailable}
                >
                  <FiPlus />
                </button>
              </div>
              {quantity > availableQuantity && (
                <p className="text-red-600 text-sm mt-2">
                  You cannot order more than {availableQuantity} items
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActionButtons && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary cursor-pointer hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedSize || !isProductAvailable || quantity > availableQuantity}
              >
                {availableQuantity === 0
                  ? "Out of Stock"
                  : !isProductAvailable
                  ? "Unavailable"
                  : "Add to Cart"}
              </button>
              <button
                className="flex-1 bg-gray-900 cursor-pointer hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedSize || !isProductAvailable || quantity > availableQuantity}
              >
                Buy Now
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
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "inventory"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Inventory
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
                  <div><strong>Dimensions:</strong> {product.dimensions}</div>
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

              {activeTab === "inventory" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Stock</h4>
                    <p className="text-2xl font-bold text-blue-700">{availableQuantity} units</p>
                  </div>
                  
                  {lastHistory && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Last Order</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Action:</strong> {lastHistory.action}</div>
                        <div><strong>Quantity:</strong> {lastHistory.change_quantity} units</div>
                        <div><strong>Previous Stock:</strong> {lastHistory.old_quantity}</div>
                        <div><strong>New Stock:</strong> {lastHistory.new_quantity}</div>
                        <div><strong>Date:</strong> {new Date(lastHistory.created_at).toLocaleString()}</div>
                      </div>
                      <p className="text-green-700 font-medium mt-2">
                        Last order: {lastHistory.change_quantity} units were {lastHistory.action.toLowerCase()}ed
                      </p>
                    </div>
                  )}

                  {commission && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Commission Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Reseller:</strong> ₹{commission.reseller_commission_value}</div>
                        <div><strong>Stockist:</strong> ₹{commission.stockist_commission_value}</div>
                        <div><strong>Type:</strong> {commission.commission_type_display}</div>
                      </div>
                    </div>
                  )}
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