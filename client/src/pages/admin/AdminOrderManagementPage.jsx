import { lazy, Suspense, useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  FiCheck,
  FiX,
  FiTruck,
  FiPackage,
  FiFileText,
  FiRotateCw,
  FiUser,
  FiShoppingCart,
  FiClipboard,
  FiInfo,
  FiCheckCircle,
  FiBox,
  FiTag,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiChevronRight,
  FiChevronLeft
} from "react-icons/fi";
import {
  useGetMyOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../features/order/orderApi";

// Modals (lazy loaded)
const AddressModal = lazy(() => import("../../components/modals/AddressModal"));
const ReceivedProductModal = lazy(() => import("../../components/modals/ReceivedProductModal"));
const OrderBillModal = lazy(() => import("../../components/modals/OrderBillModal"));
const OrderDetailsModal = lazy(() => import("../OrderDetailsModal"));
const ConfirmationModal = lazy(() => import("../../components/modals/ConfirmationModal"));

const AdminOrderManagementPage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tabChanging, setTabChanging] = useState(false);
  const [processingOrders, setProcessingOrders] = useState(new Set());

  // API call for orders
  const {
    data: ordersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyOrdersQuery({
    status: activeTab,
    page: currentPage,
    pageSize,
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Handle tab changes with loading state
  useEffect(() => {
    if (tabChanging) {
      const timer = setTimeout(() => {
        setTabChanging(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ordersData, tabChanging]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Orders refreshed");
    } catch (error) {
      toast.error("Failed to refresh orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (tabId) => {
    setTabChanging(true);
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  // Helper function to transform order data
  const transformOrderData = (orders) => {
    return orders?.map((order) => ({
      id: order.id,
      date: order.created_at,
      buyer: {
        id: order.buyer?.id || "N/A",
        name: order.buyer?.username || "N/A",
        email: order.buyer?.email || "N/A",
        address: order.buyer?.address || {},
        phone: order.buyer?.phone || "N/A",
        whatsapp: order.buyer?.whatsapp_number || "N/A"
      },
      seller: {
        id: order.seller?.id || "N/A",
        name: order.seller?.username || "N/A",
        email: order.seller?.email || "N/A",
        roleId: order.seller?.role_based_id || "N/A",
        phone: order.seller?.phone || "N/A"
      },
      items: order.items.map(item => ({
        id: item.id,
        productId: item.product?.id,
        productName: item.product?.name,
        size: item.variant?.name,
        sku: item.variant?.sku,
        quantity: item.quantity,
        price: item.unit_price,
        discount: item.discount || "0",
        gst_percentage: item.gst_percentage,
        total: item.final_price,
        batch_number: item.batch_number,
        manufacture_date: item.manufacture_date,
        expiry_date: item.expiry_date,
        bulk_price_applied: item.bulk_price_applied,
        discount_percentage: item.discount_percentage,
        single_quantity_after_gst_and_discount_price: item.single_quantity_after_gst_and_discount_price
      })),
      totalAmount: order.total_price,
      subtotal: order.subtotal || order.total_price,
      gstAmount: order.gst_amount || "0.00",
      discountAmount: order.discount_amount || "0.00",
      status: order.status,
      statusDisplay: order.status_display,
      paymentStatus: order.payment_status,
      paymentStatusDisplay: order.payment_status_display,
      description: order.description || "Order placed",
      courier_name: order.courier_name,
      tracking_number: order.tracking_number,
      transport_charges: order.transport_charges || "0.00",
      expected_delivery_date: order.expected_delivery_date,
      receipt: order.receipt,
      note: order.note || ""
    }));
  };

  const orderData = {
    count: ordersData?.count || 0,
    results: transformOrderData(ordersData?.results) || []
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setProcessingOrders(prev => new Set(prev).add(orderId));
    
    try {
      await updateOrderStatus({
        orderId: orderId,
        status: newStatus,  
      }).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
      handleRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const openModal = (order, type) => {
    setSelectedOrder(order);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };

  const confirmOrderReceived = () => {
    if (selectedOrder) {
      handleStatusUpdate(selectedOrder.id, 'received');
      closeModal();
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
      accepted: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FiCheck },
      dispatched: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: FiTruck },
      received: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiPackage },
      rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: FiX },
      cancelled: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FiX }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.color}`}>
        <IconComponent className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusActions = (status, order) => {
    const isProcessing = processingOrders.has(order.id);
    
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
              className="inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-red-200 hover:shadow-sm"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FiX className="h-4 w-4" />
              )}
              <span>{isProcessing ? 'Processing...' : 'Cancel Order'}</span>
            </button>
          </div>
        );
      case 'accepted':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-blue-200 hover:shadow-sm"
              disabled={isProcessing}
            >
              <FiInfo className="h-4 w-4" />
              <span>View Details</span>
            </button>
          </div>
        );
      case 'dispatched':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-blue-200 hover:shadow-sm"
              disabled={isProcessing}
            >
              <FiInfo className="h-4 w-4" />
              <span>View Details</span>
            </button>
            <button
              onClick={() => openModal(order, 'confirm-received')}
              className="inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-emerald-200 hover:shadow-sm"
              disabled={isProcessing}
            >
              <FiCheckCircle className="h-4 w-4" />
              <span>Mark as Received</span>
            </button>
          </div>
        );
      case 'received':
        return (
          <button
            onClick={() => openModal(order, 'details')}
            className="inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-200 hover:shadow-sm"
            disabled={isProcessing}
          >
            <FiFileText className="h-4 w-4" />
            <span>Order Details</span>
          </button>
        );
      case 'rejected':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-200 hover:shadow-sm"
              disabled={isProcessing}
            >
              <FiInfo className="h-4 w-4" />
              <span>View Details</span>
            </button>
          </div>
        );
      case 'cancelled':
        return (
          <span className="text-gray-400 text-sm font-medium px-4 py-2.5">No actions available</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen  py-4 ">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl text-sm sm:text-base">
                Manage and track orders across all statuses with real-time updates and streamlined workflows.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-sm text-gray-500 bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-xs">
                Total: <span className="font-semibold text-gray-900">{orderData.count} orders</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isFetching || isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-xs text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 disabled:opacity-50 hover:border-gray-400"
              >
                <FiRotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-8">
          <div className="sm:hidden">
            <select
              id="tabs"
              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              disabled={tabChanging}
            >
              <option value="pending">📋 Pending Orders</option>
              <option value="accepted">✅ Accepted Orders</option>
              <option value="dispatched">🚚 Dispatched Orders</option>
              <option value="received">📦 Received Orders</option>
              <option value="rejected">❌ Rejected Orders</option>
              <option value="cancelled">🚫 Cancelled Orders</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="bg-white rounded-xl p-1.5 shadow-xs border border-gray-200">
              <div className="flex space-x-1 overflow-x-auto">
                {[
                  { id: 'pending', label: 'Pending', icon: FiClock, count: orderData.count },
                  { id: 'accepted', label: 'Accepted', icon: FiCheck, count: 0 },
                  { id: 'dispatched', label: 'Dispatched', icon: FiTruck, count: 0 },
                  { id: 'received', label: 'Received', icon: FiPackage, count: 0 },
                  { id: 'rejected', label: 'Rejected', icon: FiX, count: 0 },
                  { id: 'cancelled', label: 'Cancelled', icon: FiX, count: 0 }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer font-semibold text-sm transition-all duration-200 min-w-0 flex-1 justify-center whitespace-nowrap ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } ${tabChanging && isActive ? 'opacity-70' : ''}`}
                      disabled={tabChanging && isActive}
                    >
                      {tabChanging && isActive ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{tab.label}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isActive ? orderData.count : 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Loading states */}
        {(isLoading || tabChanging) && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-xs border border-gray-200">
            <div className="loading loading-spinner loading-lg text-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && !tabChanging && (
          <div className="grid gap-4 sm:gap-6">
            {orderData.results?.length === 0 ? (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-8 sm:p-16 text-center">
                <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mb-4 sm:mb-6">
                  {activeTab === "pending" ? (
                    <FiShoppingCart className="w-full h-full" />
                  ) : activeTab === "accepted" ? (
                    <FiCheck className="w-full h-full" />
                  ) : activeTab === "dispatched" ? (
                    <FiTruck className="w-full h-full" />
                  ) : activeTab === "received" ? (
                    <FiPackage className="w-full h-full" />
                  ) : ["rejected", "cancelled"].includes(activeTab) ? (
                    <FiX className="w-full h-full" />
                  ) : (
                    <FiClipboard className="w-full h-full" />
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {activeTab === "pending" 
                    ? "No pending orders" 
                    : activeTab === "accepted" 
                      ? "No accepted orders" 
                      : activeTab === "dispatched" 
                        ? "No dispatched orders" 
                        : activeTab === "received"
                          ? "No received orders"
                          : activeTab === "rejected"
                            ? "No rejected orders"
                            : "No cancelled orders"}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm sm:text-base">
                  {activeTab === "pending" 
                    ? "New orders will appear here once they are placed by customers."
                    : "No orders found in this category."}
                </p>
              </div>
            ) : (
              orderData.results.map((order) => {
                const isProcessing = processingOrders.has(order.id);

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-sm transition-all duration-200 group">
                    {/* Order Header */}
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 mt-1">
                            <FiBox className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                              Order #{order.id}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <FiCalendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>{formatDate(order.date)}</span>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
                          <div className="text-right">
                            <div className="text-xs sm:text-sm text-gray-500">Total Amount</div>
                            <div className="text-lg sm:text-2xl font-bold text-gray-900">
                              {formatCurrency(parseFloat(order.totalAmount) + parseFloat(order.transport_charges))}
                            </div>
                            {order.transport_charges > 0 && (
                              <div className="text-xs text-red-600 mt-1 font-bold" >
                                +{formatCurrency(order.transport_charges)} shipping included
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Seller Information */}
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <FiUser className="h-4 w-4" />
                            Seller Information
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate">{order.seller.name}</div>
                              <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <FiMail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{order.seller.email}</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <FiPhone className="h-3 w-3 flex-shrink-0" />
                                <span>{order.seller.phone}</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <FiTag className="h-3 w-3 flex-shrink-0" />
                                <span>ID: {order.seller.roleId}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="lg:col-span-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2 mb-3 sm:mb-4">
                            <FiPackage className="h-4 w-4" />
                            Order Items ({order.items.length})
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 gap-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {item.productName}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                                    <span className="font-medium">SKU: {item.sku}</span>
                                    <span>Size: {item.size}</span>
                                    <span>Qty: {item.quantity}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                                    {formatCurrency(item.total)}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    {formatCurrency(item.single_quantity_after_gst_and_discount_price)} × {item.quantity}
                                  </div>
                                  {item.discount > 0 && (
                                    <div className="text-xs text-red-600">
                                      -{formatCurrency(item.discount)} discount
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FiPackage className="h-4 w-4" />
                            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                          </div>
                          {order.courier_name && (
                            <div className="flex items-center gap-2">
                              <FiTruck className="h-4 w-4" />
                              <span className="truncate">{order.courier_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getStatusActions(order.status, order)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {orderData.count > 0 && (
          <div className="mt-6 sm:mt-8">
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min(currentPage * pageSize, orderData.count)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-900">{orderData.count}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || tabChanging}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <div className="px-3 sm:px-4 py-2.5 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                    Page {currentPage}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * pageSize >= orderData.count || tabChanging}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 shadow-xl">
            <div className="loading loading-spinner loading-lg text-blue-500"></div>
          </div>
        </div>
      }>
        {modalType === 'address' && (
          <AddressModal 
            order={selectedOrder} 
            onClose={closeModal} 
            onSave={(address) => {
              toast.success("Address saved successfully");
              closeModal();
            }}
          />
        )}
        {modalType === 'received' && (
          <ReceivedProductModal 
            order={selectedOrder} 
            onClose={closeModal} 
            onConfirm={(receivedData) => {
              handleStatusUpdate(selectedOrder.id, 'received');
              closeModal();
            }}
          />
        )}
        {modalType === 'bill' && (
          <OrderBillModal 
            order={selectedOrder} 
            onClose={closeModal}
          />
        )}
        {modalType === 'details' && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={closeModal}
          />
        )}
        {modalType === 'confirm-received' && (
          <ConfirmationModal
            title="Confirm Order Received"
            message="Are you sure you want to mark this order as received?"
            onConfirm={confirmOrderReceived}
            onCancel={closeModal}
            confirmText="Yes, Mark as Received"
            cancelText="No, Cancel"
          />
        )}
      </Suspense>
    </div>
  );
};

export default AdminOrderManagementPage;