import { lazy, Suspense, useState } from "react";
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

const ProductFormModal = lazy(() => import("./ProductFormModal"));

const AdminProductApprovalPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

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
  });

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
  });

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
  });

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
  });

  const [updateStatus] = useUpdateProductStatusMutation();

  // Helper function to transform product data
  const transformProductData = (products) => {
    return products?.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      vendorId: product.vendor?.id || "N/A",
      brand: product.brand_name,
      category: product.category_name,
      subcategory: product.subcategory_name,
      type: product.product_type,
      status: product.status,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      isFeatured: product.is_featured,
      productType: product.product_type,
      images: product.images,
      features: product.features,
      description: product.description
    }));
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
      toast.success(`Product status updated to ${newStatus}`);
      handleRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update product status");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
  };

  const closeModal = () => {
    setEditingProduct(null);
  };

  const saveEditedProduct = () => {
    toast.success("Product updated successfully");
    handleRefresh();
    closeModal();
  };

  const viewProductDetails = (productId) => {
    navigate(`/admin/products/${productId}`);
  };

  const isLoading = isPendingLoading || isPublishedLoading || isActiveLoading || isInactiveLoading;
  const isFetching = isPendingFetching || isPublishedFetching || isActiveFetching || isInactiveFetching;

  const formatDate = (dateString) => {
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
        <div className="mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Approval</h1>
          <p className="mt-1 text-sm font-bold text-gray-600">
            Review and manage products submitted by vendors
          </p>
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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Vendor ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Subcategory
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    {activeTab !== 'active' && activeTab !== 'inactive' && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.vendorId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.brand}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {product.subcategory}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {product.name}
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {product.productType}
                        </td>
                        {activeTab !== 'active' && activeTab !== 'inactive' && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(product.updatedAt)}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => viewProductDetails(product.id)}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer"
                              title="View Details"
                            >
                              <FiExternalLink className="h-5 w-5" />
                            </button>
                            
                            {activeTab === 'pending' && (
                              <>
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                  title="Edit"
                                >
                                  <FiEdit2 className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(product.id, 'published')}
                                  className="text-green-600 hover:text-green-900 cursor-pointer"
                                  title="Publish"
                                >
                                  <FiUpload className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            
                            {activeTab === 'published' && (
                              <button
                                onClick={() => handleStatusUpdate(product.id, 'draft')}
                                className="text-yellow-600 hover:text-yellow-900 cursor-pointer"
                                title="Unpublish"
                              >
                                <FiDownload className="h-5 w-5" />
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50  flex items-center justify-center">
          <FiRotateCw className="w-8 h-8 text-white animate-spin" />
        </div>}>
          <ProductFormModal
            product={editingProduct}
            onClose={closeModal}
            onSave={saveEditedProduct}
            mode="admin-edit"
          />
        </Suspense>
      )}
    </div>
  );
};

export default AdminProductApprovalPage;