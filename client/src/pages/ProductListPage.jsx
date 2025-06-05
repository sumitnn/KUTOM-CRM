import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
} from "../features/product/productApi"; // update path if needed

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ProductListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllProductsQuery();
  const [deleteProductApi] = useDeleteProductMutation();

  const categories = ["Electronics", "Apparel"];
  const subCategories = {
    Electronics: ["Mobiles", "Laptops"],
    Apparel: ["Shirts", "Pants"],
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      (selectedCategory ? p.category === selectedCategory : true) &&
      (selectedSubCategory ? p.subCategory === selectedSubCategory : true)
  );

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProductApi(id).unwrap();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">All Products</h1>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search by name..."
            className="input input-bordered w-full sm:w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select select-bordered w-full sm:w-40"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="select select-bordered w-full sm:w-40"
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            disabled={!selectedCategory}
          >
            <option value="">All Subcategories</option>
            {selectedCategory &&
              subCategories[selectedCategory].map((sub) => (
                <option key={sub}>{sub}</option>
              ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/products/create")}
          >
            + Add Product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500">Loading products...</div>
      ) : isError ? (
        <div className="text-center text-red-500">
          Failed to load products.{" "}
          <button className="btn btn-sm btn-outline" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="card bg-white shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1 cursor-pointer rounded-lg overflow-hidden"
                onClick={() => navigate(`/admin/products/${prod.id}`)}
              >
                <figure className="h-48 bg-gray-100">
                  <img
                    src={prod.image || "/placeholder.png"}
                    alt={prod.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.png";
                    }}
                  />
                </figure>
                <div className="card-body p-4 space-y-2">
                  <h2 className="card-title text-lg font-semibold">{prod.name}</h2>
                  <p className="text-sm text-gray-500">
                    {prod.category} &raquo; {prod.subCategory}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-green-600">
                      ₹{prod.price}
                    </span>
                    <span className="text-gray-600">Stock: {prod.stock}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/products/${prod.id}`);
                      }}
                    >
                      <FiEye />
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/products/edit/${prod.id}`);
                      }}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(prod.id);
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              No products found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
