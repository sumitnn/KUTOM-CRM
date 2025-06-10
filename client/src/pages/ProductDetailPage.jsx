import React, { useState, useEffect } from "react";
import { useGetProductByIdQuery } from "../features/product/productApi";
import { useParams } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiMinus, FiPlus } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";
import { Link } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_IMAGE_API_URL || "http://localhost:8000";

const ProductDetailsPage = ({ role }) => {
  const { id } = useParams();
  const { data: product, error, isLoading } = useGetProductByIdQuery(id);

  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const colors = ["#FF0000", "#00FF00", "#0000FF"]; // Example colors

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.png";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    if (product) {
      // Set default variant if available
      if (product.variants?.length) {
        const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0];
        setSelectedVariant(defaultVariant);
      }

      // Set main image
      if (product.images?.length) {
        const featured = product.images.find(img => img.is_featured);
        setMainImage(getFullImageUrl(featured ? featured.image : product.images[0].image));
      }
    }
  }, [product]);

  const handleImageZoom = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const displayPrice = selectedVariant?.price || product?.price;
  const displaySku = selectedVariant?.sku || product?.sku;
  const inStock = selectedVariant ? selectedVariant.in_stock : true;
  const otherVariants = product?.variants?.filter(v => v.id !== selectedVariant?.id) || [];

  // Check if the role is admin, stockist, or vendor
  const isAdminOrStockistOrVendor = ["admin", "stockist", "vendor"].includes(role);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-gray-300 rounded-full mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-red-50 rounded-lg max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error loading product</h2>
        <p className="text-gray-600">We couldn't load the product details. Please try again later.</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!product) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-blue-50 rounded-lg max-w-md">
        <h2 className="text-xl font-bold text-blue-600 mb-2">Product not found</h2>
        <p className="text-gray-600">The product you're looking for doesn't exist or may have been removed.</p>
        <Link 
          to="/products" 
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-primary">Products</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-xl shadow-md overflow-hidden">
          {/* Images Section */}
          <div className="w-full lg:w-1/2 p-6">
            <div className="sticky top-6">
              <div 
                className={`relative bg-gray-100 rounded-xl mb-4 overflow-hidden ${zoomImage ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setZoomImage(!zoomImage)}
                onMouseMove={zoomImage ? handleImageZoom : undefined}
              >
                <img
                  src={mainImage}
                  alt={product.name}
                  className={`w-full h-auto max-h-[500px] object-contain rounded-lg transition-transform duration-200 ${
                    zoomImage ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    transformOrigin: zoomImage ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.png";
                  }}
                />
                {zoomImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <span className="text-white text-sm bg-black bg-opacity-70 px-2 py-1 rounded">
                      Click to zoom out
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map(({ id, image, alt_text }) => (
                  <button
                    key={id}
                    onClick={() => setMainImage(getFullImageUrl(image))}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border transition-all relative ${
                      mainImage === getFullImageUrl(image) 
                        ? "border-primary border-2" 
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={getFullImageUrl(image)}
                      alt={alt_text || `Thumbnail ${id}`}
                      className="w-full h-full object-cover"
                    />
                    {mainImage === getFullImageUrl(image) && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <IoMdCheckmark className="text-white text-xl" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full lg:w-1/2 p-6 border-l border-gray-100">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.07a1 1 0 00-.364 1.118l1.05 3.462c.29.963-.755 1.76-1.55 1.18l-2.8-2.07a1 1 0 00-1.175 0l-2.8 2.07c-.797.58-1.837-.217-1.55-1.18l1.05-3.462a1 1 0 00-.364-1.118l-2.8-2.07c-.784-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">4.0 (150 reviews)</span>
                </div>
                <p className="text-xl text-gray-700 font-semibold">${displayPrice}</p>
                <p className="text-gray-500 mt-2">{product.description}</p>
              </div>

              {/* Quantity and Color Options */}
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Quantity</span>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setQuantity(Math.max(quantity - 1, 1))}
                      className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <FiMinus className="w-5 h-5" />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <FiPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Color</span>
                  <div className="flex gap-2 mt-2">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 border-gray-200 ${color === selectedColor ? 'border-primary' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isAdminOrStockistOrVendor && (
                <div className="mt-6">
                  <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition">
                    Add to Cart
                  </button>
                  <button className="w-full bg-secondary text-white py-2 rounded-md mt-3 hover:bg-secondary-dark transition">
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
