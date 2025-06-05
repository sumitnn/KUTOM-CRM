import React, { useState } from "react";

const ProductDetailsPage = () => {
  const images = [
    "https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1496957961599-e35b69ef5d7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1528148343865-51218c4a13e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ];

  const [mainImage, setMainImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const colors = ["black", "gray-300", "blue-500"];
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap -mx-4">

          {/* Images Section */}
          <div className="w-full md:w-1/2 px-4 mb-8">
            <img
              src={mainImage}
              alt="Product"
              className="w-full h-auto rounded-lg shadow-md mb-4"
            />
            <div className="flex gap-4 py-4 justify-center overflow-x-auto">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  className={`w-16 sm:w-20 h-16 sm:h-20 object-cover rounded-md cursor-pointer transition-opacity duration-300 ${
                    mainImage === src ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setMainImage(src)}
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 px-4">
            <h2 className="text-3xl font-bold mb-2">Premium Wireless Headphones</h2>
            <p className="text-gray-600 mb-4">SKU: WH1000XM4</p>
            <div className="mb-4">
              <span className="text-2xl font-bold mr-2">$349.99</span>
              <span className="text-gray-500 line-through">$399.99</span>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, idx) => (
                <svg
                  key={idx}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-5 h-5 ${
                    idx < 4 ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
              <span className="ml-2 text-gray-600">(123 reviews)</span>
            </div>

            <p className="text-gray-700 mb-6">
              Experience industry-leading noise cancellation with the WH1000XM4 headphones. Comfortable fit, superior sound quality, and up to 30 hours of battery life.
            </p>

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
                    style={{ backgroundColor: color === "gray-300" ? "#d1d5db" : color }}
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
