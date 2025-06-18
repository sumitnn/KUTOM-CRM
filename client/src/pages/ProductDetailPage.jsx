import React, { useState, useEffect } from "react";
import { useGetProductByIdQuery } from "../features/product/productApi";
import { useParams } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiMinus, FiPlus } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";
import { Link } from "react-router-dom";

const ProductDetailsPage = ({ role }) => {
  const { id } = useParams();
  const { data: product, error, isLoading } = useGetProductByIdQuery(id);

  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    if (product) {
      // Set default size if available
      if (product.sizes?.length) {
        const defaultSize = product.sizes.find(s => s.is_default) || product.sizes[0];
        setSelectedSize(defaultSize);
      }

      // Set main image
      if (product.images?.length) {
        const featured = product.images.find(img => img.is_featured);
        setMainImage(featured ? featured.image : product.images[0].image);
      }
    }
  }, [product]);

  const handleImageZoom = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const displayPrice = selectedSize?.price || product?.price;
  const displaySku = product?.sku;
  const inStock = selectedSize ? selectedSize.quantity > 0 : true;
  const otherSizes = product?.sizes?.filter(s => s.id !== selectedSize?.id) || [];
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
          to={`/${role}/products`}
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
            <li><Link to={`/${role}/dashboard`} className="hover:text-primary">Home Dashboard</Link></li>
            <li>/</li>
            <li><Link to={`/${role}/products`} className="hover:text-primary">Products</Link></li>
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
                {mainImage ? (
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
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
                {zoomImage && mainImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <span className="text-white text-sm bg-black bg-opacity-70 px-2 py-1 rounded">
                      Click to zoom out
                    </span>
                  </div>
                )}
              </div>
              
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map(({ id, image, alt_text }) => (
                    <button
                      key={id}
                      onClick={() => setMainImage(image)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border transition-all relative ${
                        mainImage === image 
                          ? "border-primary border-2" 
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={alt_text || `Thumbnail ${id}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                      )}
                      {mainImage === image && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <IoMdCheckmark className="text-white text-xl" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full lg:w-1/2 p-6 border-l border-gray-100">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {product.status === "draft" && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Draft
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded ml-2">
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${product.rating && star <= product.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.07a1 1 0 00-.364 1.118l1.05 3.462c.29.963-.755 1.76-1.55 1.18l-2.8-2.07a1 1 0 00-1.175 0l-2.8 2.07c-.797.58-1.837-.217-1.55-1.18l1.05-3.462a1 1 0 00-.364-1.118l-2.8-2.07c-.784-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating ? `${product.rating.toFixed(1)} (${product.review_count || 0} reviews)` : 'No reviews yet'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-2xl text-gray-700 font-semibold">₹{displayPrice}</p>
                  {selectedSize?.cost_price && (
                    <p className="text-sm text-gray-500">
                      Cost: <span className="line-through">₹{selectedSize.cost_price}</span>
                    </p>
                  )}
                </div>
                
                <p className="text-gray-500 mb-2">{product.short_description}</p>
                <p className="text-sm text-gray-500">SKU: {displaySku}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Size Selection */}
              {product.sizes?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Available Sizes</span>
                    {product.sizes.length > 3 && (
                      <button 
                        onClick={() => setShowAllSizes(!showAllSizes)}
                        className="text-sm text-primary flex items-center"
                      >
                        {showAllSizes ? 'Show less' : 'Show all'} 
                        {showAllSizes ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(showAllSizes ? product.sizes : product.sizes.slice(0, 3)).map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`p-2 border rounded-md text-center transition-colors ${
                          selectedSize?.id === size.id 
                            ? 'border-primary bg-primary bg-opacity-10' 
                            : 'border-gray-200 hover:border-gray-400'
                        } ${!size.is_active ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!size.is_active}
                      >
                        <div className="font-medium">{size.size}</div>
                        <div className="text-sm text-gray-600">₹{size.price}</div>
                        <div className="text-xs text-gray-500">
                          {size.quantity > 0 ? `${size.quantity} available` : 'Out of stock'}
                        </div>
                        {size.is_default && (
                          <div className="text-xs text-primary mt-1">Default</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Size Details */}
              {selectedSize && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Size Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Size:</span> {selectedSize.size}
                    </div>
                    <div>
                      <span className="text-gray-600">Unit:</span> {selectedSize.unit}
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span> ₹{selectedSize.price}
                    </div>
                    <div>
                      <span className="text-gray-600">Stock:</span> {selectedSize.quantity}
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span> 
                      <span className={`ml-1 ${selectedSize.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedSize.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Tiers */}
              {selectedSize?.price_tiers?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bulk Pricing</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Min Quantity</th>
                        <th className="text-left pb-2">Price Each</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSize.price_tiers.map((tier) => (
                        <tr key={tier.id} className="border-b border-gray-100">
                          <td className="py-2">{tier.min_quantity}+</td>
                          <td className="py-2">₹{tier.price}</td>
                          <td className="text-right py-2">₹{(tier.min_quantity * tier.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quantity and Action Buttons */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Quantity</span>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setQuantity(Math.max(quantity - 1, 1))}
                      className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <FiMinus className="w-5 h-5" />
                    </button>
                    <span className="w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                      disabled={selectedSize && quantity >= selectedSize.quantity}
                    >
                      <FiPlus className="w-5 h-5" />
                    </button>
                  </div>
                  {selectedSize && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedSize.quantity} units available
                    </p>
                  )}
                </div>

                {!isAdminOrStockistOrVendor && (
                  <div className="mt-6 space-y-3">
                    <button 
                      className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition disabled:opacity-50"
                      disabled={!inStock}
                    >
                      {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button 
                      className="w-full bg-secondary text-white py-3 rounded-md hover:bg-secondary-dark transition disabled:opacity-50"
                      disabled={!inStock}
                    >
                      Buy Now
                    </button>
                  </div>
                )}
              </div>

              {/* Product Details Tabs */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex border-b border-gray-200">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "description" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("description")}
                  >
                    Description
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "details" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("details")}
                  >
                    Product Details
                  </button>
                </div>
                
                <div className="py-4">
                  {activeTab === "description" ? (
                    <div className="prose max-w-none">
                      <p>{product.description}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Basic Info</h4>
                        <div className="space-y-1">
                          <p><span className="text-gray-600">Brand:</span> {product.brand_name || 'N/A'}</p>
                          <p><span className="text-gray-600">Category:</span> {product.category_name || 'N/A'}</p>
                          {product.subcategory_name && (
                            <p><span className="text-gray-600">Subcategory:</span> {product.subcategory_name}</p>
                          )}
                          <p><span className="text-gray-600">Status:</span> 
                            <span className={`ml-1 capitalize ${product.status === 'published' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {product.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                        {product.tags?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.map(tag => (
                              <span 
                                key={tag.id} 
                                className="bg-gray-100 px-2 py-1 rounded-full text-xs"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No tags</p>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <h4 className="font-medium text-gray-700 mb-2">Dates</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <p><span className="text-gray-600">Created:</span> {new Date(product.created_at).toLocaleString()}</p>
                          <p><span className="text-gray-600">Updated:</span> {new Date(product.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
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