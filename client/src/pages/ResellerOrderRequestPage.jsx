// OrderRequestPage.jsx
import { useState, useEffect, lazy, Suspense } from "react";
import { 
  FiClock, 
  FiCheckCircle, 
  FiX, 
  FiRefreshCw, 
  FiSearch,
  FiEye,
  FiFilter,
  FiUser,
  FiMail,
  FiPhone,
  FiTag,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiPercent
} from "react-icons/fi";
import { useGetResellerOrderRequestsByStatusQuery } from "../features/order/orderRequest";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const ResellerOrderRequestPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [searchEmail, setSearchEmail] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;
  const navigate = useNavigate();

  const { 
    data: response = {}, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetResellerOrderRequestsByStatusQuery({
    status: activeTab,
    page,
    page_size: pageSize,
    ...(searchEmail && { user_email: searchEmail })
  });

  // Handle API response structure
  const orderRequests = Array.isArray(response) ? response : response.results || response.data || [];
  const totalCount = Array.isArray(response) ? response.length : response.count || response.total || 0;

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchEmail]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Order requests refreshed!");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "badge-warning", icon: FiClock, text: "Pending" },
      approved: { color: "badge-success", icon: FiCheckCircle, text: "Approved" },
      rejected: { color: "badge-error", icon: FiX, text: "Rejected" },
      cancelled: { color: "badge-neutral", icon: FiX, text: "Cancelled" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`badge gap-1 ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const renderResellerDetails = (requestedBy) => {
    if (!requestedBy) return "-";
    
    return (
      <div className="space-y-2 min-w-[200px]">
        <div className="flex items-center gap-2">
          <FiUser className="w-3 h-3 text-gray-500" />
          <span className="font-medium">{requestedBy.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiMail className="w-3 h-3 text-gray-500" />
          <span className="text-sm">{requestedBy.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiPhone className="w-3 h-3 text-gray-500" />
          <span className="text-sm">{requestedBy.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiTag className="w-3 h-3 text-gray-500" />
          <span className="text-sm badge badge-outline">{requestedBy.role_based_id}</span>
        </div>
      </div>
    );
  };

  const renderProductDetails = (items) => {
    if (!items || items.length === 0) return "-";
    
    const item = items[0]; // Assuming single item for simplicity
    
    return (
      <div className="space-y-2 min-w-[180px]">
        <div className="flex items-center gap-2">
          <FiPackage className="w-3 h-3 text-gray-500" />
          <span className="font-medium">{item.product_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiTag className="w-3 h-3 text-gray-500" />
          <span className="text-sm">{item.product_sku}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge badge-xs ${item.product_type === 'physical' ? 'badge-info' : 'badge-secondary'}`}>
            {item.product_type}
          </span>
        </div>
      </div>
    );
  };

  const renderOrderDetails = (items, totalAmount) => {
    if (!items || items.length === 0) return "-";
    
    const item = items[0]; // Assuming single item for simplicity
    
    return (
      <div className="space-y-2 min-w-[150px]">
        
        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
          
          <span className="font-bold text-primary">₹{totalAmount}</span>
        </div>
      </div>
    );
  };

  const renderTableHeaders = () => {
    return (
      <tr className="font-bold text-black bg-gray-50">
        <th className="w-12">No.</th>
        <th>Request Date</th>
        <th>Request ID</th>
        <th>Reseller Details</th>
        <th>Product Details</th>
        <th>Total Amount</th>
        <th>Status</th>
        <th className="text-center">Actions</th>
      </tr>
    );
  };

  const handleViewDetails = (requestId) => {
    const path = role === "reseller" ? `/reseller/my-order-request/${requestId}` : `/reseller/order-request/${requestId}`;
    
    navigate(path);
  
  };

  const renderTableRow = (item, index) => {
    return (
      <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
        <td className="font-bold py-4">{(page - 1) * pageSize + index + 1}</td>
        <td className="py-4">
          <div className="flex flex-col">
            <span className="font-medium">
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </td>
        <td className="font-extrabold text-sm py-4">{item.request_id}</td>
        <td className="py-4">{renderResellerDetails(item.requested_by)}</td>
        <td className="py-4">{renderProductDetails(item.items)}</td>
        <td className="py-4">{renderOrderDetails(item.items, item.total_amount)}</td>
        <td className="py-4 font-bold">{getStatusBadge(item.status)}</td>
        <td className="text-center py-4">
          <button 
            onClick={() => handleViewDetails(item.id)}
            className="btn btn-ghost btn-xs font-bold tooltip text-info hover:scale-110 transition-transform"
            data-tip="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  const renderTableContent = () => {
    if (isLoading) return (
      <tr>
        <td colSpan={8} className="text-center py-12">
          <Suspense fallback={<div>Loading...</div>}>
            <Spinner />
          </Suspense>
        </td>
      </tr>
    );

    if (isError) return (
      <tr>
        <td colSpan={8} className="text-center py-12">
          <Suspense fallback={<div>Error loading...</div>}>
            <ErrorMessage message={error?.data?.message || "Failed to load order requests"} />
          </Suspense>
        </td>
      </tr>
    );

    if (!orderRequests || orderRequests.length === 0) return (
      <tr>
        <td colSpan={8} className="text-center py-12">
          <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
            <FiShoppingCart className="w-16 h-16 text-gray-300" />
            <h3 className="text-lg font-medium">
              {activeTab === "pending" ? "No pending requests" : 
               activeTab === "approved" ? "No approved requests" : 
               "No cancelled/rejected requests"}
            </h3>
            <p className="text-sm max-w-md text-center">
              {activeTab === "pending" ? "Pending order requests will appear here for review" : 
               activeTab === "approved" ? "Approved order requests will appear here" : 
               "Cancelled or rejected requests will appear here"}
            </p>
          </div>
        </td>
      </tr>
    );

    return orderRequests.map((item, index) => renderTableRow(item, index));
  };

  return (
    <div className="py-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order Requests Management</h1>
          <p className="text-sm text-gray-500">
            {role === 'stockist' ? 'Manage all order requests' : 'View your order requests'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn gap-2 ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          >
            <FiFilter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={handleRefresh}
            className="btn btn-primary gap-2"
            disabled={isLoading}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> 
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-fade-in">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="label">
                <span className="label-text font-medium">Search by Reseller Email</span>
              </label>
              <div className="join w-full">
                <input
                  type="email"
                  placeholder="Enter reseller email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="join-item input input-bordered w-full"
                />
                <button type="submit" className="join-item btn btn-primary">
                  <FiSearch className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={`tab flex-1 font-medium ${activeTab === "pending" ? "tab-active bg-white shadow-sm text-primary" : ""}`}
          onClick={() => handleTabChange("pending")}
        >
          <FiClock className="mr-2" />
          Pending Requests
        </button>
        <button
          className={`tab flex-1 font-medium ${activeTab === "approved" ? "tab-active bg-white shadow-sm text-success" : ""}`}
          onClick={() => handleTabChange("approved")}
        >
          <FiCheckCircle className="mr-2" />
          Approved Requests
        </button>
        <button
          className={`tab flex-1 font-medium ${activeTab === "rejected" ? "tab-active bg-white shadow-sm text-error" : ""}`}
          onClick={() => handleTabChange("rejected")}
        >
          <FiX className="mr-2" />
          Cancelled/Rejected
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
            <div className="text-sm text-gray-500 font-bold">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
              <span className="font-medium">{totalCount}</span> entries
            </div>
            <div className="join">
              <button 
                className="join-item btn btn-sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                «
              </button>
              <button className="join-item btn btn-sm btn-active">{page}</button>
              <button 
                className="join-item btn btn-sm" 
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResellerOrderRequestPage;