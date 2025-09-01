import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetProductByIdQuery } from "../features/product/productApi";
import { toast } from "react-toastify";
import {
  FiMinus, FiPlus, FiChevronRight
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const ProductDetailsPage = ({ role }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const { data: product, error, isLoading } = useGetProductByIdQuery(id);
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
      // Sort tiers by min_quantity in descending order to find the first matching tier
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

  const inCart = cartItems.some(
    (item) => item.id === product?.id && item.size?.id === selectedSize?.id
  );

  const calculatePrice = () => {
    if (selectedTier) {
      return selectedTier.price;
    }
    return selectedSize?.price || product?.price || 0;
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning("Select a size before adding to cart.");
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
        price: calculatePrice(),
        quantity,
        image: mainImage,
        size: selectedSize,
        shipping_info: product.shipping_info,
        price_tier: selectedTier,
        gst_tax: product.gst_tax,
        gst_percentage:product.gst_percentage
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
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-red-600">Product not found</h2>
        <Link to={`/${role}/products`} className="btn btn-outline mt-4">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <div
            className="relative w-full border bg-gray-100 overflow-hidden rounded-md cursor-zoom-in"
            onClick={() => setZoom(!zoom)}
            onMouseMove={zoom ? handleZoom : null}
          >
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full object-contain duration-300 transition-transform ${
                zoom ? "scale-150" : "scale-100"
              }`}
              style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
            />
          </div>
          <div className="flex mt-4 gap-2">
            {product.images?.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt="thumb"
                className={`w-16 h-16 object-cover border rounded-md cursor-pointer ${
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
        className="w-full h-64 rounded-md border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Product video"
      />
    </div>
  </div>
)}


        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-800">{product.name}</h1>
          <p className="text-gray-600">SKU: {product.sku}</p>

          <div className="text-2xl font-extrabold text-green-600">
            ₹{calculatePrice()}
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

          {product.sizes?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-1">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => {
                      setSelectedSize(size);
                      if (size.price_tiers?.length > 0) {
                        // Find the appropriate tier based on current quantity
                        const sortedTiers = [...size.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity);
                        const matchingTier = sortedTiers.find(tier => quantity >= tier.min_quantity);
                        setSelectedTier(matchingTier || null);
                      } else {
                        setSelectedTier(null);
                      }
                    }}
                    disabled={!size.is_active}
                    className={`px-3 py-1 rounded-md text-sm font-bold border cursor-pointer ${
                      selectedSize?.id === size.id
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:border-gray-500"
                    } ${!size.is_active ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {size.size} {size.unit && `(${size.unit})`} – ₹{size.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Tiers (Admin only) */}
          {selectedSize?.price_tiers?.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold text-gray-700 mb-1">Bulk Pricing</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-bold">Quantity</th>
                      <th className="text-right pb-2 font-bold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedSize.price_tiers]
                      .sort((a, b) => a.min_quantity - b.min_quantity)
                      .map((tier) => (
                        <tr 
                          key={tier.id} 
                          className={`${
                            selectedTier?.id === tier.id ? 'bg-blue-50 font-bold' : ''
                          }`}
                        >
                          <td className="py-2 font-extrabold">{tier.min_quantity}+</td>
                          <td className="text-right font-bold">₹{tier.price}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quantity */}
          {["admin", "reseller"].includes(role) && (
            <div className="flex items-center gap-3 mt-2">
              <span className="font-semibold">Qty:</span>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="btn btn-sm btn-outline"
                disabled={product.status === "draft" || !product.is_featured}
              >
                <FiMinus />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 text-center border border-gray-300 rounded-md py-1 px-2"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="btn btn-sm btn-outline"
                disabled={product.status === "draft" || !product.is_featured}
              >
                <FiPlus />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {["admin", "reseller"].includes(role) && (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                disabled={
                  !selectedSize ||
                  selectedSize.quantity === 0 ||
                  product.status === "draft" ||
                  !product.is_featured
                }
              >
                {selectedSize?.quantity === 0
                  ? "Out of Stock"
                  : product.status === "draft" || !product.is_featured
                  ? "Unavailable"
                  : "Add to Cart"}
              </button>
              <button
                onClick={handleAddToCart}
                className="btn btn-secondary"
                disabled={
                  !selectedSize || product.status === "draft" || !product.is_featured
                }
              >
                Buy Now
              </button>
            </div>
          )}

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-xl font-extrabold mb-2">Product Description</h2>
            <p className="text-gray-700 text-sm">
              {product.description || "No description available."}
            </p>
          </div>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-extrabold mb-2">Features</h2>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Details */}
          <div className="mt-6 border-t pt-4">
            <h2 className="text-xl font-extrabold mb-2">Additional Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <div><strong>Brand:</strong> {product.brand_name || "N/A"}</div>
              <div><strong>Category:</strong> {product.category_name || "N/A"}</div>
              <div><strong>Subcategory:</strong> {product.subcategory_name || "N/A"}</div>
              <div><strong>Weight:</strong> {product.weight} {product.weight_unit}</div>
              <div><strong>Dimensions:</strong> {product.dimensions}</div>
              <div><strong>Shipping Info:</strong> {product.shipping_info || "N/A"}</div>
              <div><strong>Status:</strong> {product.status || "N/A"}</div>
              <div><strong>Rating:</strong> {product.rating ? `${product.rating} ★` : "Not rated"}</div>
              <div><strong>Product Created:</strong> {new Date(product.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;