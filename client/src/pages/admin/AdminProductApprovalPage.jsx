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
  FiExternalLink
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

  // API calls with pagination and search - now using lazy queries
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
        description: product.description
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
    switch(activeTab) {
      case "pending":
        refetchPending();
        break;
      case "published":
        refetchPublished();
        break;
      case "active":
        refetchActive();
        break;
      case "inactive":
        refetchInactive();
        break;
    }
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      await updateStatus({
        id: productId,
        status: newStatus,  
      }).unwrap();
      toast.success(`Product status changed to ${newStatus}`);
      handleRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update product status");
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

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-2 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Products Request Management</h1>
            <p className="mt-1 text-sm font-bold text-gray-600">
              Review and manage products submitted by vendors
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Refresh data"
          >
            <FiRotateCw className="mr-2" /> Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div className="mb-4 px-2">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">Select a tab</label>
            <select
              id="tabs"
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="pending">Pending Approval</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 md:space-x-8">
                <button
                  onClick={() => {
                    setActiveTab('pending');
                    setCurrentPage(1);
                  }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold cursor-pointer text-sm ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <FiClock className="inline mr-1 md:mr-2" />
                  Pending ({productData.pending.count || 0})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('published');
                    setCurrentPage(1);
                  }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold cursor-pointer text-sm ${activeTab === 'published' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <FiUpload className="inline mr-1 md:mr-2" />
                  Published ({productData.published.count || 0})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('active');
                    setCurrentPage(1);
                  }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold cursor-pointer text-sm ${activeTab === 'active' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <FiEye className="inline mr-1 md:mr-2" />
                  Active ({productData.active.count || 0})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('inactive');
                    setCurrentPage(1);
                  }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold cursor-pointer text-sm ${activeTab === 'inactive' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <FiEyeOff className="inline mr-1 md:mr-2" />
                  Inactive ({productData.inactive.count || 0})
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 px-2">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search products by name, SKU or vendor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Loading states */}
        {(isLoading || isFetching) && (
          <div className="flex justify-center py-8">
            <FiRotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Products Table */}
        {!isLoading && !isFetching && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 ">
                  <tr className="font-bold">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Subcategory
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    {activeTab !== 'active' && activeTab !== 'inactive' && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productData[activeTab]?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'active' || activeTab === 'inactive' ? 9 : 10} className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-center py-8">
                          <div className="mx-auto h-20 w-20 text-gray-400 mb-3">
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
                          <h3 className="text-md font-semibold text-gray-700">
                            {activeTab === "pending" 
                              ? "No pending products" 
                              : activeTab === "published" 
                                ? "No published products" 
                                : activeTab === "active" 
                                  ? "No active products" 
                                  : "No inactive products"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm 
                              ? 'Try adjusting your search' 
                              : `No ${activeTab} products found`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    productData[activeTab].data.map((product, index) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(product.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-600">
                          {product.vendorName}
                          <div className="text-xs text-gray-500">{product.vendorId}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.brand || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.category || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.subcategory || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {product.name}
                          <div className="text-xs text-gray-500 font-bold">{product.sku}</div>
                          <div className="text-xs text-gray-500">
                            Status: {product.statusDisplay || product.status}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {product.productTypeDisplay || product.productType}
                        </td>
                        {activeTab !== 'active' && activeTab !== 'inactive' && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(product.updatedAt)}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium align-top">
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => viewProductDetails(product.id)}
                              className="w-36 h-10 btn btn-outline-warning text-blue-600 hover:text-blue-900"
                              title="View Product Details"
                            >
                              View Product
                            </button>

                            {activeTab === 'pending' && (
                              <>
                                <button
                                  onClick={() => editProduct(product.id)}
                                  className="w-36 h-10 btn text-indigo-600 hover:text-indigo-900"
                                  title="Edit Product Details"
                                >
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(product.id, 'published')}
                                  className="w-36 h-10 btn btn-outline-success text-green-600 hover:text-green-900"
                                  title="Publish Product"
                                >
                                  Publish
                                </button>
                              </>
                            )}

                            {activeTab === 'published' && (
                              <button
                                onClick={() => handleStatusUpdate(product.id, 'draft')}
                                className="w-36 h-10 flex items-center justify-center rounded border border-red-600 text-red-600 hover:text-red-900 hover:border-red-900"
                                title="Unpublish"
                              >
                                Unpublish
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
              <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
                  Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * pageSize, productData[activeTab].count)}
                  </span>{' '}
                  of <span className="font-semibold">{productData[activeTab].count}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * pageSize >= productData[activeTab].count}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductApprovalPage;