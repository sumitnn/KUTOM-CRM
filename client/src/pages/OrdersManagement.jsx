import React, { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useGetMyOrdersQuery, useUpdateStockistResellerOrderStatusMutation } from "../features/order/orderApi";
import { 
  FiSearch, 
  FiChevronRight, 
  FiRefreshCw, 
  FiFilter, 
  FiTruck, 
  FiPackage, 
  FiCheckCircle, 
  FiX 
} from "react-icons/fi";
import { 
  BsBoxSeam, 
  BsClockHistory, 
  BsCheckCircle, 
  BsXCircle, 
  BsExclamationCircle 
} from "react-icons/bs";
import { Link } from "react-router-dom";

const statusConfig = {
  new: {
    color: "bg-blue-100 text-blue-800",
    icon: <BsBoxSeam className="mr-1" />,
    label: "New Order"
  },
  accepted: {
    color: "bg-green-100 text-green-800",
    icon: <BsCheckCircle className="mr-1" />,
    label: "Accepted"
  },
  rejected: {
    color: "bg-red-100 text-red-800",
    icon: <BsXCircle className="mr-1" />,
    label: "Rejected"
  },
  ready_for_dispatch: {
    color: "bg-purple-100 text-purple-800",
    icon: <FiPackage className="mr-1" />,
    label: "Ready for Dispatch"
  },
  dispatched: {
    color: "bg-yellow-100 text-yellow-800",
    icon: <FiTruck className="mr-1" />,
    label: "Dispatched"
  },
  delivered: {
    color: "bg-green-100 text-green-800",
    icon: <FiCheckCircle className="mr-1" />,
    label: "Delivered"
  },
  cancelled: {
    color: "bg-gray-100 text-gray-800",
    icon: <FiX className="mr-1" />,
    label: "Cancelled"
  },
  received: {
    color: "bg-green-100 text-green-800",
    icon: <FiCheckCircle className="mr-1" />,
    label: "Received"
  },
  default: {
    color: "bg-gray-100 text-gray-800",
    icon: <BsBoxSeam className="mr-1" />,
    label: "Unknown"
  }
};

const today = new Date().toISOString().slice(0, 10);

const OrdersManagement = ({ role }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [note, setNote] = useState("");
  const [showloading, setshowloading] = useState(false);

  const { data, error, isLoading, isFetching, refetch } = useGetMyOrdersQuery({
    status: activeTab === "all" ? undefined : activeTab,
    page,
  });

  const [updateOrderStatus] = useUpdateStockistResellerOrderStatusMutation();

  const filteredOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results
      .filter(
        (order) =>
          order.created_for?.username?.toLowerCase().includes(search.toLowerCase()) ||
          order.id.toString().toLowerCase().includes(search.toLowerCase())
      .slice(0, visibleCount));
  }, [data, search, visibleCount]);

  const todaysOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter((order) => order.created_at.slice(0, 10) === today);
  }, [data]);

  const hasMore = data && data.next;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.default;
  };

  const handleCancelOrder = async (orderId) => {
    try {
      // await cancelOrder(orderId);
      refetch();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const handleMarkReceived = async () => {
    if (!selectedOrder) return;
    setshowloading(true);
    try {
      await updateOrderStatus({
        orderId: selectedOrder.id,
        status: "delivered",
        note: note
      }).unwrap();
      
      refetch();
      setShowReceivedModal(false);
      setSelectedOrder(null);
      setNote("");
      setshowloading(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
      setshowloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-2">View and manage all your orders in one place</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50"
              onClick={refetch}
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Today's Orders Section */}
        <section className="mb-10 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <BsBoxSeam className="mr-2 text-indigo-600" />
              Today's Orders
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {todaysOrders.length} orders
            </span>
          </div>
          
          {todaysOrders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No orders placed today.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysOrders.map((order) => {
                const status = getStatusConfig(order.status);
                return (
                  <Link 
                    to={`/${role}/orders/${order.id}`}
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition">
                          #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500">{order.created_for?.username || 'N/A'}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                      </p>
                      <p className="font-semibold text-gray-900">
                        ₹{parseFloat(order.total_price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Received Confirmation Modal */}
        {showReceivedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Product Received
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to mark order #{selectedOrder?.id} as received?
              </p>
              
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  id="note"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about the received products..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReceivedModal(false);
                    setSelectedOrder(null);
                    setNote("");
                  }}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                   <button
      onClick={handleMarkReceived}
      disabled={showloading}
      className={`px-4 py-2 rounded-md text-white ${
        showloading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
      }`}
    >
      {showloading ? "Loading..." : "Confirm Received"}
    </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Orders Section */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <button 
                className="md:hidden px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              >
                <FiFilter className="mr-2" />
                Filter
              </button>
              
              <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block`}>
                <div className="flex flex-wrap gap-2">
                  {["all", "new", "accepted", "ready_for_dispatch", "dispatched", "delivered", "received", "rejected", "cancelled"].map((tab) => {
                    const isActive = activeTab === tab;
                    const tabLabel = tab === "all" ? "All" : 
                                   tab === "ready_for_dispatch" ? "Ready" : 
                                   tab.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    return (
                      <button
                        key={tab}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          setActiveTab(tab);
                          setVisibleCount(10);
                          setPage(1);
                          setIsMobileFilterOpen(false);
                        }}
                      >
                        {tabLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <BsXCircle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</h3>
              <p className="text-gray-600 mb-4">Please try again later</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <BsBoxSeam className="text-gray-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const status = getStatusConfig(order.status);
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.created_for?.username || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ₹{parseFloat(order.total_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link 
                            to={`/${role}/orders/${order.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            View <FiChevronRight className="ml-1" />
                          </Link>
                          {order.status === 'new' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order.id);
                              }}
                              className="text-red-600 hover:text-red-900 ml-3"
                            >
                              Cancel
                            </button>
                          )}
                          {(role === 'stockist' || role === 'reseller') && order.status === 'dispatched' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setShowReceivedModal(true);
                              }}
                              className="text-green-600 cursor-pointer hover:text-green-900 ml-3"
                            >
                              Mark Received
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination/Load More */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="px-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? (
                  <span className="flex items-center">
                    <FiRefreshCw className="animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  "Load More Orders"
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrdersManagement;