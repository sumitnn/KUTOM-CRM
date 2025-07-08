import { lazy, Suspense, useState } from "react";
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
  FiClipboard
} from "react-icons/fi";
import {
  useGetMyOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../features/order/orderApi";

// Modals (lazy loaded)
const AddressModal = lazy(() => import("../../components/modals/AddressModal"));
const ReceivedProductModal = lazy(() => import("../../components/modals/ReceivedProductModal"));
const OrderBillModal = lazy(() => import("../../components/modals/OrderBillModal"));

const AdminOrderManagementPage = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'address', 'received', 'bill'

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

  // Helper function to transform order data
  const transformOrderData = (orders) => {
    return orders?.map((order) => ({
      id: order.id,
      date: order.created_at,
      createdFor: {
        name: order.created_for?.username || "N/A",
        roleId: order.created_for?.role_based_id || "N/A"
      },
      items: order.items.map(item => ({
        productId: item.product?.id || "N/A",
        productName: item.product?.name || "N/A",
        quantity: item.quantity,
        price: item.price,
        size: item.product_size
      })),
      totalAmount: order.total_price,
      status: order.status
    }));
  };

  const orderData = {
    count: ordersData?.count || 0,
    results: transformOrderData(ordersData?.results) || []
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    
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

  const getStatusActions = (status, order) => {
    switch (status) {
      case 'new':
        return (
          <div className="flex items-center space-x-2">
  <button
    onClick={() => handleStatusUpdate(order.id, 'cancelled')}
    className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg border border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-200"
    title="Cancel Order"
  >
    <FiX className="h-4 w-4" />
    <span>Cancel</span>
  </button>
</div>

        );
      case 'accepted':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate(order.id, 'dispatched')}
              className="text-yellow-600 hover:text-yellow-900 cursor-pointer"
              title="Dispatch Order"
            >
              <FiTruck className="h-5 w-5" />
            </button>
            <button
              onClick={() => openModal(order, 'address')}
              className="text-blue-600 hover:text-blue-900 cursor-pointer"
              title="Add Address"
            >
              <FiMapPin className="h-5 w-5" />
            </button>
          </div>
        );
      case 'dispatched':
        return (
          <button
            onClick={() => openModal(order, 'received')}
            className="text-purple-600 hover:text-purple-900 cursor-pointer"
            title="Mark as Received"
          >
            <FiPackage className="h-5 w-5" />
          </button>
        );
      case 'received':
        return (
          <button
            onClick={() => openModal(order, 'bill')}
            className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
            title="View Bill"
          >
            <FiFileText className="h-5 w-5" />
          </button>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="text-gray-400">No actions</span>
        );
      default:
        return null;
    }
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
                className="block w-full  pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="new">New Orders</option>
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
                  <button
                    onClick={() => {
                      setActiveTab('new');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 cursor-pointer font-bold text-xs sm:text-sm ${activeTab === 'new' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    New ({activeTab === 'new' ? orderData.count : 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accepted');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-bold cursor-pointer text-xs sm:text-sm ${activeTab === 'accepted' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Accepted ({activeTab === 'accepted' ? orderData.count : 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('dispatched');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-bold cursor-pointer text-xs sm:text-sm ${activeTab === 'dispatched' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Dispatched ({activeTab === 'dispatched' ? orderData.count : 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('received');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-bold cursor-pointer text-xs sm:text-sm ${activeTab === 'received' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Received ({activeTab === 'received' ? orderData.count : 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('rejected');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-bold cursor-pointer text-xs sm:text-sm ${activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Rejected ({activeTab === 'rejected' ? orderData.count : 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('cancelled');
                      setCurrentPage(1);
                    }}
                    className={`whitespace-nowrap py-3 px-2 border-b-2 font-bold cursor-pointer text-xs sm:text-sm ${activeTab === 'cancelled' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Cancelled ({activeTab === 'cancelled' ? orderData.count : 0})
                  </button>
                </nav>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-bold cursor-pointer text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Role ID
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
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.results?.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-6 whitespace-nowrap text-center">
                        <div className="text-center py-8">
                          <div className="mx-auto h-20 w-20 text-gray-400 mb-3">
                            {activeTab === "new" ? (
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
                            {activeTab === "new" 
                              ? "No new orders" 
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
                                <div className="text-sm font-medium text-gray-900">{order.createdFor.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.createdFor.roleId}
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
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {getStatusActions(order.status, order)}
                          </td>
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
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * pageSize >= orderData.count}
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
      <Suspense fallback={null}>
        {modalType === 'address' && (
          <AddressModal 
            order={selectedOrder} 
            onClose={closeModal} 
            onSave={(address) => {
              // Handle address save logic here
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
              // Handle product received confirmation
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
      </Suspense>
    </div>
  );
};

export default AdminOrderManagementPage;