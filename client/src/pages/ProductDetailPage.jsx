import React, { useState, useEffect } from "react";
import { useGetProductByIdQuery } from "../features/product/productApi"; 
import { useParams } from "react-router-dom";

// Base URL of your backend, adjust accordingly or read from env
const BASE_URL = import.meta.env.VITE_IMAGE_API_URL || "http://localhost:8000";

const ProductDetailsPage = () => {
  const { id } = useParams(); 
  const { data: product, error, isLoading } = useGetProductByIdQuery(id);

  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const colors = ["black", "#d1d5db", "blue"];
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  // Helper to build full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "";
    // If already absolute URL, return as is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    // Otherwise prepend base URL
    return BASE_URL + imagePath;
  };

  useEffect(() => {
    if (product && product.images?.length && !mainImage) {
      const featured = product.images.find((img) => img.is_featured);
      setMainImage(getFullImageUrl(featured ? featured.image : product.images[0].image));
    }
  }, [product, mainImage]);

  if (isLoading) return <div className="flex items-center justify-center h-[60vh]">
  <span className="loading loading-spinner text-error loading-lg"></span>
</div>;
  if (error) return <p>Error loading product!</p>;
  if (!product) return <p>No product found.</p>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap -mx-4">
          {/* Images Section */}
          <div className="w-full md:w-1/2 px-4 mb-8">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-auto rounded-lg shadow-md mb-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.png"; // fallback image
              }}
            />
            <div className="flex gap-4 py-4 justify-center overflow-x-auto">
              {product.images.map(({ id, image, alt_text }) => (
                <img
                  key={id}
                  src={getFullImageUrl(image)}
                  alt={alt_text || `Thumbnail ${id}`}
                  className={`w-16 sm:w-20 h-16 sm:h-20 object-cover rounded-md cursor-pointer transition-opacity duration-300 ${
                    mainImage === getFullImageUrl(image) ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setMainImage(getFullImageUrl(image))}
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 px-4">
            <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-4">SKU: {product.sku}</p>
            <div className="mb-4">
              <span className="text-2xl font-bold mr-2">${product.price}</span>
            </div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Color Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Colors:</h4>
              <div className="flex gap-4">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 focus:outline-none ${
                      selectedColor === color ? "border-black" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="btn btn-outline btn-sm px-3"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input input-bordered w-16 text-center"
                aria-label="Quantity"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="btn btn-outline btn-sm px-3"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="btn btn-primary flex-1">Add to Cart</button>
              <button className="btn btn-secondary flex-1">Buy Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
