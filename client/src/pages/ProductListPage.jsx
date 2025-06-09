import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
} from "../features/product/productApi";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Helper to get featured or fallback image
const getProductImage = (prod) => {
  console.log(prod.images );
  console.log(typeof(prod.images) );
  if (prod.images && prod.images.length > 0) {
    const featured = prod.images.find((img) => img.is_featured);
    return featured?.image;
  }
  return "/placeholder.png";
};

const ProductListPage = ({ role }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

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
        refetch();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleAddToCart = (prod) => {
    const isAlreadyInCart = cartItems.some((item) => item.id === prod.id);

    if (isAlreadyInCart) {
      toast.info("Item already in cart.");
    } else {
      dispatch(
        addItem({
          id: prod.id,
          name: prod.name,
          price: Number(prod.price),
          quantity: 1,
          image: getProductImage(prod),
        })
      );
      toast.success("Item added to cart successfully!");
    }
  };

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
     
      
      {/* Filters */}
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
          {}
          {(role === 'admin' || role === 'vendor') && (
  <button
    className="btn btn-primary"
    onClick={() => navigate(`/${role}/create-product`)}
  >
    + Add Product
  </button>
)}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
        <span className="loading loading-spinner text-error loading-lg"></span>
      </div>
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
                onClick={() => navigate(`/${role}/products/${prod.id}`)}
              >
                <figure className="h-48 bg-gray-100">
                  <img
                    src={getProductImage(prod)}
                    alt={prod.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      if (!e.target.src.includes("/placeholder.png")) {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.png";
                      }
                    }}
                  />
                </figure>
                <div className="card-body p-4 space-y-2">
                  <h2 className="card-title text-lg font-semibold">
                    {prod.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {prod.category || "Uncategorized"} &raquo;{" "}
                    {prod.subCategory || "-"}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-green-600">
                      ₹{Number(prod.price).toFixed(2)}
                    </span>
                    <span className="text-gray-600">
                      Stock: {prod.stock || 0}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {role === "reseller" && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(prod);
                        }}
                      >
                        Add to Cart
                      </button>
                    )}

                    <button
                      className="btn btn-sm btn-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${role}/products/${prod.id}`);
                      }}
                    >
                      <FiEye />
                    </button>

                    <button
                      className="btn btn-sm btn-warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${role}/products/edit/${prod.id}`);
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
