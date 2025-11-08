import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiEdit, 
  FiEye, 
  FiSearch, 
  FiX, 
  FiCopy,
  FiTag,
  FiPercent,
  FiDollarSign,
  FiStar
} from "react-icons/fi";
import {
  useGetAllProductsQuery,
} from "../features/product/productApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import {
  useGetCategoriesQuery,
  useGetSubcategoriesByCategoryQuery,
} from '../features/category/categoryApi';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getProductImage = (prod) => {
  const productDetail = prod.product_detail || {};
  if (productDetail.images && productDetail.images.length > 0) {
    const defaultImg = productDetail.images.find((img) => img.is_default);
    const featuredImg = productDetail.images.find((img) => img.is_featured);
    return defaultImg?.image || featuredImg?.image || productDetail.images[0].image;
  }
  return "/placeholder.png";
};

const getVariantPriceInfo = (variants) => {
  if (!variants || variants.length === 0) return { 
    basePrice: '0.00', 
    discount: 0, 
    gstPercentage: 0, 
    finalPrice: '0.00',
    variantPrice: null
  };
  
  const defaultVariant = variants.find(variant => variant.is_default) || variants[0];
  const variantPrice = defaultVariant?.product_variant_prices?.[0];
  
  if (!variantPrice) {
    return { 
      basePrice: '0.00', 
      discount: 0, 
      gstPercentage: 0, 
      finalPrice: '0.00',
      variantPrice: null
    };
  }

  const basePrice = Number(variantPrice.price);
  const discountAmount = basePrice * (variantPrice.discount / 100);
  const priceAfterDiscount = basePrice - discountAmount;
  const gstAmount = priceAfterDiscount * (variantPrice.gst_percentage / 100);
  const finalPrice = priceAfterDiscount + gstAmount;

  return {
    basePrice: basePrice.toFixed(2),
    discount: variantPrice.discount,
    gstPercentage: variantPrice.gst_percentage,
    finalPrice: finalPrice.toFixed(2),
    variantPrice: variantPrice,
    priceAfterDiscount: priceAfterDiscount.toFixed(2),
    gstAmount: gstAmount.toFixed(2)
  };
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard!');
};

const ProductListPage = ({ role }) => {
  const navigate = useNavigate();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // API calls
  const {
    data: apiResponse = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllProductsQuery({
    search: activeSearch,
    category: selectedCategory,
    subCategory: selectedSubCategory,
    brand: selectedBrand,
  });

  // Extract products from the API response
  const products = useMemo(() => {
    return apiResponse.map(item => ({
      id: item.id, // keep top-level ID separate
      product_id: item.product_detail?.id, // store product_detail id separately
      product_detail: item.product_detail, // keep full product_detail nested
      variants_detail: item.variants_detail,
      user_name: item.user_name,
      user_unique_id: item.user_unique_id,
      role: item.role,
      is_featured: item.is_featured,
    }));
  }, [apiResponse]);
  

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: subcategories = [] } = useGetSubcategoriesByCategoryQuery(selectedCategory, {
    skip: !selectedCategory,
  });
  const { data: brands = [] } = useGetBrandsQuery();

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

  const hasFilters = activeSearch || selectedCategory || selectedSubCategory || selectedBrand;

  // Product Card Component
  const ProductCard = ({ prod }) => {
    const priceInfo = getVariantPriceInfo(prod.variants_detail);
  
    return (
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-primary/20 overflow-hidden">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={getProductImage(prod)}
            alt={prod.name}
            className="w-full h-64 object-contain transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              if (!e.target.src.includes("/placeholder.png")) {
                e.target.onerror = null;
                e.target.src = "/placeholder.png";
              }
            }}
          />
          
          {/* Discount Badge */}
          {priceInfo.discount > 0 && (
            <div className="absolute top-4 left-4">
              <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <FiPercent className="w-3 h-3" />
                {priceInfo.discount}% OFF
              </span>
            </div>
          )}

          {/* GST Badge */}
          {priceInfo.gstPercentage > 0 && (
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <FiDollarSign className="w-3 h-3" />
                GST {priceInfo.gstPercentage}%
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-16 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
              prod?.product_detail?.status=== 'published' && prod.is_featured 
                ? 'bg-green-500 text-white' 
                : prod?.product_detail?.status === 'draft'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {prod?.product_detail?.status === 'published' && prod.is_featured ? 'Live' : 
               prod?.product_detail?.status === 'draft' ? 'Draft' : 'Inactive'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(prod.product_detail.sku);
              }}
              title="Copy SKU"
            >
              <FiCopy className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Vendor Badge */}
          <div className="absolute bottom-4 left-4">
            <span className="bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
              {prod.product_detail.brand_name || 'No Brand'}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-6">
          {/* Category */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {prod.product_detail.category_name || 'Uncategorized'}
            </span>
            {prod?.product_detail?.rating && (
              <div className="flex items-center gap-1 text-amber-500">
                <FiStar className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{prod?.product_detail?.rating}</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3 
            className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer text-lg leading-tight"
            onClick={() => navigate(`/${role}/products/${prod.id}`)}
          >
            {prod?.product_detail?.name}
          </h3>

          {/* Short Description */}
          {prod?.product_detail?.short_description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {prod?.product_detail?.short_description}
            </p>
          )}

          {/* Price Breakdown */}
          <div className="mb-4 space-y-2">
            {/* Base Price and Discount */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                {priceInfo.discount > 0 ? (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ₹{priceInfo.basePrice}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{priceInfo.priceAfterDiscount}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{priceInfo.basePrice}
                  </span>
                )}
              </div>
              
              {priceInfo.discount > 0 && (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                  <FiTag className="w-3 h-3" />
                  <span className="text-sm font-semibold">Save {priceInfo.discount}%</span>
                </div>
              )}
            </div>

            {/* GST Information */}
            {priceInfo.gstPercentage > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>GST ({priceInfo.gstPercentage}%):</span>
                <span className="font-semibold">₹{priceInfo.gstAmount}</span>
              </div>
            )}

            {/* Final Price */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-lg font-semibold text-gray-900">Final Price:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{priceInfo.finalPrice}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              onClick={() => navigate(`/${role}/products/${prod.id}`)}
            >
              <FiEye className="w-4 h-4" />
              View
            </button>
          </div>

          {/* Admin/Vendor Actions */}
          {(role === "admin" || role === "vendor") && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                onClick={() => navigate(`/${role}/products/edit/${prod.id}`)}
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto py-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Product Catalog
              </h1>
              <p className="text-gray-600 text-lg">
                Discover {products.length} amazing {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[300px]">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products.."
                    className="w-full p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="btn btn-primary cursor-pointer rounded-2xl px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FiSearch className="mr-2" />
                Search
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {role === "vendor" && (
                  <button
                    className="btn btn-primary cursor-pointer rounded-2xl px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate(`/${role}/create-product`)}
                  >
                    + Add Product
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl inline-block">
            Showing <span className="font-semibold text-gray-900">{products.length}</span> products
          </div>
        </div>

        {/* Filters Section */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-8`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">Subcategory</label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer disabled:opacity-50"
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">Brand</label>
                <select
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
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
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer ${
                    hasFilters 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Active filters:</span>
            {activeSearch && (
              <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                Search: "{activeSearch}"
                <button onClick={() => { setSearchTerm(""); setActiveSearch(""); }} className="hover:text-blue-600 cursor-pointer">
                  <FiX className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="bg-green-100 text-green-800 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                Category: {categories.find(c => c.id == selectedCategory)?.name}
                <button onClick={() => { setSelectedCategory(""); setSelectedSubCategory(""); }} className="hover:text-green-600 cursor-pointer">
                  <FiX className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedSubCategory && (
              <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                Subcategory: {subcategories.find(s => s.id == selectedSubCategory)?.name}
                <button onClick={() => setSelectedSubCategory("")} className="hover:text-purple-600 cursor-pointer">
                  <FiX className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedBrand && (
              <span className="bg-orange-100 text-orange-800 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                Brand: {brands.find(b => b.id == selectedBrand)?.name}
                <button onClick={() => setSelectedBrand("")} className="hover:text-orange-600 cursor-pointer">
                  <FiX className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-gray-600 text-lg">Loading amazing products...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Failed to load products</h3>
              <p className="text-red-600 mb-6">Something went wrong while fetching products</p>
              <button 
                className="btn btn-outline btn-error cursor-pointer rounded-2xl"
                onClick={refetch}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod.id} prod={prod}  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="text-8xl mb-6">📦</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                  <p className="text-gray-600 mb-8">
                    {hasFilters
                      ? "Try adjusting your search or filter criteria to find what you're looking for."
                      : "There are currently no products available in the catalog."}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="btn btn-primary cursor-pointer rounded-2xl px-8 py-4"
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

export default ProductListPage;