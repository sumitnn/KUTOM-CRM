import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiRotateCw,
  FiSearch,
  FiUpload,
  FiDownload,
  FiExternalLink,
  FiPackage,
  FiUser,
  FiTag,
  FiLayers,
  FiFilter,
  FiX
} from "react-icons/fi";
import {
  useGetProductsByStatusQuery,
  useUpdateProductStatusMutation,
} from "../../features/product/productApi";

const AdminProductApprovalPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingStates, setLoadingStates] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    category: "",
    brand: "",
    vendor: ""
  });

  // API calls with pagination and search
  const {
    data: pendingData,
    isLoading: isPendingLoading,
    isFetching: isPendingFetching,
    refetch: refetchPending,
  } = useGetProductsByStatusQuery({
    status: "draft",
    page: currentPage,
    pageSize,
    search: searchTerm,
  }, { skip: activeTab !== 'pending' });

  const {
    data: publishedData,
    isLoading: isPublishedLoading,
    isFetching: isPublishedFetching,
    refetch: refetchPublished,
  } = useGetProductsByStatusQuery({
    status: "published",
    page: currentPage,
    pageSize,
    search: searchTerm,
  }, { skip: activeTab !== 'published' });

  const {
    data: activeData,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching,
    refetch: refetchActive,
  } = useGetProductsByStatusQuery({
    status: "active",
    page: currentPage,
    pageSize,
    search: searchTerm,
  }, { skip: activeTab !== 'active' });

  const {
    data: inactiveData,
    isLoading: isInactiveLoading,
    isFetching: isInactiveFetching,
    refetch: refetchInactive,
  } = useGetProductsByStatusQuery({
    status: "inactive",
    page: currentPage,
    pageSize,
    search: searchTerm,
  }, { skip: activeTab !== 'inactive' });

  const [updateStatus] = useUpdateProductStatusMutation();

  // Helper function to transform product data based on new API structure
  const transformProductData = (products) => {
    if (!products) return [];
    
    return products.map((item) => {
      const product = item.product_detail || {};
      
      return {
        id: item.product || product.id,
        sku: product.sku,
        name: product.name,
        vendorId: item.user_unique_id || "N/A",
        vendorName: item.user_name || "N/A",
        brand: product.brand_name,
        category: product.category_name,
        subcategory: product.subcategory_name,
        type: product.product_type,
        status: product.status,
        statusDisplay: product.status_display,
        createdAt: product.created_at || item.created_at,
        updatedAt: product.updated_at || item.updated_at,
        isFeatured: item.is_featured || product.is_featured,
        productType: product.product_type,
        productTypeDisplay: product.product_type_display,
        images: product.images,
        features: product.features,
        description: product.description,
        weight: product.weight,
        weightUnit: product.weight_unit,
        dimensions: product.dimensions
      };
    });
  };

  const productData = {
    pending: {
      data: transformProductData(pendingData?.results),
      count: pendingData?.count || 0,
    },
    published: {
      data: transformProductData(publishedData?.results),
      count: publishedData?.count || 0,
    },
    active: {
      data: transformProductData(activeData?.results),
      count: activeData?.count || 0,
    },
    inactive: {
      data: transformProductData(inactiveData?.results),
      count: inactiveData?.count || 0,
    },
  };

  const handleRefresh = () => {
    setLoadingStates(prev => ({ ...prev, refresh: true }));
    const refetchPromise = (() => {
      switch(activeTab) {
        case "pending": return refetchPending();
        case "published": return refetchPublished();
        case "active": return refetchActive();
        case "inactive": return refetchInactive();
        default: return Promise.resolve();
      }
    })();

    refetchPromise.finally(() => {
      setLoadingStates(prev => ({ ...prev, refresh: false }));
    });
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    setLoadingStates(prev => ({ ...prev, [productId]: true }));
    
    try {
      await updateStatus({
        id: productId,
        status: newStatus,  
      }).unwrap();
      toast.success(`🎉 Product status changed to ${newStatus}`);
      handleRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update product status");
    } finally {
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const editProduct = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const viewProductDetails = (productId) => {
    navigate(`/admin/products/${productId}`);
  };

  const clearFilters = () => {
    setSelectedFilters({
      category: "",
      brand: "",
      vendor: ""
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const isLoading = 
    (activeTab === 'pending' && isPendingLoading) ||
    (activeTab === 'published' && isPublishedLoading) ||
    (activeTab === 'active' && isActiveLoading) ||
    (activeTab === 'inactive' && isInactiveLoading);

  const isFetching = 
    (activeTab === 'pending' && isPendingFetching) ||
    (activeTab === 'published' && isPublishedFetching) ||
    (activeTab === 'active' && isActiveFetching) ||
    (activeTab === 'inactive' && isInactiveFetching);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getTabStats = () => {
    return {
      pending: productData.pending.count,
      published: productData.published.count,
      active: productData.active.count,
      inactive: productData.inactive.count,
      total: productData.pending.count + productData.published.count + productData.active.count + productData.inactive.count
    };
  };

  const stats = getTabStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <FiPackage className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Product Approval
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Manage and review vendor product submissions
                  </p>
                </div>
              </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
                </div>
                <div className="bg-yellow-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-yellow-200/50">
                  <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                  <div className="text-sm text-yellow-600">Pending Review</div>
                </div>
                <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-blue-200/50">
                  <div className="text-2xl font-bold text-blue-700">{stats.published}</div>
                  <div className="text-sm text-blue-600">Published</div>
                </div>
                <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-green-200/50">
                  <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                  <div className="text-sm text-green-600">Active</div>
                </div>
                <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-red-200/50">
                  <div className="text-2xl font-bold text-red-700">{stats.inactive}</div>
                  <div className="text-sm text-red-600">Inactive</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={handleRefresh}
                disabled={loadingStates.refresh || isFetching}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-2xl text-gray-700 font-semibold hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
              >
                <FiRotateCw className={`w-4 h-4 ${(loadingStates.refresh || isFetching) ? 'animate-spin' : ''}`} />
                {loadingStates.refresh || isFetching ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Status Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-gray-200/50 mb-6">
              <div className="flex overflow-x-auto scrollbar-hide">
                {[
                  { id: "pending", label: "Pending", icon: FiClock, color: "yellow", count: stats.pending },
                  { id: "published", label: "Published", icon: FiUpload, color: "blue", count: stats.published },
                  { id: "active", label: "Active", icon: FiEye, color: "green", count: stats.active },
                  { id: "inactive", label: "Inactive", icon: FiEyeOff, color: "red", count: stats.inactive },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        activeTab === tab.id
                          ? `bg-${tab.color}-500 text-white shadow-lg`
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id 
                          ? 'bg-white/20 text-white' 
                          : `bg-${tab.color}-100 text-${tab.color}-700`
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      placeholder="Search products by name, SKU or vendor..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                    <FiFilter className="w-4 h-4" />
                    Filters
                  </button>
                  
                  {(searchTerm || Object.values(selectedFilters).some(Boolean)) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold hover:bg-red-100 transition-all duration-300 cursor-pointer"
                    >
                      <FiX className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
              {/* Loading states */}
              {(isLoading || isFetching) && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="loading loading-spinner text-primary loading-lg mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              )}

              {!isLoading && !isFetching && (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/50">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Vendor
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200/50">
                        {productData[activeTab]?.data?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <div className="text-center">
                                <div className="mx-auto h-20 w-20 text-gray-400 mb-4">
                                  {activeTab === "pending" ? (
                                    <FiClock className="w-full h-full" />
                                  ) : activeTab === "published" ? (
                                    <FiUpload className="w-full h-full" />
                                  ) : activeTab === "active" ? (
                                    <FiEye className="w-full h-full" />
                                  ) : (
                                    <FiEyeOff className="w-full h-full" />
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {activeTab === "pending" 
                                    ? "No pending products" 
                                    : activeTab === "published" 
                                      ? "No published products" 
                                      : activeTab === "active" 
                                        ? "No active products" 
                                        : "No inactive products"}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                  {searchTerm 
                                    ? 'Try adjusting your search criteria' 
                                    : `No ${activeTab} products found in the system`}
                                </p>
                                {searchTerm && (
                                  <button
                                    onClick={clearFilters}
                                    className="btn btn-primary cursor-pointer"
                                  >
                                    Clear Search
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          productData[activeTab].data.map((product, index) => (
                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {product.images?.[0] && (
                                    <img
                                      src={product.images[0].image}
                                      alt={product.name}
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">
                                      {product.sku}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <FiTag className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-600 capitalize">
                                        {product.productTypeDisplay || product.productType}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <FiUser className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {product.vendorName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {product.vendorId}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-900">
                                    {product.category || 'N/A'}
                                  </div>
                                  {product.subcategory && (
                                    <div className="text-xs text-gray-500">
                                      {product.subcategory}
                                    </div>
                                  )}
                                  {product.brand && (
                                    <div className="text-xs text-blue-600 font-semibold">
                                      {product.brand}
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(product.status)}`}>
                                  {product.statusDisplay || product.status}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {formatDate(product.createdAt)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Updated: {formatDate(product.updatedAt)}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-end gap-2">
                                  <button
                                    onClick={() => viewProductDetails(product.id)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-all duration-300 cursor-pointer text-sm"
                                  >
                                    <FiEye className="w-4 h-4" />
                                    View
                                  </button>

                                  {activeTab === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                      <button
                                        onClick={() => editProduct(product.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 cursor-pointer text-sm"
                                      >
                                        <FiEdit2 className="w-4 h-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleStatusUpdate(product.id, 'published')}
                                        disabled={loadingStates[product.id]}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                      >
                                        {loadingStates[product.id] ? (
                                          <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <FiCheckCircle className="w-4 h-4" />
                                        )}
                                        {loadingStates[product.id] ? 'Publishing...' : 'Publish'}
                                      </button>
                                    </div>
                                  )}

                                  {activeTab === 'published' && (
                                    <button
                                      onClick={() => handleStatusUpdate(product.id, 'draft')}
                                      disabled={loadingStates[product.id]}
                                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                    >
                                      {loadingStates[product.id] ? (
                                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <FiEyeOff className="w-4 h-4" />
                                      )}
                                      {loadingStates[product.id] ? 'Unpublishing...' : 'Unpublish'}
                                    </button>
                                  )}

                                  {(activeTab === 'active' || activeTab === 'inactive') && (
                                    <button
                                      onClick={() => handleStatusUpdate(product.id, activeTab === 'active' ? 'inactive' : 'active')}
                                      disabled={loadingStates[product.id]}
                                      className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-semibold hover:bg-yellow-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                    >
                                      {loadingStates[product.id] ? (
                                        <div className="w-4 h-4 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <FiRotateCw className="w-4 h-4" />
                                      )}
                                      {loadingStates[product.id] 
                                        ? 'Updating...' 
                                        : activeTab === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {productData[activeTab]?.count > 0 && (
                    <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200/50 bg-gray-50/50">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-semibold">
                          {Math.min(currentPage * pageSize, productData[activeTab].count)}
                        </span>{' '}
                        of <span className="font-semibold">{productData[activeTab].count}</span> products
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage * pageSize >= productData[activeTab].count}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Quick Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                 
                   <button
      onClick={() => navigate("/admin/products")}
      className="w-full flex items-center gap-3 p-3  bg-green-50 rounded-xl border border-green-200 text-green-700 font-semibold hover:bg-green-100 transition-all duration-300 cursor-pointer"
    >
      <FiExternalLink className="w-5 h-5" />
      View All Products
    </button>
                </div>
              </div>

              {/* Status Guide */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Guide</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Pending - Awaiting review</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Published - Live on platform</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Active - Available for sale</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Inactive - Not available</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• 5 products published today</p>
                  <p>• 12 pending reviews</p>
                  <p>• 3 vendors awaiting approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductApprovalPage;