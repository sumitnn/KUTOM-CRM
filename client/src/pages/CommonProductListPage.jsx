import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiEdit, FiTrash2, FiEye, FiSearch, FiX, FiFilter, 
  FiCopy, FiRefreshCw, FiShoppingCart, FiStar, FiTag,
  FiBox, FiTrendingUp, FiArchive
} from "react-icons/fi";
import {
  useGetAdminProductsQuery,
} from "../features/adminProduct/adminProductApi";
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
  if (prod.product_detail?.images?.length > 0) {
    const featuredImage = prod.product_detail.images.find(img => img.is_featured) || 
                         prod.product_detail.images.find(img => img.is_default) || 
                         prod.product_detail.images[0];
    return featuredImage?.image || "/placeholder.png";
  }
  return "/placeholder.png";
};

const getDefaultPrice = (product, role) => {
  if (!product || !product.variants_detail?.length) return "0.00";

  // Find the default variant or fallback to first
  const defaultVariant = product.variants_detail.find(v => v.is_default) || product.variants_detail[0];
  const variantPrice = defaultVariant?.product_variant_prices?.[0];

  if (!variantPrice) return "0.00";

  // ✅ Choose price field based on role
  if (role === "stockist") {
    return variantPrice.stockist_price || variantPrice.actual_price || "0.00";
  } else if (role === "reseller") {
    return variantPrice.reseller_price || variantPrice.actual_price || "0.00";
  } else {
    return variantPrice.actual_price || "0.00";
  }
};

const getAvailableQuantity = (product) => {
  if (product.variants_detail?.length > 0) {
    // Use total_available_quantity from product_variant_prices
    const defaultVariant = product.variants_detail.find(v => v.is_default) || product.variants_detail[0];
    const variantPrice = defaultVariant?.product_variant_prices?.[0];
    
    if (variantPrice?.total_available_quantity !== undefined) {
      return Number(variantPrice.total_available_quantity);
    }
  }
  
  // Fallback to inventory calculation
  if (product.inventories?.length > 0) {
    return product.inventories.reduce((total, inv) => total + (inv.total_quantity || 0), 0);
  }
  
  return 0;
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard!');
};

const CommonProductListPage = ({ role }) => {
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
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showOutOfStock, setShowOutOfStock] = useState(false); // New state for out-of-stock filter

  // API calls
  const {
    data: productsData = { results: [] },
    isLoading,
    isError,
    refetch,
  } = useGetAdminProductsQuery({
    search: activeSearch,
    category: selectedCategory,
    subcategory: selectedSubCategory,
    brand: selectedBrand,
  });
  
  let products = productsData.results || [];
  
  // Filter out out-of-stock products if showOutOfStock is false
  if (!showOutOfStock) {
    products = products.filter(prod => getAvailableQuantity(prod) > 0);
  }
  
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: subcategories = [] } = useGetSubcategoriesByCategoryQuery(selectedCategory, {
    skip: !selectedCategory,
  });
  const { data: brands = [] } = useGetBrandsQuery();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success('Products refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedBrand("");
    setShowOutOfStock(false);
  };

  const handleAddToCart = (prod) => {
    const availableQuantity = getAvailableQuantity(prod);
    
    if (availableQuantity <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const variant = prod.variants_detail?.[0] || null;
    const variantPrice = variant?.product_variant_prices?.[0];
    
    if (!variant) {
      toast.error("Product variant not available");
      return;
    }

    // Check if item already in cart with same variant
    const isAlreadyInCart = cartItems.some(item => 
      item.product_id === prod.product_detail?.id && 
      item.variant?.id === variant?.id
    );

    if (isAlreadyInCart) {
      toast.info("Item already in cart");
      return;
    }

    // Get role-based price
    let unitPrice;
    if (role === "stockist") {
      unitPrice = variantPrice?.stockist_price || variantPrice?.actual_price;
    } else if (role === "reseller") {
      unitPrice = variantPrice?.reseller_price || variantPrice?.actual_price;
    } else {
      unitPrice = variantPrice?.actual_price;
    }

    dispatch(
      addItem({
        id: prod.product_detail?.id,
        product_id: prod.product_detail?.id,
        rolebaseid: prod.id,
        cartItemId: `${prod.product_detail?.id}_${variant.id}`,
        name: prod.product_detail?.name || prod.name,
        price: Number(unitPrice) || 0,
        actual_price: Number(variantPrice?.actual_price) || 0,
        quantity: 1,
        image: getProductImage(prod),
        variant: {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          product_variant_prices: variant.product_variant_prices ? [variant.product_variant_prices[0]] : [],
          bulk_prices: variant.bulk_prices || []
        },
        product_type: 'admin_product',
        description: prod.product_detail?.short_description,
        gst_tax: variantPrice?.gst_tax,
        gst_percentage: variantPrice?.gst_percentage,
        maxQuantity: availableQuantity
      })
    );

    toast.success("🎉 Item added to cart!");
  };

  const hasFilters = activeSearch || selectedCategory || selectedSubCategory || selectedBrand || showOutOfStock;

  // Stats for header
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(prod => getAvailableQuantity(prod) <= 0).length;
  const featuredProducts = products.filter(prod => prod.is_featured).length;

  return (
    <div className="min-h-screen  py-4">
      <div className="max-w-8xl mx-auto">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Product Catalog
              </h1>
              <p className="text-slate-600 mt-2 flex items-center gap-2">
                <FiBox className="w-4 h-4" />
                Browse and manage your product inventory
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <FiBox className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{totalProducts}</p>
                    <p className="text-sm text-slate-600">Available Products</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <FiArchive className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{outOfStockProducts}</p>
                    <p className="text-sm text-slate-600">Out of Stock</p>
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <FiTag className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 capitalize">{role}</p>
                    <p className="text-sm text-slate-600">Pricing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Controls Bar */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or description..."
                    className="w-full pl-12 pr-24 py-3 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-20 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={!searchTerm}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      searchTerm 
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/25 cursor-pointer' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                {/* View Toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-current rounded-sm" />
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <div className="w-4 h-4 flex flex-col gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-current rounded-sm h-1" />
                      ))}
                    </div>
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    refreshing 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60 shadow-sm cursor-pointer'
                  }`}
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                {/* Filter Toggle */}
                <button
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 lg:hidden cursor-pointer ${
                    showFilters 
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25' 
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
                  }`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FiFilter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Filters'}
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <div className={`mt-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    className="w-full p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subcategory</label>
                  <select
                    className="w-full p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer disabled:opacity-50"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                  <select
                    className="w-full p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
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

                {/* Out of Stock Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stock Status</label>
                  <select
                    className="w-full p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                    value={showOutOfStock}
                    onChange={(e) => setShowOutOfStock(e.target.value === 'true')}
                  >
                    <option value="false">In Stock Only</option>
                    <option value="true">Show Out of Stock</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={clearFilters}
                    disabled={!hasFilters}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${
                      hasFilters 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/25 cursor-pointer' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasFilters && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-600">Active filters:</span>
            {activeSearch && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Search: "{activeSearch}"
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setActiveSearch("");
                  }} 
                  className="hover:bg-blue-200 rounded-full p-0.5 cursor-pointer"
                >
                  <FiX size={14} />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Category: {categories.find(c => c.id == selectedCategory)?.name}
                <button 
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedSubCategory("");
                  }} 
                  className="hover:bg-green-200 rounded-full p-0.5 cursor-pointer"
                >
                  <FiX size={14} />
                </button>
              </span>
            )}
            {selectedSubCategory && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Subcategory: {subcategories.find(s => s.id == selectedSubCategory)?.name}
                <button 
                  onClick={() => setSelectedSubCategory("")} 
                  className="hover:bg-purple-200 rounded-full p-0.5 cursor-pointer"
                >
                  <FiX size={14} />
                </button>
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                Brand: {brands.find(b => b.id == selectedBrand)?.name}
                <button 
                  onClick={() => setSelectedBrand("")} 
                  className="hover:bg-orange-200 rounded-full p-0.5 cursor-pointer"
                >
                  <FiX size={14} />
                </button>
              </span>
            )}
            {showOutOfStock && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Showing Out of Stock
                <button 
                  onClick={() => setShowOutOfStock(false)} 
                  className="hover:bg-red-200 rounded-full p-0.5 cursor-pointer"
                >
                  <FiX size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Product Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading products...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-red-200/60 shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiX className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load products</h3>
              <p className="text-slate-600 mb-6">Please check your connection and try again</p>
              <button 
                className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm shadow-blue-500/25 cursor-pointer"
                onClick={refetch}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {products.length > 0 ? (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                  : 'space-y-4'
              }`}>
                {products.map((prod) => {
                  const availableQuantity = getAvailableQuantity(prod);
                  const isOutOfStock = availableQuantity <= 0;
                  const productDetail = prod.product_detail;
                  const variant = prod.variants_detail?.[0];
                  const variantPrice = variant?.product_variant_prices?.[0];
                  
                  // Get role-based price display
                  const displayPrice = getDefaultPrice(prod, role);
                  const actualPrice = variantPrice?.actual_price;
                  const showDiscount = (role === "stockist" || role === "reseller") && 
                                    displayPrice !== actualPrice && 
                                    actualPrice > displayPrice;
                  
                  return viewMode === 'grid' ? (
                    // Grid View Card
                    <div
                      key={prod.id}
                      className={`group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                        isOutOfStock ? 'border-red-200/60 opacity-70' : 'border-slate-200/60 hover:border-blue-300/60'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-blue-50/50">
                        <img
                          src={getProductImage(prod)}
                          alt={productDetail?.name}
                          className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            if (!e.target.src.includes("/placeholder.png")) {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.png";
                            }
                          }}
                        />
                        
                        {/* Status Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {!productDetail?.is_active ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Inactive</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Active</span>
                          )}
                          {isOutOfStock && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Out of Stock</span>
                          )}
                          {prod.is_featured && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1">
                              <FiStar className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                          {showDiscount && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              {role} Price
                            </span>
                          )}
                        </div>
                        
                        {/* SKU Badge */}
                        <div className="absolute top-3 right-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(productDetail?.sku);
                            }}
                            className="px-2 py-1 bg-slate-800/90 text-white rounded-lg text-xs font-mono cursor-pointer hover:bg-slate-900 transition-colors duration-200"
                            title="Click to copy SKU"
                          >
                            {productDetail?.sku}
                          </button>
                        </div>

                        {/* Add to Cart Overlay */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(prod);
                            }}
                            disabled={!productDetail?.is_active || isOutOfStock}
                            className={`p-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                              !productDetail?.is_active || isOutOfStock
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/40 cursor-pointer'
                            }`}
                          >
                            <FiShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-5">
                        {/* Brand and Category */}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {productDetail?.brand_name || 'No brand'}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {productDetail?.category_name || 'Uncategorized'}
                          </span>
                        </div>

                        {/* Product Name */}
                        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 leading-tight">
                          {productDetail?.name}
                        </h3>

                        {/* Short Description */}
                        {productDetail?.short_description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {productDetail.short_description}
                          </p>
                        )}

                        {/* Price and Stock */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="text-xl font-bold text-green-600">
                                ₹{displayPrice}
                              </div>
                              {showDiscount && (
                                <div className="text-sm text-slate-400 line-through">
                                  ₹{actualPrice}
                                </div>
                              )}
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              isOutOfStock 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {isOutOfStock ? 'Out of Stock' : `${availableQuantity} available`}
                            </div>
                          </div>
                          {showDiscount && (
                            <div className="text-xs text-green-600 font-medium">
                              🎉 Special {role} pricing applied!
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${role}/products/${prod.id}/`);
                            }}
                          >
                            <FiEye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View Item
                    <div
                      key={prod.id}
                      className={`group bg-white/80 backdrop-blur-sm rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg ${
                        isOutOfStock ? 'border-red-200/60 opacity-70' : 'border-slate-200/60 hover:border-blue-300/60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Image */}
                        <div className="w-full md:w-32 h-32 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={getProductImage(prod)}
                            alt={productDetail?.name}
                            className="w-full h-full object-contain p-3"
                          />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {productDetail?.brand_name}
                                </span>
                                {!productDetail?.is_active && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Inactive</span>
                                )}
                                {isOutOfStock && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Out of Stock</span>
                                )}
                                {prod.is_featured && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <FiStar className="w-3 h-3" />
                                    Featured
                                  </span>
                                )}
                                {showDiscount && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    {role} Price
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                                {productDetail?.name}
                              </h3>
                              
                              {productDetail?.short_description && (
                                <p className="text-slate-600 mb-3 line-clamp-2">
                                  {productDetail.short_description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                                  SKU: {productDetail?.sku}
                                </span>
                                <span>Category: {productDetail?.category_name}</span>
                                {variant?.name && (
                                  <span>Variant: {variant.name}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Price and Actions */}
                            <div className="flex flex-col items-end gap-3">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  ₹{displayPrice}
                                </div>
                                {showDiscount && (
                                  <>
                                    <div className="text-sm text-slate-400 line-through">
                                      ₹{actualPrice}
                                    </div>
                                    <div className="text-xs text-green-600 font-medium">
                                      {role} pricing
                                    </div>
                                  </>
                                )}
                                <div className={`mt-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                                  isOutOfStock 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {isOutOfStock ? 'Out of Stock' : `${availableQuantity} available`}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/${role}/products/${prod.id}/`);
                                  }}
                                >
                                  <FiEye className="w-4 h-4" />
                                  Details
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(prod);
                                  }}
                                  disabled={!productDetail?.is_active || isOutOfStock}
                                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                                    !productDetail?.is_active || isOutOfStock
                                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/25 cursor-pointer'
                                  }`}
                                >
                                  <FiShoppingCart className="w-4 h-4" />
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <div className="text-center py-20">
                <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-12 border border-slate-200/60 shadow-sm">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiBox className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    No products found
                  </h3>
                  <p className="text-slate-600 mb-8">
                    {hasFilters
                      ? "Try adjusting your search or filter criteria to find what you're looking for."
                      : "Get started by adding your first product to the catalog."}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 shadow-sm shadow-blue-500/25 cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommonProductListPage;