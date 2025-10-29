import React, { useState, lazy, Suspense } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useGetMyOrdersQuery, useUpdateResellerOrderStatusMutation } from "../features/order/orderApi";
import { 
  FiSearch, 
  FiRefreshCw, 
  FiFilter, 
  FiTruck, 
  FiPackage, 
  FiCheckCircle, 
  FiX,
  FiDollarSign,
  FiInfo,
  FiCalendar,
  FiFileText,
  FiUser,
  FiClipboard,
  FiBox,
  FiShoppingBag,
  FiCreditCard,
  FiPercent,
  FiTag,
  FiEye,
  FiExternalLink
} from "react-icons/fi";
import { 
  BsBoxSeam, 
  BsCheckCircle, 
  BsXCircle, 
} from "react-icons/bs";
import ModalPortal from "../components/ModalPortal";

// Lazy-loaded OrderDetailsModal
const OrderDetailsModal = lazy(() => import('./OrderDetailsModal'));

const statusConfig = {
  pending: {
    color: "bg-blue-100 text-blue-800",
    icon: <BsBoxSeam className="mr-1" />,
    label: "Pending"
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

// Product Details Modal Component
const ProductDetailsModal = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiPackage className="text-purple-500" />
            Product Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Product Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                <FiBox className="text-blue-600" />
                Product Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Product Name</p>
                  <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">SKU</p>
                  <p className="text-sm font-medium text-gray-900">{product.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Slug</p>
                  <p className="text-sm font-medium text-gray-900">{product.slug}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <FiShoppingBag className="text-green-600" />
                Category & Brand
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-semibold text-gray-900">{product.category_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Brand</p>
                  <p className="text-sm font-medium text-gray-900">{product.brand_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Product ID</p>
                  <p className="text-sm font-medium text-gray-900">#{product.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* IDs Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiClipboard className="text-gray-600" />
              Technical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Category ID</p>
                <p className="text-sm font-medium text-gray-900">{product.category_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Brand ID</p>
                <p className="text-sm font-medium text-gray-900">{product.brand_id}</p>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
              <FiInfo className="text-purple-600" />
              Product Summary
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{product.name}</span> is a {product.category_name} product 
                from <span className="font-semibold">{product.brand_name}</span> brand.
              </p>
              <p className="text-sm text-gray-600">
                Product ID: <span className="font-medium">#{product.id}</span> | 
                SKU: <span className="font-medium">{product.sku}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div></ModalPortal>
  );
};

const OrdersManagement = ({ role }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [note, setNote] = useState("");
  const [showloading, setshowloading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data, error, isLoading, isFetching, refetch } = useGetMyOrdersQuery({
    status: activeTab === "all" ? undefined : activeTab,
    page,
  });

  const [updateOrderStatus] = useUpdateResellerOrderStatusMutation();

  const filteredOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results
      .filter(
        (order) =>
          order.buyer?.username?.toLowerCase().includes(search.toLowerCase()) ||
          order.id.toString().includes(search)
     );
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
        status: "received",
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

  // Transform API order data to match the OrderDetailsModal format
  const transformOrderForModal = (order) => {
    return {
      id: order.id,
      created_at: order.created_at,
      buyer: {
        id: order.buyer?.id || "N/A",
        username: order.buyer?.username || "N/A",
        email: order.buyer?.email || "N/A",
        address: order.buyer?.address || {},
        phone: order.buyer?.phone || "N/A",
        whatsapp_number: order.buyer?.whatsapp_number || "N/A",
        role_based_id: order.buyer?.role_based_id || "N/A"
      },
      seller: {
        id: order.seller?.id || "N/A",
        username: order.seller?.username || "N/A",
        email: order.seller?.email || "N/A",
        role: order.seller?.role || "N/A",
        role_based_id: order.seller?.role_based_id || "N/A",
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
    };
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Handle product details modal
  const handleViewProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const tabs = [
    { key: "pending", label: "New" },
    { key: "accepted", label: "Accepted" },
    { key: "dispatched", label: "Dispatched" },
    { key: "received", label: "Received" },
    { key: "rejected", label: "Rejected/Cancelled" }
  ];

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-2">View and manage all your orders in one place</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50 cursor-pointer"
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
                  <div 
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer group bg-white"
                    onClick={() => handleViewOrderDetails(order)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition">
                          #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500">{order.buyer?.username || 'N/A'}</p>
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
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Received Confirmation Modal */}
        {showReceivedModal && (
          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
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
          </div></ModalPortal>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            </div>
          }>
            <OrderDetailsModal 
              order={transformOrderForModal(selectedOrder)} 
              onClose={() => {
                setShowOrderDetails(false);
                setSelectedOrder(null);
              }} 
            />
          </Suspense>
        )}

        {/* Product Details Modal */}
        {showProductDetails && selectedProduct && (
          <ProductDetailsModal 
            product={selectedProduct} 
            onClose={() => {
              setShowProductDetails(false);
              setSelectedProduct(null);
            }} 
          />
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
                className="md:hidden px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              >
                <FiFilter className="mr-2" />
                Filter
              </button>
              
              <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block`}>
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                        }`}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setVisibleCount(10);
                          setPage(1);
                          setIsMobileFilterOpen(false);
                        }}
                      >
                        {tab.label}
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
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
                    // Get unique products from order items
                    const uniqueProducts = order.items.reduce((acc, item) => {
                      if (item.product?.id && !acc.find(p => p.id === item.product.id)) {
                        acc.push(item.product);
                      }
                      return acc;
                    }, []);

                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.buyer?.username || 'N/A'}
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
                          <button
                            onClick={() => handleViewOrderDetails(order)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center cursor-pointer"
                          >
                            <FiEye className="mr-1" />
                            View Details
                          </button>
                          
                          {/* Product Details Buttons */}
                          {uniqueProducts.map((product, index) => (
                            <button
                              key={product.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProductDetails(product);
                              }}
                              className="text-green-600 hover:text-green-900 inline-flex items-center ml-3 cursor-pointer"
                              title={`View ${product.name} details`}
                            >
                              <FiPackage className="mr-1" />
                              {product.name}
                            </button>
                          ))}

                        
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
                className="px-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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