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
  FiMapPin,
  FiClipboard,
  FiInfo,
  FiCheckCircle
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
  const [modalType, setModalType] = useState(null); // 'address', 'received', 'bill', 'details', 'confirm-received'
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
        productId: item.product?.id || "N/A",
        productName: item.product?.name || "N/A",
        size: item.variant?.name || "N/A",
        quantity: item.quantity,
        price: item.unit_price,
        discount: item.discount_amount || 0,
        gstAmount: item.gst_amount,
        total: item.total
      })),
      totalAmount: order.total_price,
      subtotal: order.subtotal,
      gstAmount: order.gst_amount,
      discountAmount: order.discount_amount,
      status: order.status,
      statusDisplay: order.status_display,
      paymentStatus: order.payment_status,
      paymentStatusDisplay: order.payment_status_display,
      description: order.description,
      courier_name: order.courier_name,
      tracking_number: order.tracking_number,
      transport_charges: order.transport_charges,
      expected_delivery_date: order.expected_delivery_date,
      receipt: order.receipt,
      note: order.note
    }));
  };

  const orderData = {
    count: ordersData?.count || 0,
    results: transformOrderData(ordersData?.results) || []
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    // Add to processing orders to disable button
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
      // Remove from processing orders
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

  const getStatusActions = (status, order) => {
    const isProcessing = processingOrders.has(order.id);
    
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel Order"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FiX className="h-4 w-4" />
              )}
              <span>{isProcessing ? 'Processing...' : 'Cancel'}</span>
            </button>
          </div>
        );
      case 'accepted':
        return (
          <div className="flex items-center space-x-2">
             <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="View Details"
              disabled={isProcessing}
            >
              <FiInfo className="h-4 w-4" />
              <span>Details</span>
            </button>
          </div>
        );
      case 'dispatched':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="View Details"
              disabled={isProcessing}
            >
              <FiInfo className="h-4 w-4" />
              <span>Details</span>
            </button>
            <button
              onClick={() => openModal(order, 'confirm-received')}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark as Received"
              disabled={isProcessing}
            >
              <FiCheckCircle className="h-4 w-4" />
              <span>Received</span>
            </button>
          </div>
        );
      case 'received':
        return (
         <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border hover:bg-blue-50 hover:text-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="View Order Details"
              disabled={isProcessing}
            >
              <FiFileText className="h-5 w-5" />
            </button>
        );
      case 'rejected':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => openModal(order, 'details')}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border border-gray-600 text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Order Details"
              disabled={isProcessing}
            >
              <FiInfo className="h-4 w-4" />
              <span>Details</span>
            </button>
          </div>
        );
      case 'cancelled':
        return (
          <span className="text-gray-400">No actions</span>
        );
      default:
        return null;
    }
  };

  // Function to determine if we should show the action column
  const shouldShowActionColumn = () => {
    return ['pending', 'accepted', 'dispatched', 'received', 'rejected', 'cancelled'].includes(activeTab);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage orders across all statuses
          </p>
        </div>

        {/* Status Tabs and Refresh Button */}
        <div className="mb-4 px-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">Select a tab</label>
              <select
                id="tabs"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
                disabled={tabChanging}
              >
                <option value="pending">Pending Orders</option>
                <option value="accepted">Accepted Orders</option>
                <option value="dispatched">Dispatched Orders</option>
                <option value="received">Received Orders</option>
                <option value="rejected">Rejected Orders</option>
                <option value="cancelled">Cancelled Orders</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-2 md:space-x-4 overflow-x-auto">
                  {[
                    { id: 'pending', label: 'Pending', color: 'blue' },
                    { id: 'accepted', label: 'Accepted', color: 'green' },
                    { id: 'dispatched', label: 'Dispatched', color: 'yellow' },
                    { id: 'received', label: 'Received', color: 'purple' },
                    { id: 'rejected', label: 'Rejected', color: 'red' },
                    { id: 'cancelled', label: 'Cancelled', color: 'red' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`whitespace-nowrap py-3 px-2 border-b-2 cursor-pointer font-bold text-xs sm:text-sm flex items-center ${
                        activeTab === tab.id 
                          ? `border-${tab.color}-500 text-${tab.color}-600` 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      disabled={tabChanging}
                    >
                      {tabChanging && activeTab === tab.id && (
                        <span className="loading loading-spinner loading-xs mr-1"></span>
                      )}
                      {tab.label} ({activeTab === tab.id ? orderData.count : 0})
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isFetching || isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-bold cursor-pointer text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FiRotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Loading states */}
        {(isLoading || tabChanging) && (
          <div className="flex justify-center py-8">
            <FiRotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Orders Table */}
        {!isLoading && !tabChanging && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden relative">
            {/* Loading overlay for tab changes */}
            {tabChanging && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Vendor ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    {shouldShowActionColumn() && (
                      <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.results?.length === 0 ? (
                    <tr>
                      <td colSpan={shouldShowActionColumn() ? 13 : 12} className="px-4 py-6 whitespace-nowrap text-center">
                        <div className="text-center py-8">
                          <div className="mx-auto h-20 w-20 text-gray-400 mb-3">
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
                          <h3 className="text-md font-semibold text-gray-700">
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
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orderData.results.map((order) => (
                      order.items.map((item, index) => (
                        <tr key={`${order.id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <FiUser className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900">{order.seller.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.seller.roleId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.productId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.size}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatCurrency(item.gstAmount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatCurrency(item.discount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          {shouldShowActionColumn() && (
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {getStatusActions(order.status, order)}
                            </td>
                          )}
                        </tr>
                      ))
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {orderData.count > 0 && (
              <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
                  Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * pageSize, orderData.count)}
                  </span>{' '}
                  of <span className="font-semibold">{orderData.count}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || tabChanging}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * pageSize >= orderData.count || tabChanging}
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

      {/* Modals */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <span className="loading loading-spinner loading-lg"></span>
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