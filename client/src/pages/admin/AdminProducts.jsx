import React, { useState } from "react";


const sampleProducts = [
  {
    id: 1,
    name: "MacBook Pro",
    category: "Electronics",
    ordersLastWeek: 15,
    image:
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600&h=400&fit=crop",
    description: "Powerful laptop from Apple.",
  },
  {
    id: 2,
    name: "T-shirt",
    category: "Clothing",
    ordersLastWeek: 3,
    image:
      "https://images.unsplash.com/photo-1585386959984-a4155223f8e1?w=600&h=400&fit=crop",
    description: "100% cotton T-shirt.",
  },
  {
    id: 3,
    name: "Headphones",
    category: "Electronics",
    ordersLastWeek: 12,
    image:
      "https://images.unsplash.com/photo-1580894894512-f9c3b0355c9a?w=600&h=400&fit=crop",
    description: "Noise-cancelling headphones.",
  },
];

export default function AdminProducts() {
  const [category, setCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = category
    ? sampleProducts.filter((p) => p.category === category)
    : sampleProducts;

  const mostOrdered = sampleProducts.filter((p) => p.ordersLastWeek >= 10);
  const categories = [...new Set(sampleProducts.map((p) => p.category))];

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Inventory Dashboard</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-medium text-lg">Filter by Category:</span>
        <select
          className="select select-bordered w-full max-w-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option value={cat} key={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* All Products Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <figure>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />
              </figure>
              <div className="card-body">
                <h3 className="card-title">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                <p className="text-sm">Ordered {product.ordersLastWeek} times</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Most Ordered This Week */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary">Most Ordered This Week</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {mostOrdered.map((product) => (
            <div
              key={product.id}
              className="card card-bordered border-primary bg-base-100 shadow-md hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <figure>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />
              </figure>
              <div className="card-body">
                <h3 className="card-title text-primary">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                <p className="text-sm font-semibold">
                  {product.ordersLastWeek} orders
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-2xl mb-2">{selectedProduct.name}</h3>
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="rounded mb-4 w-full object-cover h-52"
            />
            <p>
              <strong>Category:</strong> {selectedProduct.category}
            </p>
            <p>
              <strong>Orders Last Week:</strong> {selectedProduct.ordersLastWeek}
            </p>
            <p className="mt-2">
              <strong>Description:</strong> {selectedProduct.description}
            </p>
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}