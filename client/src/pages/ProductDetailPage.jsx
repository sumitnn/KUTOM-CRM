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
        if (defaultVariant?.bulk_prices?.length > 0) {
          // Sort bulk prices by max_quantity to find the appropriate tier
          const sortedBulkPrices = [...defaultVariant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
          setSelectedBulkPrice(sortedBulkPrices[0]);
        }
      }
    }
  }, [product, variants]);

  useEffect(() => {
    if (selectedVariant?.bulk_prices?.length > 0) {
      // Sort bulk prices by max_quantity to find the first matching tier
      const sortedBulkPrices = [...selectedVariant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
      const matchingBulkPrice = sortedBulkPrices.find(bulk => quantity <= bulk.max_quantity);
      setSelectedBulkPrice(matchingBulkPrice || null);
    } else {
      setSelectedBulkPrice(null);
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
    return product?.price || 0;
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.warning("Select a variant before adding to cart.");
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
        variant: selectedVariant,
        bulk_price: selectedBulkPrice,
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
          <p className="text-gray-600">SKU: <strong>{product.sku}</strong></p>

          <div className="text-2xl font-extrabold text-green-600">
            ₹{calculatePrice()}
            {selectedBulkPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ₹{product.price}
              </span>
            )}
            {selectedBulkPrice && (
              <div className="text-sm text-green-600 mt-1">
                Bulk discount applied (up to {selectedBulkPrice.max_quantity} units)
              </div>
            )}
          </div>

          {variants.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-1">Available Variants</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      if (variant.bulk_prices?.length > 0) {
                        // Find the appropriate bulk price based on current quantity
                        const sortedBulkPrices = [...variant.bulk_prices].sort((a, b) => a.max_quantity - b.max_quantity);
                        const matchingBulkPrice = sortedBulkPrices.find(bulk => quantity <= bulk.max_quantity);
                        setSelectedBulkPrice(matchingBulkPrice || null);
                      } else {
                        setSelectedBulkPrice(null);
                      }
                    }}
                    disabled={!variant.is_active}
                    className={`px-3 py-1 rounded-md text-sm font-bold border cursor-pointer ${
                      selectedVariant?.id === variant.id
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:border-gray-500"
                    } ${!variant.is_active ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {variant.name} – ₹{variant.bulk_prices?.[0]?.price || product.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Prices */}
          {selectedVariant?.bulk_prices?.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold text-gray-700 mb-1">Bulk Pricing</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-bold">Max Quantity</th>
                      <th className="text-right pb-2 font-bold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedVariant.bulk_prices]
                      .sort((a, b) => a.max_quantity - b.max_quantity)
                      .map((bulk) => (
                        <tr 
                          key={bulk.id} 
                          className={`${
                            selectedBulkPrice?.id === bulk.id ? 'bg-blue-50 font-bold' : ''
                          }`}
                        >
                          <td className="py-2 font-extrabold">Up to {bulk.max_quantity}</td>
                          <td className="text-right font-bold">₹{bulk.price}</td>
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
                disabled={product.status === "draft" || !productData?.is_featured}
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
                disabled={product.status === "draft" || !productData?.is_featured}
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
                  !selectedVariant ||
                  product.status === "draft" ||
                  !productData?.is_featured
                }
              >
                {product.status === "draft" || !productData?.is_featured
                  ? "Unavailable"
                  : "Add to Cart"}
              </button>
              <button
                onClick={handleAddToCart}
                className="btn btn-secondary"
                disabled={
                  !selectedVariant || product.status === "draft" || !productData?.is_featured
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
              <div><strong>Status:</strong> {product.status_display || product.status || "N/A"}</div>
              <div><strong>Rating:</strong> {product.rating ? `${product.rating} ★` : "Not rated"}</div>
              <div><strong>Product Created:</strong> {new Date(product.created_at).toLocaleString()}</div>
              {selectedVariant && (
                <>
                  <div><strong>Variant:</strong> {selectedVariant.name}</div>
                  <div><strong>Variant SKU:</strong> {selectedVariant.sku}</div>
                </>
              )}
              <div><strong>Vendor:</strong> {productData?.user_name || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;