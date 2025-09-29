import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetAdminProductByIdQuery } from "../features/product/productApi";
import { toast } from "react-toastify";
import { FiChevronLeft } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const ViewProductPage = ({ role }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const { data: product, error, isLoading } = useGetAdminProductByIdQuery(id);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    if (product) {
      setMainImage(
        product.images?.find((img) => img.is_featured)?.image ||
          product.images?.[0]?.image ||
          "/placeholder.png"
      );
      if (product.sizes?.length) {
        const defaultSize = product.sizes.find((s) => s.is_default) || product.sizes[0];
        setSelectedSize(defaultSize);
        if (defaultSize?.price_tiers?.length > 0) {
          setSelectedTier(defaultSize.price_tiers[0]);
        }
      }
    }
  }, [product]);

  useEffect(() => {
    if (selectedSize?.price_tiers?.length > 0) {
      const sortedTiers = [...selectedSize.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity);
      const matchingTier = sortedTiers.find(tier => quantity >= tier.min_quantity);
      setSelectedTier(matchingTier || null);
    } else {
      setSelectedTier(null);
    }
  }, [quantity, selectedSize]);

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

  const calculatePrice = () => {
    if (selectedTier) {
      return selectedTier.price;
    }
    return selectedSize?.price || product?.price || 0;
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
        <Link to={`/${role}/my-stocks`} className="btn btn-outline mt-4">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link 
          to={`/${role}/my-stocks`} 
          className="inline-flex items-center text-primary hover:text-primary-focus font-medium"
        >
          <FiChevronLeft className="mr-1" /> Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="sticky top-4">
          <div
            className="relative w-full border bg-gray-100 overflow-hidden rounded-lg cursor-zoom-in"
            onClick={() => setZoom(!zoom)}
            onMouseMove={zoom ? handleZoom : null}
          >
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full h-96 object-contain duration-300 transition-transform ${
                zoom ? "scale-150" : "scale-100"
              }`}
              style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
            />
          </div>
          <div className="flex mt-4 gap-2 overflow-x-auto pb-2">
            {product.images?.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt="thumb"
                className={`w-16 h-16 object-cover border-2 rounded-md cursor-pointer transition ${
                  mainImage === img.image ? "border-primary" : "border-gray-300 hover:border-gray-400"
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
                  className="w-full h-64 rounded-lg border-0"
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
          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-500 mt-1">SKU: {product.sku}</p>

            <div className="mt-4">
              <span className="text-2xl font-bold text-gray-900">
                ₹{calculatePrice()}
              </span>
              {selectedTier && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ₹{selectedSize?.price}
                </span>
              )}
              {selectedTier && (
                <div className="text-sm text-green-600 mt-1">
                  Bulk discount applied ({selectedTier.min_quantity}+ units)
                </div>
              )}
            </div>
          </div>

          {product.sizes?.length > 0 && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Sizes</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => {
                      setSelectedSize(size);
                      if (size.price_tiers?.length > 0) {
                        const sortedTiers = [...size.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity);
                        const matchingTier = sortedTiers.find(tier => quantity >= tier.min_quantity);
                        setSelectedTier(matchingTier || null);
                      } else {
                        setSelectedTier(null);
                      }
                    }}
                    disabled={!size.is_active}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedSize?.id === size.id
                        ? "bg-primary text-white border-primary"
                        : "border border-gray-300 hover:border-gray-400 bg-white"
                    } ${!size.is_active ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {size.size} {size.unit && `(${size.unit})`} – ₹{size.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Tiers */}
          {selectedSize?.price_tiers?.length > 0 && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bulk Pricing</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-semibold">Quantity</th>
                      <th className="text-right pb-2 font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedSize.price_tiers]
                      .sort((a, b) => a.min_quantity - b.min_quantity)
                      .map((tier) => (
                        <tr 
                          key={tier.id} 
                          className={`${
                            selectedTier?.id === tier.id ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2">{tier.min_quantity}+ units</td>
                          <td className="text-right">₹{tier.price}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700">
              {product.description || "No description available."}
            </p>
          </div>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="space-y-2 text-gray-700">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1 h-1 mt-2 mr-2 bg-gray-500 rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex">
                <span className="text-gray-500 w-32">Brand:</span>
                <span className="text-gray-900">{product.brand_name || "N/A"}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Category:</span>
                <span className="text-gray-900">{product.category_name || "N/A"}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Subcategory:</span>
                <span className="text-gray-900">{product.subcategory_name || "N/A"}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Weight:</span>
                <span className="text-gray-900">{product.weight} {product.weight_unit}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Dimensions:</span>
                <span className="text-gray-900">{product.dimensions}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Shipping Info:</span>
                <span className="text-gray-900">{product.shipping_info || "N/A"}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Status:</span>
                <span className="text-gray-900 capitalize">{product.status || "N/A"}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Rating:</span>
                <span className="text-gray-900">{product.rating ? `${product.rating} ★` : "Not rated"}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Created:</span>
                <span className="text-gray-900">{new Date(product.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPage;