import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiEye, FiPlus, FiUpload } from "react-icons/fi";
import {
  useGetAllProductsQuery,
} from "../features/product/productApi";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const getProductImage = (prod) => {
  if (prod.images && prod.images.length > 0) {
    const featured = prod.images.find((img) => img.is_featured);
    return featured?.image || prod.images[0]?.image || null;
  }
  return null;
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  out_of_stock: "bg-red-100 text-red-800",
  draft: "bg-purple-100 text-purple-800",
};

const TabledProductListPage = ({ role }) => {
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

  const categories = [...new Set(products.map(p => p.category_name))].filter(Boolean);
  const subCategories = products.reduce((acc, product) => {
    if (product.category_name && product.subcategory_name) {
      if (!acc[product.category_name]) {
        acc[product.category_name] = new Set();
      }
      acc[product.category_name].add(product.subcategory_name);
    }
    return acc;
  }, {});

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      (selectedCategory ? p.category_name === selectedCategory : true) &&
      (selectedSubCategory ? p.subcategory_name === selectedSubCategory : true)
  );

  const handleAddToCart = (prod) => {
    const defaultSize = prod.sizes?.find(size => size.is_default);
    const price = defaultSize ? defaultSize.price : prod.price || 0;
    
    const isAlreadyInCart = cartItems.some((item) => item.id === prod.id);

    if (isAlreadyInCart) {
      toast.info("Item already in cart.");
    } else {
      dispatch(
        addItem({
          id: prod.id,
          name: prod.name,
          price: Number(price),
          quantity: 1,
          image: getProductImage(prod) || "/placeholder.png",
        })
      );
      toast.success("Item added to cart successfully!");
    }
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Inventory</h1>
          <p className="text-sm text-gray-500">
            Manage your products and inventory
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            className="input input-bordered w-full sm:w-48 focus:ring-2 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <select
            className="select select-bordered w-full sm:w-40 focus:ring-2 focus:ring-primary"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select
            className="select select-bordered w-full sm:w-40 focus:ring-2 focus:ring-primary"
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            disabled={!selectedCategory}
          >
            <option value="">All Subcategories</option>
            {selectedCategory &&
              Array.from(subCategories[selectedCategory] || []).map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
          </select>
          
          {(role === 'admin' || role === 'vendor') && (
            <div className="flex gap-2">
              <button
                className="btn btn-primary gap-2"
                onClick={() => navigate(`/${role}/create-product`)}
              >
                <FiPlus /> Create
              </button>
              <button
                className="btn btn-outline gap-2"
                disabled
              >
                <FiUpload /> Import
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : isError ? (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Failed to load products. <button className="btn btn-sm btn-outline ml-2" onClick={refetch}>Retry</button></span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              {/* Table Head */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12">Sr No.</th>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Image</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((prod, index) => {
                    const defaultSize = prod.sizes?.find(size => size.is_default);
                    const stock = prod.sizes?.reduce((sum, size) => sum + (size.quantity || 0), 0);
                    const price = defaultSize ? defaultSize.price : prod.price || 0;
                    const productImage = getProductImage(prod);

                    return (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td>{index + 1}</td>
                        <td>
                          {new Date(prod.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <div className="font-medium">{prod.name}</div>
                          <div className="text-xs text-gray-500">SKU: {prod.sku}</div>
                        </td>
                        <td>{prod.brand_name || prod.brand || '-'}</td>
                        <td>{prod.category_name || prod.category || '-'}</td>
                        <td>{prod.subcategory_name || prod.subcategory || '-'}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stock > 10 ? 'bg-green-100 text-green-800' : 
                            stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {stock || 0} in stock
                          </span>
                        </td>
                        <td>
                          ₹{Number(price).toFixed(2)}
                        </td>
                        <td>
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {productImage ? (
                                <img 
                                  src={productImage} 
                                  alt={prod.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/placeholder.png";
                                  }}
                                />
                              ) : (
                                <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[prod.status?.toLowerCase() || 'active']
                          }`}>
                            {prod.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-center gap-3">
                            <button
                              className="btn btn-ghost btn-sm hover:bg-gray-200 p-2"
                              onClick={() => navigate(`/${role}/products/${prod.id}`)}
                              title="View"
                            >
                              <FiEye className="text-gray-600 text-lg" />
                            </button>
                            
                            {(role === 'admin' || role === 'vendor') && (
                              <button
                                className="btn btn-ghost btn-sm hover:bg-blue-50 p-2"
                                onClick={() => navigate(`/${role}/products/edit/${prod.id}`)}
                                title="Edit"
                              >
                                <FiEdit className="text-blue-600 text-lg" />
                              </button>
                            )}
                            
                            {role === "reseller" && (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => handleAddToCart(prod)}
                              >
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <h3 className="text-lg font-medium text-gray-700">No products found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                        {(role === 'admin' || role === 'vendor') && (
                          <button
                            className="btn btn-primary btn-sm mt-2"
                            onClick={() => navigate(`/${role}/create-product`)}
                          >
                            <FiPlus /> Create Product
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">{filteredProducts.length}</span> results
              </div>
              <div className="join">
                <button className="join-item btn btn-sm btn-disabled">«</button>
                <button className="join-item btn btn-sm btn-active">1</button>
                <button className="join-item btn btn-sm">2</button>
                <button className="join-item btn btn-sm">3</button>
                <button className="join-item btn btn-sm">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabledProductListPage;