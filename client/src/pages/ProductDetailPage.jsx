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

  useEffect(() => {
    if (product) {
      setMainImage(
        product.images?.find((img) => img.is_featured)?.image ||
          product.images?.[0]?.image ||
          "/placeholder.png"
      );
      if (product.sizes?.length) {
        setSelectedSize(product.sizes.find((s) => s.is_default) || product.sizes[0]);
      }
    }
  }, [product]);

  const handleZoom = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const inCart = cartItems.some(
    (item) => item.id === product?.id && item.size?.id === selectedSize?.id
  );

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
        price: selectedSize.price,
        quantity,
        image: mainImage,
        size: selectedSize,
        shipping_info: product.shipping_info,
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
                    {size.size} – ₹{size.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="font-semibold">Qty:</span>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="btn btn-sm btn-outline"
            >
              <FiMinus />
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="btn btn-sm btn-outline"
            >
              <FiPlus />
            </button>
          </div>

          {/* Action Buttons */}
          {["admin", "reseller"].includes(role) && (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                disabled={!selectedSize || selectedSize.quantity === 0}
              >
                {selectedSize?.quantity === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button className="btn btn-secondary" disabled={!selectedSize}>
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
              <div><strong>Brand:</strong> {product.brand_name || "N/A"}</div>
              <div><strong>Category:</strong> {product.category_name || "N/A"}</div>
              <div><strong>Subcategory:</strong> {product.subcategory_name || "N/A"}</div>
              <div><strong>Weight:</strong> {product.weight} {product.weight_unit}</div>
              <div><strong>Dimensions:</strong> {product.dimensions}</div>
              <div><strong>Shipping Info:</strong> {product.shipping_info || "N/A"}</div>
              <div><strong>Status:</strong> {product.status || "N/A"}</div>
              <div><strong>Rating:</strong> {product.rating ? `${product.rating} ★` : "Not rated"}</div>
              <div><strong>Created:</strong> {new Date(product.created_at).toLocaleString()}</div>
              <div><strong>Updated:</strong> {new Date(product.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
