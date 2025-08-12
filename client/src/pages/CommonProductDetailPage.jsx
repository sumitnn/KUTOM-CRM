import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { useGetAdminProductByIdQuery } from "../features/adminProduct/adminProductApi";
import { toast } from "react-toastify";
import { FiMinus, FiPlus } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const CommonProductDetailPage = ({ role }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const { data: product, error, isLoading } = useGetAdminProductByIdQuery(id);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    if (product) {
      setMainImage(
        product.images?.find((img) => img.is_featured)?.image ||
          product.images?.[0]?.image ||
          "/placeholder.png"
      );
      if (product.sizes?.length) {
        setSelectedSize(product.sizes[0]);
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
        price: selectedSize?.price || product.price,
        quantity,
        image: mainImage,
        size: selectedSize,
        shipping_info: product.shipping_info
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

  const showActionButtons = ["stockist", "reseller"].includes(role);
  const isProductAvailable = product.is_active && product.stock_status === "in_stock";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <div className="relative w-full border bg-gray-100 overflow-hidden rounded-md">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full object-contain"
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
            ₹{selectedSize?.price || product.price}
          </div>

          {product.sizes?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-1">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
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

          {/* Quantity */}
          {showActionButtons && (
            <div className="flex items-center gap-3 mt-2">
              <span className="font-semibold">Qty:</span>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="btn btn-sm btn-outline"
                disabled={!isProductAvailable}
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
                disabled={!isProductAvailable}
              >
                <FiPlus />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {showActionButtons && (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                disabled={
                  !selectedSize ||
                  !isProductAvailable ||
                  product.quantity_available === 0
                }
              >
                {product.quantity_available === 0
                  ? "Out of Stock"
                  : !isProductAvailable
                  ? "Unavailable"
                  : "Add to Cart"}
              </button>
              <button
                className="btn btn-secondary"
                disabled={
                  !selectedSize || !isProductAvailable || product.quantity_available === 0
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

          {/* Details */}
          <div className="mt-6 border-t pt-4">
            <h2 className="text-xl font-extrabold mb-2">Additional Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <div><strong>Weight:</strong> {product.weight} {product.weight_unit}</div>
              <div><strong>Dimensions:</strong> {product.dimensions}</div>
              <div><strong>Status:</strong> {product.is_active ? "Active" : "Inactive"}</div>
              <div><strong>Stock Status:</strong> {product.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}</div>
              <div><strong>Available Quantity:</strong> {product.quantity_available}</div>
              <div><strong>Product Created:</strong> {new Date(product.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonProductDetailPage;