import { useState } from "react";
import { useGetMyProductsQuery } from "../features/product/productApi"; 
import { Link } from "react-router-dom";

const MyProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading, isError } = useGetMyProductsQuery();

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">My Products</h2>

      <div className="mb-6 flex justify-between items-center flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="input input-bordered w-full sm:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link to="/admin/products/create" className="btn btn-primary">
          + Add New Product
        </Link>
      </div>

      {isLoading ? (
        <p className="text-center text-lg text-gray-600">Loading products...</p>
      ) : isError ? (
        <p className="text-center text-red-500">Failed to load products.</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 mt-45">No products found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-xl shadow hover:shadow-md transition duration-200 overflow-hidden"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600">
                  Price: ₹{product.price} | Stock: {product.stock}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {product.category} / {product.subcategory}
                </p>
                <div className="flex justify-between mt-2">
                  <span
                    className={`badge ${
                      product.status === "active"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {product.status}
                  </span>
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="text-primary hover:underline text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;
