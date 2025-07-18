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
    const defaultSize = prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : null;
    
    const isAlreadyInCart = cartItems.some(item => 
      item.id === prod.id && 
      (!item.size || (item.size && item.size.id === defaultSize?.id))
    );

    if (isAlreadyInCart) {
      toast.info("Item already in cart.");
      return;
    }

    let priceTier = null;
    if (defaultSize?.price_tiers?.length > 0) {
      const sortedTiers = [...defaultSize.price_tiers].sort((a, b) => b.min_quantity - a.min_quantity);
      priceTier = sortedTiers.find(tier => 1 >= tier.min_quantity) || null;
    }

    dispatch(
      addItem({
        id: prod.id,
        name: prod.name,
        price: priceTier ? priceTier.price : (defaultSize?.price || 0),
        quantity: 1,
        image: getProductImage(prod),
        size: defaultSize,
        shipping_info: prod.shipping_info,
        price_tier: priceTier
      })
    );

    toast.success("Item added to cart successfully!");
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
                  className="card bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  {/* Product Image with Status Badge */}
                  <figure className="relative aspect-square bg-gray-50">
                    <img
                      src={getProductImage(prod)}
                      alt={prod.name}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        if (!e.target.src.includes("/placeholder.png")) {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.png";
                        }
                      }}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {prod.status === 'draft' && !prod.is_featured && (
                        <span className="badge badge-warning text-xs">Draft (Inactive)</span>
                      )}
                      {prod.status === 'draft' && prod.is_featured && (
                        <span className="badge badge-warning text-xs">Draft</span>
                      )}
                      {prod.status === 'published' && prod.is_featured && (
                        <span className="badge badge-primary text-xs">Live</span>
                      )}
                      {prod.status === 'published' && !prod.is_featured && (
                        <span className="badge badge-secondary text-xs">Inactive</span>
                      )}
                    </div>
                    
                    {/* SKU Badge */}
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(prod.sku);
                        }}
                        className="badge badge-ghost text-xs cursor-pointer font-semibold hover:bg-gray-100"
                        title="Click to copy SKU"
                      >
                        {prod.sku}
                      </button>
                    </div>
                  </figure>

                  {/* Product Details */}
                  <div className="p-4">
                    {/* Brand and Category */}
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {prod.brand_name || 'No brand'}
                      </span>
                      <span className="text-xs font-bold text-gray-600">
                        {prod.category_name || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-[3rem]">
                      {prod.name}
                    </h2>

                    {/* Short Description */}
                    {prod.short_description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-[2.8rem]">
                        {prod.short_description}
                      </p>
                    )}

                    {/* Features */}
                    {prod.features && prod.features.length > 0 && (
                      <div className="mb-3">
                        <div className="text-md font-semibold text-black mb-1">Features:</div>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {prod.features.slice(0, 2).map((feature, index) => (
                            <li key={index} className="line-clamp-1">
                              {feature}
                            </li>
                          ))}
                          {prod.features.length > 2 && (
                            <li className="text-gray-400">+{prod.features.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Price and Rating */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-lg font-bold text-green-600">
                       ₹{getDefaultPrice(prod.sizes)}
                      </div>
                      {prod.rating && (
                        <div className="badge badge-success gap-1 text-xs">
                          {prod.rating} ★
                        </div>
                      )}
                    </div>

                    {/* Product Specifications */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">Weight:</span>
                        <span>{prod.weight} {prod.weight_unit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">Warranty:</span>
                        <span>{prod.warranty || '0'} {prod.warranty === '1' ? 'year' : 'years'}</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <span className="font-semibold text-gray-700">Shipping:</span>
                        <span>{prod.shipping_info || 'Calculated at checkout'}</span>
                      </div>
                    </div>

                    {/* Sizes */}
                    {prod.sizes && prod.sizes.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-900 mb-1">Available Sizes:</div>
                        <div className="flex flex-wrap gap-1">
                          {prod.sizes.slice(0, 3).map((size) => (
                            <span key={size.id} className="badge badge-outline text-xs">
                              {size.size} {size.unit}
                            </span>
                          ))}
                          {prod.sizes.length > 3 && (
                            <span className="badge badge-ghost text-xs">
                              +{prod.sizes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      <button
                        className="btn btn-sm btn-ghost hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${role}/products/${prod.id}`);
                        }}
                        title="View details"
                      >
                        <FiEye className="mr-1" />
                        <span className="text-xs">Details</span>
                      </button>

                      <div className="flex gap-2">
                        {["reseller", "admin"].includes(role) && (
                          <button
                            className="btn btn-sm font-bold btn-success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(prod);
                            }}
                            disabled={prod.status === 'draft' || prod.is_featured === false}
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