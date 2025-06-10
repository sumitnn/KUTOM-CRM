import React, { useState, useEffect } from "react";
import { useGetProductByIdQuery } from "../features/product/productApi";
import { useParams } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiMinus, FiPlus } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";
import { Link } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_IMAGE_API_URL || "http://localhost:8000";

const ProductDetailsPage = () => {
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
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(24 reviews)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-2xl font-bold text-gray-900">${displayPrice}</span>
                  {selectedVariant?.price !== product.price && (
                    <span className="ml-2 text-lg text-gray-500 line-through">${product.price}</span>
                  )}
                </div>
                <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                  {displaySku}
                </span>
              </div>

              {/* Selected Variant Details */}
              {selectedVariant && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Selected Option</h3>
                      <h4 className="font-medium text-gray-800">{selectedVariant.name}</h4>
                      {selectedVariant.attributes && Object.entries(selectedVariant.attributes).map(([key, value]) => (
                        <p key={key} className="text-sm text-gray-600">
                          {key}: <span className="font-medium">{value}</span>
                        </p>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${selectedVariant.price}</p>
                      <p className={`text-sm font-medium ${
                        inStock ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {selectedVariant?.low_stock && inStock && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Low Stock
                  </span>
                )}
                {selectedVariant?.quantity && (
                  <span className="text-sm text-gray-600">
                    {selectedVariant.quantity} available
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                {product.description && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              {colors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Color</h3>
                  <div className="flex gap-3">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all relative ${
                          selectedColor === color ? 'border-primary' : 'border-transparent hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      >
                        {selectedColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <IoMdCheckmark className="text-white text-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Variants Section */}
              {otherVariants.length > 0 && (
                <div className="space-y-2">
                  <div 
                    className="flex justify-between items-center cursor-pointer p-2 hover:bg-gray-50 rounded"
                    onClick={() => setShowAllVariants(!showAllVariants)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      Other Options ({otherVariants.length})
                    </h3>
                    {showAllVariants ? (
                      <FiChevronUp className="text-gray-500" />
                    ) : (
                      <FiChevronDown className="text-gray-500" />
                    )}
                  </div>
                  
                  {showAllVariants && (
                    <div className="space-y-2 mt-2">
                      {otherVariants.map(variant => (
                        <div 
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant);
                            setShowAllVariants(false);
                          }}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedVariant?.id === variant.id 
                              ? 'border-primary bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">{variant.name}</h4>
                              {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
                                <p key={key} className="text-sm text-gray-600">
                                  {key}: <span className="font-medium">{value}</span>
                                </p>
                              ))}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">${variant.price}</p>
                              <p className={`text-sm font-medium ${
                                variant.in_stock ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {variant.in_stock ? 'In Stock' : 'Out of Stock'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <FiMinus className="text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedVariant?.quantity || undefined}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const max = selectedVariant?.quantity;
                      setQuantity(max ? Math.min(max, Math.max(1, value)) : Math.max(1, value));
                    }}
                    className="w-16 h-10 border border-gray-300 rounded text-center font-medium"
                  />
                  <button
                    onClick={() => {
                      const max = selectedVariant?.quantity;
                      if (!max || quantity < max) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
                    disabled={selectedVariant?.quantity && quantity >= selectedVariant.quantity}
                  >
                    <FiPlus className="text-gray-600" />
                  </button>
                  {selectedVariant?.quantity && (
                    <span className="text-sm text-gray-600 ml-2">
                      Max: {selectedVariant.quantity}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                    inStock 
                      ? 'bg-primary hover:bg-primary-dark text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!inStock}
                >
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button 
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                    inStock 
                      ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!inStock}
                >
                  Buy Now
                </button>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {product.brand && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Brand:</span> {product.brand}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span> {product.category || 'N/A'}
                </p>
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="font-medium text-sm">Tags:</span>
                    {product.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;