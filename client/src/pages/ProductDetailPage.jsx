import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetProductByIdQuery } from "../features/product/productApi";
import { toast } from "react-toastify";
import {
  FiMinus, FiPlus, FiChevronRight, FiShoppingCart, FiArrowLeft
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

  const inCart = cartItems.some(
    (item) => item.id === product?.id && item.variant?.id === selectedVariant?.id
  );

  const calculatePrice = () => {
    if (selectedBulkPrice) {
      return selectedBulkPrice.price;
    }
    // Return base price from variant or product
    return selectedVariant?.bulk_prices?.[0]?.price || product?.price || 0;
  };

  const getBasePrice = () => {
    return selectedVariant?.bulk_prices?.[0]?.price || product?.price || 0;
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

    if (inCart) {
      toast.info("Item already in cart.");
      return;
    }

    dispatch(
      addItem({
        id: product.id,
        name: product.name,
        price: Number(calculatePrice()),
        quantity,
        image: mainImage,
        variant: selectedVariant,
        bulk_price: selectedBulkPrice,
      })
    );

    toast.success(`${quantity} item(s) added to cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate(`/${role}/cart`);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(`/${role}/products`)}
        className="btn btn-ghost btn-sm mb-4 cursor-pointer"
      >
        <FiArrowLeft className="mr-2" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div
            className="relative w-full h-96 lg:h-[500px] border-2 bg-gray-100 overflow-hidden rounded-xl cursor-zoom-in"
            onClick={() => setZoom(!zoom)}
            onMouseMove={zoom ? handleZoom : null}
            onMouseLeave={() => setZoom(false)}
          >
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full h-full object-contain duration-300 transition-transform ${
                zoom ? "scale-150" : "scale-100"
              }`}
              style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
            />
            {zoom && (
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Click to zoom out
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images?.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt="thumb"
                className={`w-20 h-20 object-cover border-2 rounded-lg cursor-pointer flex-shrink-0 ${
                  mainImage === img.image ? "border-primary" : "border-gray-300"
                }`}
                onClick={() => setMainImage(img.image)}
              />
            ))}
          </div>
          
          {/* Video Section */}
          {product.video_url && getEmbedUrl(product.video_url) && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">Product Video</h3>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={getEmbedUrl(product.video_url)}
                  className="w-full h-64 rounded-xl border-0"
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
          <div className="text-sm breadcrumbs">
            <ul>
              <li><Link to={`/${role}/products`} className="cursor-pointer">Products</Link></li>
              <li><Link to={`/${role}/products`} className="cursor-pointer">{product.category_name}</Link></li>
              <li className="text-primary font-semibold">{product.name}</li>
            </ul>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-800">{product.name}</h1>
          <p className="text-gray-600">SKU: <strong>{product.sku}</strong></p>

          {/* Price Section */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-3xl font-extrabold text-green-600">
              ₹{calculatePrice()}
              {selectedBulkPrice && Number(calculatePrice()) < Number(getBasePrice()) && (
                <span className="ml-3 text-lg text-gray-500 line-through">
                  ₹{getBasePrice()}
                </span>
              )}
            </div>
            
            {selectedBulkPrice && (
              <div className="text-sm text-green-600 mt-2 font-semibold">
                🎉 Bulk discount applied! (Minimum {selectedBulkPrice.max_quantity} units)
                {selectedBulkPrice.max_quantity > 1 && (
                  <span className="ml-2 text-blue-600">
                    Save ₹{(Number(getBasePrice()) - Number(calculatePrice())).toFixed(2)} per unit
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Variants Selection */}
          {variants.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-semibold text-gray-700 mb-3 text-lg">Available Variants</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      updateBulkPrice(variant, quantity);
                    }}
                    disabled={!variant.is_active}
                    className={`px-4 py-3 rounded-lg text-base font-bold border-2 cursor-pointer transition-all ${
                      selectedVariant?.id === variant.id
                        ? "bg-primary text-white border-primary shadow-lg transform scale-105"
                        : "border-gray-300 hover:border-gray-500 hover:shadow-md"
                    } ${!variant.is_active ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {variant.name}
                    <div className="text-sm font-normal mt-1">
                      ₹{variant.bulk_prices?.[0]?.price || 'N/A'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Prices Table */}
          {selectedVariant?.bulk_prices?.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-semibold text-gray-700 mb-3 text-lg">Bulk Pricing Tiers</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left pb-2 font-bold text-gray-900">Minimum Quantity</th>
                      <th className="text-right pb-2 font-bold text-gray-900">Price per Unit</th>
                      <th className="text-right pb-2 font-bold text-gray-900">You Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedVariant.bulk_prices]
                      .sort((a, b) => a.max_quantity - b.max_quantity)
                      .map((bulk, index, array) => {
                        const basePrice = array[0].price;
                        const savings = (Number(basePrice) - Number(bulk.price)).toFixed(2);
                        return (
                          <tr 
                            key={bulk.id} 
                            className={`border-b hover:bg-gray-50 ${
                              selectedBulkPrice?.id === bulk.id ? 'bg-blue-50 font-bold' : ''
                            }`}
                          >
                            <td className="py-3 font-semibold">
                              {bulk.max_quantity}+ units
                            </td>
                            <td className="text-right font-bold text-green-600">
                              ₹{bulk.price}
                            </td>
                            <td className="text-right text-orange-600">
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
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn btn-circle btn-outline cursor-pointer"
                    disabled={product.status === "draft" || !productData?.is_featured || quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 text-center border-2 border-gray-300 rounded-lg py-2 text-lg font-bold focus:border-primary"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="btn btn-circle btn-outline cursor-pointer"
                    disabled={product.status === "draft" || !productData?.is_featured}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-lg flex-1 cursor-pointer"
                  disabled={
                    !selectedVariant ||
                    product.status === "draft" ||
                    !productData?.is_featured
                  }
                >
                  <FiShoppingCart className="mr-2" />
                  {product.status === "draft" || !productData?.is_featured
                    ? "Unavailable"
                    : `Add to Cart - ₹${(Number(calculatePrice()) * quantity).toFixed(2)}`}
                </button>
                
                <button
                  onClick={handleBuyNow}
                  className="btn btn-secondary btn-lg flex-1 cursor-pointer"
                  disabled={
                    !selectedVariant || 
                    product.status === "draft" || 
                    !productData?.is_featured
                  }
                >
                  Buy Now
                </button>
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-xl font-extrabold mb-3">Product Description</h2>
              <p className="text-gray-700 text-base leading-relaxed">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div>
                <h2 className="text-xl font-extrabold mb-3">Key Features</h2>
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

            {/* Specifications */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-extrabold mb-3">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div className="space-y-2">
                  <div><strong className="text-gray-900">Brand:</strong> {product.brand_name || "N/A"}</div>
                  <div><strong className="text-gray-900">Category:</strong> {product.category_name || "N/A"}</div>
                  <div><strong className="text-gray-900">Subcategory:</strong> {product.subcategory_name || "N/A"}</div>
                  <div><strong className="text-gray-900">Weight:</strong> {product.weight} {product.weight_unit}</div>
                </div>
                <div className="space-y-2">
                  <div><strong className="text-gray-900">Dimensions:</strong> {product.dimensions}</div>
                  <div><strong className="text-gray-900">Status:</strong> 
                    <span className={`ml-2 badge ${
                      product.status === 'published' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {product.status_display || product.status || "N/A"}
                    </span>
                  </div>
                  <div><strong className="text-gray-900">Warranty:</strong> {product.warranty || '0'} year(s)</div>
                  {selectedVariant && (
                    <>
                      <div><strong className="text-gray-900">Variant SKU:</strong> {selectedVariant.sku}</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Vendor Information</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  {productData?.user_name?.charAt(0) || 'V'}
                </div>
                <div>
                  <p className="font-semibold">{productData?.user_name || "N/A"}</p>
                  <p className="text-sm text-gray-600">Vendor ID: {productData?.user_unique_id || "N/A"}</p>
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