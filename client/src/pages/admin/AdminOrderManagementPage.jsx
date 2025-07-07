import { lazy, Suspense, useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiX,
  FiTruck,
  FiPackage,
  FiFileText,
  FiRotateCw,
  FiExternalLink,
  FiEdit2
} from "react-icons/fi";
import {
  useGetMyOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../features/order/orderApi";

const OrderEntryModal = lazy(() => import("./OrderEntryModal"));

const AdminOrderManagementPage = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // API calls with pagination - only called when tab is active
  const {
    data: newOrdersData,
    isLoading: isNewLoading,
    isFetching: isNewFetching,
    refetch: refetchNew,
  } = useGetMyOrdersQuery({
    status: "new",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== "new" });

  const {
    data: acceptedData,
    isLoading: isAcceptedLoading,
    isFetching: isAcceptedFetching,
    refetch: refetchAccepted,
  } = useGetMyOrdersQuery({
    status: "accepted",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== "accepted" });

  const {
    data: rejectedData,
    isLoading: isRejectedLoading,
    isFetching: isRejectedFetching,
    refetch: refetchRejected,
  } = useGetMyOrdersQuery({
    status: "rejected",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== "rejected" });

  const {
    data: cancelledData,
    isLoading: isCancelledLoading,
    isFetching: isCancelledFetching,
    refetch: refetchCancelled,
  } = useGetMyOrdersQuery({
    status: "cancelled",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== "cancelled" });

  const {
    data: dispatchedData,
    isLoading: isDispatchedLoading,
    isFetching: isDispatchedFetching,
    refetch: refetchDispatched,
  } = useGetMyOrdersQuery({
    status: "dispatched",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== "dispatched" });

  const {
    data: receivedData,
    isLoading: isReceivedLoading,
    isFetching: isReceivedFetching,
    refetch: refetchReceived,
  } = useGetMyOrdersQuery({
    status: "received",
    page: currentPage,
    pageSize,
  }, { skip: activeTab !== "received" });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Helper function to transform order data
  const transformOrderData = (orders) => {
    return orders?.map((order) => ({
      id: order.id,
      date: order.created_at,
      vendorId: order.vendor?.id || "N/A",
      brand: order.product?.brand_name || "N/A",
      productId: order.product?.id || "N/A",
      productName: order.product?.name || "N/A",
      type: order.product?.product_type || "N/A",
      quantity: order.quantity,
      size: order.size || "N/A",
      amount: order.total_amount,
      status: order.status,
      items: order.items || []
    }));
  };

  const orderData = {
    new: {
      data: transformOrderData(newOrdersData?.results),
      count: newOrdersData?.count || 0,
    },
    accepted: {
      data: transformOrderData(acceptedData?.results),
      count: acceptedData?.count || 0,
    },
    rejected: {
      data: transformOrderData(rejectedData?.results),
      count: rejectedData?.count || 0,
    },
    cancelled: {
      data: transformOrderData(cancelledData?.results),
      count: cancelledData?.count || 0,
    },
    dispatched: {
      data: transformOrderData(dispatchedData?.results),
      count: dispatchedData?.count || 0,
    },
    received: {
      data: transformOrderData(receivedData?.results),
      count: receivedData?.count || 0,
    },
  };

  const handleRefresh = () => {
    switch(activeTab) {
      case "new":
        refetchNew();
        break;
      case "accepted":
        refetchAccepted();
        break;
      case "rejected":
        refetchRejected();
        break;
      case "cancelled":
        refetchCancelled();
        break;
      case "dispatched":
        refetchDispatched();
        break;
      case "received":
        refetchReceived();
        break;
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({
        id: orderId,
        status: newStatus,  
      }).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
      handleRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openEntryModal = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const saveEntryDetails = () => {
    toast.success("Order details updated successfully");
    handleRefresh();
    closeModal();
  };

  const viewBill = (orderId) => {
    toast.info(`Opening bill PDF for order ${orderId}`);
  };

  const isLoading = 
    (activeTab === "new" && isNewLoading) ||
    (activeTab === "accepted" && isAcceptedLoading) ||
    (activeTab === "rejected" && isRejectedLoading) ||
    (activeTab === "cancelled" && isCancelledLoading) ||
    (activeTab === "dispatched" && isDispatchedLoading) ||
    (activeTab === "received" && isReceivedLoading);

  const isFetching = 
    (activeTab === "new" && isNewFetching) ||
    (activeTab === "accepted" && isAcceptedFetching) ||
    (activeTab === "rejected" && isRejectedFetching) ||
    (activeTab === "cancelled" && isCancelledFetching) ||
    (activeTab === "dispatched" && isDispatchedFetching) ||
    (activeTab === "received" && isReceivedFetching);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your orders and track their status
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
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="new">New Orders</option>
                <option value="accepted">Accepted Orders</option>
                <option value="rejected">Rejected Orders</option>
                <option value="cancelled">Cancelled Orders</option>
                <option value="dispatched">Dispatched Orders</option>
                <option value="received">Received Orders</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-2 md:space-x-4">
                  <button
                    onClick={() => {
                      setActiveTab('new');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'new' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    New ({orderData.new.count || 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accepted');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'accepted' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Accepted ({orderData.accepted.count || 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('rejected');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Rejected ({orderData.rejected.count || 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('cancelled');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'cancelled' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Cancelled ({orderData.cancelled.count || 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('dispatched');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'dispatched' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Dispatched ({orderData.dispatched.count || 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('received');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'received' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Received ({orderData.received.count || 0})
                  </button>
                </nav>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FiRotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading states */}
        {(isLoading || isFetching) && (
          <div className="flex justify-center py-8">
            <FiRotateCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Orders Table */}
        {!isLoading && !isFetching && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Vendor ID
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    {activeTab === 'received' && (
                      <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                    )}
                    <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData[activeTab]?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'received' ? 11 : 10} className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="text-center py-8">
                          <div className="mx-auto h-20 w-20 text-gray-400 mb-3">
                            {activeTab === "new" ? (
                              <FiFileText className="w-full h-full" />
                            ) : activeTab === "accepted" ? (
                              <FiCheck className="w-full h-full" />
                            ) : activeTab === "rejected" || activeTab === "cancelled" ? (
                              <FiX className="w-full h-full" />
                            ) : activeTab === "dispatched" ? (
                              <FiTruck className="w-full h-full" />
                            ) : (
                              <FiPackage className="w-full h-full" />
                            )}
                          </div>
                          <h3 className="text-md font-semibold text-gray-700">
                            {activeTab === "new" 
                              ? "No new orders" 
                              : activeTab === "accepted" 
                                ? "No accepted orders" 
                                : activeTab === "rejected"
                                  ? "No rejected orders"
                                  : activeTab === "cancelled" 
                                    ? "No cancelled orders" 
                                    : activeTab === "dispatched" 
                                      ? "No dispatched orders" 
                                      : "No received orders"}
                          </h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orderData[activeTab].data.map((order, index) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(order.date)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {order.vendorId}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {order.brand}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {order.productId}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {order.productName}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {order.type}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {order.quantity}
                        </td>
                        {activeTab === 'received' && (
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                            {order.size}
                          </td>
                        )}
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(order.amount)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {activeTab === 'new' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(order.id, 'accepted')}
                                  className="text-green-600 hover:text-green-900 cursor-pointer"
                                  title="Accept Order"
                                >
                                  <FiCheck className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900 cursor-pointer"
                                  title="Reject Order"
                                >
                                  <FiX className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            
                            {activeTab === 'accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'dispatched')}
                                className="text-yellow-600 hover:text-yellow-900 cursor-pointer"
                                title="Dispatch Order"
                              >
                                <FiTruck className="h-5 w-5" />
                              </button>
                            )}
                            
                            {activeTab === 'dispatched' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'received')}
                                className="text-purple-600 hover:text-purple-900 cursor-pointer"
                                title="Mark as Received"
                              >
                                <FiPackage className="h-5 w-5" />
                              </button>
                            )}
                            
                            {activeTab === 'received' && (
                              <>
                                <button
                                  onClick={() => openEntryModal(order)}
                                  className="text-blue-600 hover:text-blue-900 cursor-pointer"
                                  title="Entry Details"
                                >
                                  <FiEdit2 className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => viewBill(order.id)}
                                  className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                  title="View Bill"
                                >
                                  <FiFileText className="h-5 w-5" />
                                </button>
                              </>
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
            {orderData[activeTab]?.count > 0 && (
              <div className="px-3 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
                  Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * pageSize, orderData[activeTab].count)}
                  </span>{' '}
                  of <span className="font-semibold">{orderData[activeTab].count}</span> results
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
                    disabled={currentPage * pageSize >= orderData[activeTab].count}
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

      {/* Order Entry Modal */}
      {selectedOrder && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <FiRotateCw className="w-8 h-8 text-white animate-spin" />
        </div>}>
          <OrderEntryModal
            order={selectedOrder}
            onClose={closeModal}
            onSave={saveEntryDetails}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AdminOrderManagementPage;