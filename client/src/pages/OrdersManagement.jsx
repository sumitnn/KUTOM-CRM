import React, { useState, lazy, Suspense } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useGetMyOrdersQuery, useUpdateResellerOrderStatusMutation } from "../features/order/orderApi";
import { 
  FiRefreshCw, 
  FiFilter, 
  FiTruck, 
  FiPackage, 
  FiCheckCircle, 
  FiX,
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
  FiExternalLink,
  FiCheck,
  FiEdit
} from "react-icons/fi";
import { 
  BsBoxSeam, 
  BsCheckCircle, 
  BsXCircle, 
} from "react-icons/bs";
import ModalPortal from "../components/ModalPortal";
import { useNavigate } from "react-router-dom";

// Lazy-loaded OrderDetailsModal
const OrderDetailsModal = lazy(() => import('./OrderDetailsModal'));

const statusConfig = {
  pending: {
    color: "badge-warning",
    icon: <BsBoxSeam className="mr-1" />,
    label: "Pending"
  },
  accepted: {
    color: "badge-primary",
    icon: <BsCheckCircle className="mr-1" />,
    label: "Accepted"
  },
  rejected: {
    color: "badge-error",
    icon: <BsXCircle className="mr-1" />,
    label: "Rejected"
  },
  ready_for_dispatch: {
    color: "badge-secondary",
    icon: <FiPackage className="mr-1" />,
    label: "Ready for Dispatch"
  },
  dispatched: {
    color: "badge-info",
    icon: <FiTruck className="mr-1" />,
    label: "Dispatched"
  },
  delivered: {
    color: "badge-success",
    icon: <FiCheckCircle className="mr-1" />,
    label: "Delivered"
  },
  cancelled: {
    color: "badge-ghost",
    icon: <FiX className="mr-1" />,
    label: "Cancelled"
  },
  received: {
    color: "badge-success",
    icon: <FiCheckCircle className="mr-1" />,
    label: "Received"
  },
  default: {
    color: "badge-ghost",
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiPackage className="text-purple-500" />
              Product Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer btn btn-sm btn-circle btn-ghost"
            >
              <FiX size={20} />
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
              className="btn btn-ghost"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

const OrdersManagement = ({ role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tabChanging, setTabChanging] = useState(false);
  const [processingOrders, setProcessingOrders] = useState(new Set());

  const { data, error, isLoading, isFetching, refetch } = useGetMyOrdersQuery({
    status: activeTab === "all" ? undefined : activeTab,
    page,
  });

  const [updateOrderStatus] = useUpdateResellerOrderStatusMutation();

  const filteredOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results;
  }, [data]);

  const todaysOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter((order) => order.created_at.slice(0, 10) === today);
  }, [data]);

  const hasMore = data && data.next;

  // Handle tab changes with loading state
  React.useEffect(() => {
    if (tabChanging) {
      const timer = setTimeout(() => {
        setTabChanging(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [data, tabChanging]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.default;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Failed to refresh orders:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (tabId) => {
    setTabChanging(true);
    setActiveTab(tabId);
    setPage(1);
    setVisibleCount(10);
    setIsMobileFilterOpen(false);
  };

  const handleMarkReceived = async () => {
    if (!selectedOrder) return;
    
    setProcessingOrders(prev => new Set(prev).add(selectedOrder.id));
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
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setshowloading(false);
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedOrder.id);
        return newSet;
      });
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const tabs = [
    { id: "pending", label: "New Orders" },
    { id: "accepted", label: "Accepted Orders" },
    { id: "dispatched", label: "Dispatched Orders" },
    { id: "received", label: "Received Orders" },
    { id: "rejected", label: "Rejected/Cancelled Orders" }
  ];

  return (
    <div className="py-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">My Orders</h1>
          <p className="text-sm text-gray-500 font-bold">View and manage your orders</p>
        </div>
        
        <button 
          className="btn btn-ghost gap-2"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          {isRefreshing ? (
            <>
              <FiRefreshCw className="animate-spin" />
              Refreshing...
            </>
          ) : isLoading ? (
            'Loading...'
          ) : (
            <>
              <FiRefreshCw />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Today's Orders Section */}
      {todaysOrders.length > 0 && (
        <section className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BsBoxSeam className="text-indigo-600" />
              Today's Orders
            </h2>
            <span className="badge badge-primary badge-sm">{todaysOrders.length} orders</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysOrders.map((order) => {
              const status = getStatusConfig(order.status);
              return (
                <div 
                  key={order.id}
                  className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer bg-gray-50 hover:bg-white"
                  onClick={() => handleViewOrderDetails(order)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 hover:text-primary transition text-sm">
                        #{order.id}
                      </h3>
                      <p className="text-xs text-gray-500">{order.seller?.username || 'N/A'}</p>
                    </div>
                    <span className={`badge badge-sm font-bold whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">
                      {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(order.total_price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="md:hidden mb-4">
        <select 
          className="select select-bordered w-full"
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
          disabled={tabChanging}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
      
      <div className="hidden md:flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium cursor-pointer text-sm whitespace-nowrap flex items-center ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange(tab.id)}
            disabled={tabChanging}
          >
            {tabChanging && activeTab === tab.id && (
              <span className="loading loading-spinner loading-xs mr-2"></span>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading overlay for tab changes */}
      {tabChanging && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        <Suspense fallback={<div className="flex justify-center items-center p-8"><span className="loading loading-spinner loading-lg"></span></div>}>
          {isLoading || tabChanging ? (
            <div className="flex justify-center items-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center gap-2">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-700">Failed to load orders</h3>
                <p className="text-gray-500">Please try again later</p>
                <button 
                  className="btn btn-sm btn-outline mt-2" 
                  onClick={refetch}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center gap-2">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                <p className="text-gray-500">
                  {`No ${activeTab === 'pending' ? 'new' : tabs.find(t => t.id === activeTab)?.label.toLowerCase()} orders available`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12">#</th>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Seller Details</th>
                      <th>Product Info</th>
                      <th>Total Qty</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {filteredOrders.slice(0, visibleCount).map((order, index) => {
                      const status = getStatusConfig(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="font-medium">{index + 1}</td>
                          <td className="font-medium">#{order.id}</td>
                          <td className="font-medium">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{order.seller?.username || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{order.seller?.email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="font-medium">
                            <div className="space-y-1">
                              <div>{order.items[0]?.product?.name}</div>
                              <div className="text-xs space-y-1">
                                <div>SKU: {order.items[0]?.product?.sku}</div>
                                <div>Category: {order.items[0]?.product?.category_name}</div>
                                <div>Brand: {order.items[0]?.product?.brand_name}</div>
                                <div>Sizes: {order.items.map(item => item.variant?.name).join(", ")}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-medium">
                            {order.items.reduce((total, item) => total + item.quantity, 0)}
                          </td>
                          <td className="font-medium">
                            {formatCurrency(order.total_price)}
                          </td>
                          <td className="font-medium">
                            <span className={`badge badge-sm font-bold whitespace-nowrap ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-center gap-2">
                              {activeTab === "dispatched" && order.status === 'dispatched' && (
                                <button 
                                  className="btn btn-xs btn-success gap-1 font-bold"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowReceivedModal(true);
                                  }}
                                  disabled={processingOrders.has(order.id)}
                                >
                                  {processingOrders.has(order.id) ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Mark Received
                                </button>
                              )}
                              
                              <button 
                                className="btn btn-xs btn-ghost hover:bg-blue-50 gap-1 font-bold cursor-pointer" 
                                onClick={() => handleViewOrderDetails(order)}
                                disabled={processingOrders.has(order.id)}
                              >
                                <FiFileText className="text-blue-600 font-bold" size={14} />
                                View Details
                              </button>
                              
                              {/* Product Details Button */}
                              {order.items[0]?.product && (
                                <button 
                                  className="btn btn-xs btn-ghost hover:bg-green-50 gap-1 font-bold cursor-pointer" 
                                  onClick={() => handleViewProductDetails(order.items[0].product)}
                                  disabled={processingOrders.has(order.id)}
                                >
                                  <FiPackage className="text-green-600 font-bold" size={14} />
                                  Product
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination/Load More */}
              {(hasMore || visibleCount < filteredOrders.length) && (
                <div className="flex justify-center p-4 border-t border-gray-100">
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="btn btn-outline btn-sm"
                  >
                    {isFetching ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Loading...
                      </>
                    ) : (
                      "Load More Orders"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </Suspense>
      </div>

      {/* Received Confirmation Modal */}
      {showReceivedModal && selectedOrder && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Confirm Order Received</h3>
                <button 
                  onClick={() => {
                    setShowReceivedModal(false);
                    setSelectedOrder(null);
                    setNote("");
                  }} 
                  className="btn btn-sm btn-circle btn-ghost"
                  disabled={showloading}
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to mark order <span className="font-semibold">#{selectedOrder.id}</span> as received?
              </p>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">Note (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about the received products..."
                  disabled={showloading}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReceivedModal(false);
                    setSelectedOrder(null);
                    setNote("");
                  }}
                  className="btn btn-ghost"
                  disabled={showloading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkReceived}
                  disabled={showloading}
                  className="btn btn-success"
                >
                  {showloading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Confirm Received"
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
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
    </div>
  );
};

export default OrdersManagement;