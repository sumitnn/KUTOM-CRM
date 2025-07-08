// src/components/ProductListPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2, FiEye, FiSearch, FiX, FiFilter, FiCopy } from "react-icons/fi";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
} from "../features/product/productApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import {
  useGetCategoriesQuery,
  useGetSubcategoriesByCategoryQuery,
} from '../features/category/categoryApi';
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getProductImage = (prod) => {
  if (prod.images && prod.images.length > 0) {
    const defaultImg = prod.images.find((img) => img.is_default);
    const featuredImg = prod.images.find((img) => img.is_featured);
    return defaultImg?.image || featuredImg?.image || prod.images[0].image;
  }
  return "/placeholder.png";
};

const getDefaultPrice = (sizes) => {
  if (!sizes || sizes.length === 0) return '0.00';
  const defaultSize = sizes.find(size => size.is_default) || sizes[0];
  return defaultSize.price || '0.00';
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard!');
};

const ProductListPage = ({ role }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // API calls
  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllProductsQuery({
    search: activeSearch,
    category: selectedCategory,
    subCategory: selectedSubCategory,
    brand: selectedBrand,
  });

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: subcategories = [] } = useGetSubcategoriesByCategoryQuery(selectedCategory, {
    skip: !selectedCategory,
  });
  const { data: brands = [] } = useGetBrandsQuery();

  const [deleteProductApi] = useDeleteProductMutation();

  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedBrand("");
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProductApi(id).unwrap();
        toast.success("Product deleted successfully!");
        refetch();
      } catch (error) {
        toast.error("Failed to delete product");
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleAddToCart = (prod) => {
    const isAlreadyInCart = cartItems.some((item) => item.id === prod.id);
  
    if (isAlreadyInCart) {
      toast.info("Item already in cart.");
    } else {
      // Select the first size (or set a fallback if no sizes exist)
      const defaultSize = prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : null;
  
      dispatch(
        addItem({
          id: prod.id,
          name: prod.name,
          price: Number(defaultSize?.price || 0),
          quantity: 1,
          image: getProductImage(prod),
          size: defaultSize, 
          shipping_info: prod.shipping_info,
        })
      );
  
      toast.success("Item added to cart successfully!");
    }
  };

  const hasFilters = activeSearch || selectedCategory || selectedSubCategory || selectedBrand;

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      {/* Header and Main Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Search Bar with Button */}
          <div className="relative flex-1 min-w-[250px] flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              className="input input-bordered w-full pl-10 pr-24 cursor-pointer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            />
            <FiSearch className="absolute left-3 text-gray-400" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-20 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FiX />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={!searchTerm}
              className={`absolute right-2 cursor-pointer btn btn-sm ${searchTerm ? 'btn-primary' : 'btn-disabled'}`}
            >
              Search
            </button>
          </div>
          
          <button
            className="btn btn-outline lg:hidden cursor-pointer"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          
          {role === "vendor" && (
            <button
              className="btn btn-primary cursor-pointer"
              onClick={() => navigate(`/${role}/create-product`)}
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-6`}>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                className="select select-bordered w-full cursor-pointer"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory("");
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="label">
                <span className="label-text">Subcategory</span>
              </label>
              <select
                className="select select-bordered w-full cursor-pointer"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="label">
                <span className="label-text">Brand</span>
              </label>
              <select
                className="select select-bordered w-full cursor-pointer"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={!hasFilters}
                className={`btn w-full cursor-pointer ${hasFilters ? 'btn-outline btn-error' : 'btn-disabled'}`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <span className="loading loading-spinner text-primary loading-lg"></span>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <div className="alert alert-error max-w-md mx-auto">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Failed to load products.</span>
            </div>
            <button className="btn btn-sm btn-outline mt-4" onClick={refetch}>
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {hasFilters && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              {activeSearch && (
                <span className="badge badge-info gap-2">
                  Search: {activeSearch}
                  <button onClick={() => {
                    setSearchTerm("");
                    setActiveSearch("");
                  }}>
                    <FiX size={14} />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="badge badge-primary gap-2">
                  Category: {categories.find(c => c.id == selectedCategory)?.name}
                  <button onClick={() => {
                    setSelectedCategory("");
                    setSelectedSubCategory("");
                  }}>
                    <FiX size={14} />
                  </button>
                </span>
              )}
              {selectedSubCategory && (
                <span className="badge badge-secondary gap-2">
                  Subcategory: {subcategories.find(s => s.id == selectedSubCategory)?.name}
                  <button onClick={() => setSelectedSubCategory("")}>
                    <FiX size={14} />
                  </button>
                </span>
              )}
              {selectedBrand && (
                <span className="badge badge-accent gap-2">
                  Brand: {brands.find(b => b.id == selectedBrand)?.name}
                  <button onClick={() => setSelectedBrand("")}>
                    <FiX size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="card bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-100"
                >
                  <figure className="relative h-48 bg-gray-50">
                    <img
                      src={getProductImage(prod)}
                      alt={prod.name}
                      className="h-full w-full object-contain p-4"
                      onError={(e) => {
                        if (!e.target.src.includes("/placeholder.png")) {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.png";
                        }
                      }}
                    />
                    {prod.is_featured && (
                      <div className="absolute top-2 left-2 badge badge-primary">
                        Featured
                      </div>
                    )}
                    {prod.status === 'draft' && (
                      <div className="absolute top-2 left-2 badge badge-warning">
                        Draft
                      </div>
                    )}
                  </figure>
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <h2 className="card-title text-lg font-extrabold text-gray-800 line-clamp-2">
                        {prod.name}
                      </h2>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(prod.sku);
                        }}
                        className="badge badge-outline cursor-pointer hover:bg-gray-100 flex items-center gap-1"
                        title="Click to copy SKU"
                      >
                        <span className="text-xs">{prod.sku}</span>
                        <FiCopy size={10} />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600 font-medium mt-1">
                      <p className="line-clamp-1">
                        {prod.brand_name || 'No brand'} • {prod.category_name || 'Uncategorized'}
                      </p>
                      {prod.subcategory_name && (
                        <p className="text-xs mt-1 font-normal">{prod.subcategory_name}</p>
                      )}
                    </div>

                    {/* Short Description */}
                    {prod.short_description && (
                      <p className="text-sm text-gray-700 font-medium mt-2 line-clamp-2">
                        {prod.short_description}
                      </p>
                    )}

                    {/* Features */}
                    {prod.features && prod.features.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-bold text-gray-600 mb-1">Features:</div>
                        <div className="flex flex-wrap gap-1">
                          {prod.features.slice(0, 3).map((feature, index) => (
                            <span 
                              key={index} 
                              className="badge badge-sm badge-outline text-gray-600 font-medium"
                            >
                              {feature}
                            </span>
                          ))}
                          {prod.features.length > 3 && (
                            <span className="badge badge-sm badge-ghost text-gray-400">
                              +{prod.features.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          {prod.weight} {prod.weight_unit}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          Dimensions: {prod.dimensions || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          Shipping: {prod.shipping_info || 'N/A'}
                        </p>
                        {prod.warranty && (
                          <p className="text-xs text-gray-500 font-medium">
                            Warranty: {prod.warranty} {prod.warranty === '1' ? 'year' : 'years'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-green-600">
                          ₹{getDefaultPrice(prod.sizes)}
                        </p>
                        {prod.rating && (
                          <div className="badge badge-sm badge-success gap-1">
                            {prod.rating} ★
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sizes */}
                    {prod.sizes && prod.sizes.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-bold text-gray-600">Sizes:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prod.sizes.slice(0, 3).map((size) => (
                            <span key={size.id} className="badge badge-outline badge-sm font-medium">
                              {size.size} {size.unit} (₹{size.price})
                            </span>
                          ))}
                          {prod.sizes.length > 3 && (
                            <span className="badge badge-outline badge-sm">
                              +{prod.sizes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-square btn-ghost hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/${role}/products/${prod.id}`);
                          }}
                          title="View details"
                        >
                          <FiEye />
                        </button>

                        {["reseller", "admin"].includes(role) && (
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

                        {(role === "admin" || role === "vendor") && (
                          <>
                            <button
                              className="btn btn-sm btn-square btn-ghost hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/${role}/products/edit/${prod.id}`);
                              }}
                              title="Edit"
                            >
                              <FiEdit />
                            </button>

                            <button
                              className="btn btn-sm btn-square btn-ghost hover:bg-gray-100 hover:text-error"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProduct(prod.id);
                              }}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No products found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {hasFilters
                    ? "Try adjusting your search or filter criteria"
                    : "There are currently no products available"}
                </p>
                {hasFilters && (
                  <div className="mt-6">
                    <button
                      onClick={clearFilters}
                      className="btn btn-primary"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductListPage;