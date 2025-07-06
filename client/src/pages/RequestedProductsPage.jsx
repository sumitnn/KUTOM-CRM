import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiEyeOff,
  FiRotateCw,
  FiRefreshCw
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
  const [refreshKey, setRefreshKey] = useState(0); // For refresh functionality

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
  });

  const [updateStatus] = useUpdateProductStatusMutation();

  // Helper function to transform product data
  const transformProductData = (products) => {
    return products?.map((product) => ({
      id: product.id,
      date: product.created_at,
      name: product.name,
      sku: product.sku,
      brand: product.brand_name,
      category: product.category_name,
      subcategory: product.subcategory_name,
      quantity: product.sizes?.reduce((sum, size) => sum + (size.quantity || 0), 0) || 0,
      rate: parseFloat(
        product.sizes?.find((size) => size.is_default)?.price ||
        product.sizes?.[0]?.price ||
        0
      ) || 0,
      price: parseFloat(
        product.sizes?.reduce(
          (sum, size) => sum + ((size.quantity || 0) * parseFloat(size.price || 0)),
          0
        )
      ) || 0,
      demandDate: product.updated_at,
      status: product.status,
      isFeatured: product.is_featured,
    }));
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
    setRefreshKey(prev => prev + 1);
    switch(activeTab) {
      case "draft":
        refetchDraft();
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
        if (!productId || !newStatus) {
            console.error("Product ID and status are required");
            return;
      }
      console.log(newStatus)

        await updateStatus({
            id: productId,
            status: newStatus,  
        }).unwrap();

        // Optional: Show success message
        toast.success(`Product marked as ${newStatus}`);
        
        handleRefresh(); 
    } catch (error) {
        console.error("Failed to update status:", error);
        toast.error("Failed to update product status");
    }
};

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewProduct = (productId) => {
    navigate(`/vendor/products/${productId}`);
  };

  const isLoading = isDraftLoading || isPublishedLoading || isActiveLoading || isInactiveLoading;
  const isFetching = isDraftFetching || isPublishedFetching || isActiveFetching || isInactiveFetching;

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto" key={refreshKey}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Requests</h1>
          <p className="text-sm text-gray-500 font-bold">
            Manage product status and visibility
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <FiRefreshCw className={`mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 text-black font-bold p-1 rounded-lg mb-6 overflow-x-auto">
        <button
          className={`tab ${activeTab === "draft" ? "tab-active bg-white font-bold shadow-sm" : ""}`}
          onClick={() => {
            setActiveTab("draft");
            setCurrentPage(1);
          }}
        >
          <FiClock className="mr-2" />
          Draft ({requestData.draft.count || 0})
        </button>
        <button
          className={`tab ${activeTab === "published" ? "tab-active bg-white font-bold shadow-sm" : ""}`}
          onClick={() => {
            setActiveTab("published");
            setCurrentPage(1);
          }}
        >
          <FiCheckCircle className="mr-2" />
          Published ({requestData.published.count || 0})
        </button>
        <button
          className={`tab ${activeTab === "active" ? "tab-active bg-white font-bold shadow-sm" : ""}`}
          onClick={() => {
            setActiveTab("active");
            setCurrentPage(1);
          }}
        >
          <FiEye className="mr-2" />
          Active ({requestData.active.count || 0})
        </button>
        <button
          className={`tab ${activeTab === "inactive" ? "tab-active bg-white font-bold shadow-sm" : ""}`}
          onClick={() => {
            setActiveTab("inactive");
            setCurrentPage(1);
          }}
        >
          <FiEyeOff className="mr-2" />
          Inactive ({requestData.inactive.count || 0})
        </button>
      </div>

      {/* Loading states */}
      {(isLoading || isFetching) && (
        <div className="flex justify-center py-8">
          <FiRotateCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Table */}
      {!isLoading && !isFetching && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-100 font-bold text-black">
                <tr>
                  <th className="w-12">Sr No.</th>
                  <th>Created Date</th>
                  <th>Product Name</th>
                  <th className="hidden md:table-cell">Product (SKU)</th>
                  <th className="hidden md:table-cell">Brand</th>
                  <th className="hidden lg:table-cell">Category</th>
                  <th className="hidden lg:table-cell">Subcategory</th>
                  <th>Qty</th>
                  <th className="hidden sm:table-cell">Rate</th>
                  <th className="hidden sm:table-cell">Price</th>
                  <th className="hidden md:table-cell">Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {requestData[activeTab]?.data?.length > 0 ? (
                  requestData[activeTab].data.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="font-bold">{item.name}</td>
                      <td className="font-bold hidden md:table-cell">{item.sku}</td>
                      <td className="hidden md:table-cell">{item.brand}</td>
                      <td className="hidden lg:table-cell">{item.category}</td>
                      <td className="hidden lg:table-cell">{item.subcategory}</td>
                      <td>{item.quantity.toLocaleString()}</td>
                      <td className="hidden sm:table-cell">₹{item.rate.toFixed(2)}</td>
                      <td className="hidden sm:table-cell">₹{item.price.toFixed(2)}</td>
                      <td className="hidden md:table-cell">
                        {new Date(item.demandDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleViewProduct(item.id)}
                            title="View Product"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {activeTab === "active" && (
                            <button
                              className="btn btn-outline btn-error btn-sm"
                              onClick={() => handleStatusUpdate(item.id, 'inactive')}
                            >
                              Mark Inactive
                            </button>
                          )}
                          {activeTab === "inactive" && (
                            <button
                              className="btn btn-outline btn-success btn-sm"
                              onClick={() => handleStatusUpdate(item.id, 'active')}
                            >
                              Mark Active
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {activeTab === "draft" ? (
                          <>
                            <FiClock className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">
                              No draft products
                            </h3>
                            <p className="text-gray-500">
                              Draft products will appear here
                            </p>
                          </>
                        ) : activeTab === "published" ? (
                          <>
                            <FiCheckCircle className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">
                              No published products
                            </h3>
                            <p className="text-gray-500">
                              Published products will appear here
                            </p>
                          </>
                        ) : activeTab === "active" ? (
                          <>
                            <FiEye className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">
                              No active products
                            </h3>
                            <p className="text-gray-500">
                              Active products will appear here
                            </p>
                          </>
                        ) : (
                          <>
                            <FiEyeOff className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">
                              No inactive products
                            </h3>
                            <p className="text-gray-500">
                              Inactive products will appear here
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {requestData[activeTab]?.count > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
              <div className="text-sm text-gray-500 font-bold">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, requestData[activeTab].count)}
                </span>{" "}
                of <span className="font-medium">{requestData[activeTab].count}</span>{" "}
                entries
              </div>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  «
                </button>
                {Array.from(
                  { length: Math.ceil(requestData[activeTab].count / pageSize) },
                  (_, i) => (
                    <button
                      key={i + 1}
                      className={`join-item btn btn-sm ${
                        currentPage === i + 1 ? "btn-active" : ""
                      }`}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  )
                ).slice(0, 5)}
                <button
                  className="join-item btn btn-sm"
                  disabled={
                    currentPage ===
                    Math.ceil(requestData[activeTab].count / pageSize)
                  }
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestedProductsPage;