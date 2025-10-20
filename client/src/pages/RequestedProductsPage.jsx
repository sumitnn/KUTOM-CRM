import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiEyeOff,
  FiRotateCw,
  FiRefreshCw,
  FiPackage,
  FiUser,
  FiTag,
  FiLayers,
  FiDollarSign,
  FiPercent,
  FiShoppingBag
} from "react-icons/fi";
import {
  useGetProductsByStatusQuery,
  useUpdateProductStatusMutation,
} from "../features/product/productApi";

const RequestedProductsPage = ({ role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("draft");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingStates, setLoadingStates] = useState({});

  // API calls with pagination
  const {
    data: draftData,
    isLoading: isDraftLoading,
    isFetching: isDraftFetching,
    refetch: refetchDraft,
  } = useGetProductsByStatusQuery({
    status: "draft",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== 'draft' });

  const {
    data: publishedData,
    isLoading: isPublishedLoading,
    isFetching: isPublishedFetching,
    refetch: refetchPublished,
  } = useGetProductsByStatusQuery({
    status: "published",
    page: currentPage,
    pageSize,
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
  }, { skip: activeTab !== 'inactive' });

  const [updateStatus] = useUpdateProductStatusMutation();

  // Helper function to transform product data based on new API structure
  const transformProductData = (products) => {
    if (!products) return [];
    
    return products.map((item) => {
      const product = item.product_detail || {};
      const defaultVariant = item?.variants_detail?.[0]?.product_variant_prices?.[0]|| {};
     
      const variantPrice = defaultVariant.price;
      const discount = defaultVariant.discount;
      const gsttax = defaultVariant.gst_percentage;
      const totalprice = defaultVariant.actual_price;
      
      return {
        id: item.product || product.id,
        date: product.created_at || item.created_at,
        name: product.name,
        sku: product.sku,
        brand: product.brand_name,
        category: product.category_name,
        subcategory: product.subcategory_name,
        quantity: 0,
        baseprice: parseFloat(variantPrice || product.price || 0),
        actual_price: parseFloat(totalprice || product.price || 0),
        gst: parseFloat(gsttax || product.price || 0),
        discount: parseFloat(discount || product.price || 0),
        demandDate: product.updated_at || item.updated_at,
        status: product.status || item.status,
        isFeatured: item.is_featured || product.is_featured,
      };
    });
  };

  const requestData = {
    draft: {
      data: transformProductData(draftData?.results),
      count: draftData?.count || 0,
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
        case "draft": return refetchDraft();
        case "published": return refetchPublished();
        case "active": return refetchActive();
        case "inactive": return refetchInactive();
        default: return Promise.resolve();
      }
    })();

    refetchPromise.finally(() => {
      setLoadingStates(prev => ({ ...prev, refresh: false }));
      setRefreshKey(prev => prev + 1);
    });
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    setLoadingStates(prev => ({ ...prev, [productId]: true }));
    
    try {
      if (!productId || !newStatus) {
        console.error("Product ID and status are required");
        return;
      }

      await updateStatus({
        id: productId,
        status: newStatus,  
      }).unwrap();

      toast.success(`🎉 Product marked as ${newStatus}`);
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

  const handleViewProduct = (productId) => {
    navigate(`/vendor/products/${productId}`);
  };

  const isLoading = 
    (activeTab === 'draft' && isDraftLoading) ||
    (activeTab === 'published' && isPublishedLoading) ||
    (activeTab === 'active' && isActiveLoading) ||
    (activeTab === 'inactive' && isInactiveLoading);

  const isFetching = 
    (activeTab === 'draft' && isDraftFetching) ||
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
      draft: requestData.draft.count,
      published: requestData.published.count,
      active: requestData.active.count,
      inactive: requestData.inactive.count,
      total: requestData.draft.count + requestData.published.count + requestData.active.count + requestData.inactive.count
    };
  };

  const stats = getTabStats();

  return (
    <div className="min-h-screen  py-4 " key={refreshKey}>
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <FiShoppingBag className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Product Requests
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Manage product status and visibility
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
                  <div className="text-2xl font-bold text-yellow-700">{stats.draft}</div>
                  <div className="text-sm text-yellow-600">Draft</div>
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
                  { id: "draft", label: "Draft", icon: FiClock, color: "yellow", count: stats.draft },
                  { id: "published", label: "Published", icon: FiCheckCircle, color: "blue", count: stats.published },
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
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                            Brand & Category
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                            Pricing
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200/50">
                        {requestData[activeTab]?.data?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <div className="text-center">
                                <div className="mx-auto h-20 w-20 text-gray-400 mb-4">
                                  {activeTab === "draft" ? (
                                    <FiClock className="w-full h-full" />
                                  ) : activeTab === "published" ? (
                                    <FiCheckCircle className="w-full h-full" />
                                  ) : activeTab === "active" ? (
                                    <FiEye className="w-full h-full" />
                                  ) : (
                                    <FiEyeOff className="w-full h-full" />
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {activeTab === "draft" 
                                    ? "No draft products" 
                                    : activeTab === "published" 
                                      ? "No published products" 
                                      : activeTab === "active" 
                                        ? "No active products" 
                                        : "No inactive products"}
                                </h3>
                                <p className="text-gray-600">
                                  {activeTab === "draft" 
                                    ? "Draft products will appear here" 
                                    : activeTab === "published" 
                                      ? "Published products will appear here" 
                                      : activeTab === "active" 
                                        ? "Active products will appear here" 
                                        : "Inactive products will appear here"}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          requestData[activeTab].data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                              <td className="px-4 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                                    <FiPackage className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                                      {item.name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">
                                      {item.sku || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 md:hidden">
                                      <span className="text-xs text-gray-600">{item.brand || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4 hidden lg:table-cell">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <FiTag className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm text-gray-900">{item.brand || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FiLayers className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm text-gray-600">{item.category || 'N/A'}</span>
                                  </div>
                                  {item.subcategory && (
                                    <div className="text-xs text-gray-500 ml-5">
                                      {item.subcategory}
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              <td className="px-4 py-4 hidden md:table-cell">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FiDollarSign className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-900">₹{item.baseprice}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1">
                                      <FiPercent className="w-3 h-3 text-green-500" />
                                      <span className="text-green-600">{item.discount}% off</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-blue-600">{item.gst}% GST</span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-bold text-primary">
                                    ₹{item.actual_price}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4">
                                <div className="text-sm text-gray-900">
                                  {formatDate(item.date)}
                                </div>
                                <div className="text-xs text-gray-500 md:hidden">
                                  ₹{item.actual_price}
                                </div>
                              </td>
                              
                              <td className="px-4 py-4">
                                <div className="flex flex-col items-end gap-2">
                                  <button
                                    onClick={() => handleViewProduct(item.id)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-all duration-300 cursor-pointer text-sm"
                                  >
                                    <FiEye className="w-4 h-4" />
                                    <span className="hidden sm:inline">View</span>
                                  </button>

                                  {activeTab === "active" && (
                                    <button
                                      onClick={() => handleStatusUpdate(item.id, 'inactive')}
                                      disabled={loadingStates[item.id]}
                                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                    >
                                      {loadingStates[item.id] ? (
                                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <FiEyeOff className="w-4 h-4" />
                                      )}
                                      <span className="hidden sm:inline">
                                        {loadingStates[item.id] ? 'Updating...' : 'Inactive'}
                                      </span>
                                    </button>
                                  )}

                                  {activeTab === "inactive" && (
                                    <button
                                      onClick={() => handleStatusUpdate(item.id, 'active')}
                                      disabled={loadingStates[item.id]}
                                      className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                    >
                                      {loadingStates[item.id] ? (
                                        <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <FiEye className="w-4 h-4" />
                                      )}
                                      <span className="hidden sm:inline">
                                        {loadingStates[item.id] ? 'Updating...' : 'Active'}
                                      </span>
                                    </button>
                                  )}

                                  {activeTab === "draft" && role === "admin" && (
                                    <button
                                      onClick={() => handleStatusUpdate(item.id, 'published')}
                                      disabled={loadingStates[item.id]}
                                      className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                    >
                                      {loadingStates[item.id] ? (
                                        <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <FiCheckCircle className="w-4 h-4" />
                                      )}
                                      <span className="hidden sm:inline">
                                        {loadingStates[item.id] ? 'Publishing...' : 'Publish'}
                                      </span>
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
                  {requestData[activeTab]?.count > 0 && (
                    <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200/50 bg-gray-50/50">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-semibold">
                          {Math.min(currentPage * pageSize, requestData[activeTab].count)}
                        </span>{' '}
                        of <span className="font-semibold">{requestData[activeTab].count}</span> products
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
                          disabled={currentPage * pageSize >= requestData[activeTab].count}
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
                    onClick={() => navigate("/vendor/products")}
                    className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-700 font-semibold hover:bg-blue-100 transition-all duration-300 cursor-pointer"
                  >
                    <FiShoppingBag className="w-5 h-5" />
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
                    <span className="text-sm text-gray-700">Draft - Under review</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Published - Approved</span>
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

              {/* Price Summary */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span className="font-semibold">As listed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-semibold text-green-600">Applied</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span className="font-semibold text-blue-600">Included</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Final Price:</span>
                      <span>Shown</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestedProductsPage;