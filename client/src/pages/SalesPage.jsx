import { useState, lazy, Suspense, useEffect } from "react";
import { FiFileText, FiCheck, FiX, FiTruck, FiRefreshCw, FiSearch, FiFilter } from "react-icons/fi";

import { 
  useGetVendorOrdersQuery, 
  useUpdateOrderStatusMutation,
  useUpdateDispatchStatusMutation 
} from "../features/order/orderApi";
import { toast } from "react-toastify";
import ModalPortal from "../components/ModalPortal";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));
const OrderDetailsModal = lazy(() => import('../pages/OrderDetailsModal'));

const SalesPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("new");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tabChanging, setTabChanging] = useState(false);
  const [processingOrders, setProcessingOrders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Dispatch form state
  const [dispatchForm, setDispatchForm] = useState({
    courier_name: "",
    tracking_id: "",
    transport_charges: "",
    delivery_date: "",
    receipt: null
  });

  const { data: vendorOrders, isLoading, isError, refetch } = useGetVendorOrdersQuery({
    status: activeTab,
    page
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateDispatchStatus] = useUpdateDispatchStatusMutation();
  
  const tabs = [
    { id: "new", label: "New Orders", count: 0 },
    { id: "accepted", label: "Accepted", count: 0 },
    { id: "rejected", label: "Rejected", count: 0 },
    { id: "cancelled", label: "Cancelled", count: 0 },
    { id: "dispatched", label: "Dispatched", count: 0 },
    { id: "delivered", label: "Delivered", count: 0 },
  ];

  // Handle tab changes with loading state
  useEffect(() => {
    if (tabChanging) {
      const timer = setTimeout(() => {
        setTabChanging(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [vendorOrders, tabChanging]);

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

  const formatLocalDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // compute range: last 6 days including today => subtract 5 days for min
  const today = new Date();
  const minDateObj = new Date(today);
  minDateObj.setDate(today.getDate() - 6);

  const minDate = formatLocalDate(minDateObj);
  const maxDate = formatLocalDate(today);

  const handleTabChange = (tabId) => {
    setTabChanging(true);
    setActiveTab(tabId);
    setPage(1);
  };

  const handleStatusUpdate = async (orderId, status) => {
    if (status === 'dispatched') {
      return;
    }

    if (!statusNote && ['rejected', 'cancelled'].includes(status)) {
      toast.error("Please enter a note for this action");
      return;
    }

    // Add to processing orders to disable button
    setProcessingOrders(prev => new Set(prev).add(orderId));

    try {
      await updateOrderStatus({
        orderId,
        status,
        note: statusNote
      }).unwrap();
      toast.success(`Order ${status} successfully`);
      setSelectedOrder(null);
      setStatusNote("");
      refetch();
    } catch (error) {
      toast.error(error.data?.message||"Something Went Wrong");
    } finally {
      // Remove from processing orders
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleDispatch = async (orderId) => {
    const { courier_name, tracking_id, transport_charges, delivery_date, receipt } = dispatchForm;
    
    if (!courier_name || !tracking_id || !transport_charges || !delivery_date) {
      toast.error("Please fill all required fields");
      return;
    }

    // Add to processing orders to disable button
    setProcessingOrders(prev => new Set(prev).add(orderId));
    setIsDispatching(true);

    try {
      const formData = new FormData();
      formData.append('courier_name', courier_name);
      formData.append('tracking_id', tracking_id);
      formData.append('transport_charges', transport_charges);
      formData.append('delivery_date', delivery_date);
      if (statusNote) {
        formData.append('note', statusNote);
      }
      if (receipt) {
        formData.append('receipt', receipt);
      }

      await updateDispatchStatus({
        orderId,
        data: formData
      }).unwrap();
      
      toast.success("Order dispatched successfully");
      setSelectedOrder(null);
      setDispatchForm({
        courier_name: "",
        tracking_id: "",
        transport_charges: "",
        delivery_date: "",
        receipt: null
      });
      setStatusNote("");
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to dispatch order");
    } finally {
      setIsDispatching(false);
      // Remove from processing orders
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
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

  const handleDispatchFormChange = (e) => {
    const { name, value, files } = e.target;
    setDispatchForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const isDispatchFormValid = () => {
    return (
      dispatchForm.courier_name &&
      dispatchForm.tracking_id &&
      dispatchForm.transport_charges &&
      dispatchForm.delivery_date
    );
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrderForDetails(order);
    setShowOrderDetails(true);
  };

  // Transform API order data to match the OrderDetailsModal format
  const transformOrderForModal = (order) => {
    return {
      id: order.id,
      date: order.created_at,
      buyer: {
        id: order.buyer?.id || '',
        name: order.buyer?.username || 'N/A',
        email: order.buyer?.email || 'N/A',
        address: order.buyer?.address || {
          street_address: null,
          city: null,
          state: "",
          district: "",
          postal_code: null,
          country: "India"
        },
        phone: order.buyer?.phone || 'N/A',
        whatsapp: order.buyer?.whatsapp || 'N/A'
      },
      seller: {
        id: order.seller?.id || '',
        name: order.seller?.username || 'N/A',
        email: order.seller?.email || 'N/A',
        roleId: order.seller?.role_based_id || 'N/A',
        phone: order.seller?.phone || 'N/A'
      },
      items: order.items?.map(item => ({
        id: item.id,
        productId: item.product?.id,
        productName: item.product?.name,
        size: item.variant?.name,
        quantity: item.quantity,
        price: item.unit_price,
        discount: item.discount || "0.00",
        gstAmount: item.gst_amount || "0.00",
        total: (parseFloat(item.unit_price) * item.quantity - parseFloat(item.discount || 0)).toString()
      })) || [],
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

  // Filter orders based on search term
  const filteredOrders = vendorOrders?.results?.filter(order => 
    order.id.toString().includes(searchTerm) ||
    order.buyer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items?.[0]?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="px-2 py-4 md:px-6 md:py-6 max-w-8xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track your orders efficiently</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-none">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered pl-10 pr-4 w-full bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Filter Button */}
          <button 
            className="btn btn-outline gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Refresh Button */}
          <button 
            className="btn btn-ghost gap-2 bg-white/80 backdrop-blur-sm border border-gray-200"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <>
                <FiRefreshCw className="animate-spin" size={16} />
                <span className="hidden sm:inline">Refreshing...</span>
              </>
            ) : isLoading ? (
              'Loading...'
            ) : (
              <>
                <FiRefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 cursor-pointer transition-all duration-200 ${
              activeTab === tab.id 
                ? 'border-primary shadow-lg scale-105' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{tab.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {vendorOrders?.count || 0}
                </p>
              </div>
              {tabChanging && activeTab === tab.id && (
                <span className="loading loading-spinner loading-sm text-primary"></span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden mb-4">
        <select 
          className="select select-bordered w-full bg-white/80 backdrop-blur-sm"
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
          disabled={tabChanging}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
      
      {/* Desktop Tabs */}
      <div className="hidden lg:flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 px-4 py-3 font-medium cursor-pointer text-sm transition-all duration-200 rounded-lg mx-1 ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-lg"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => handleTabChange(tab.id)}
            disabled={tabChanging}
          >
            <div className="flex items-center justify-center gap-2">
              {tabChanging && activeTab === tab.id && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Loading overlay for tab changes */}
      {tabChanging && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-40 rounded-lg">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-2"></span>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Suspense fallback={<div className="flex justify-center items-center p-8"><Spinner /></div>}>
          {isLoading || tabChanging ? (
            <div className="flex justify-center items-center p-12">
              <div className="text-center">
                <Spinner />
                <p className="text-gray-600 mt-2">Loading orders...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <ErrorMessage message="Failed to load vendor orders" />
              <button 
                className="btn btn-outline mt-4" 
                onClick={refetch}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-auto w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="w-12 text-left py-4 px-4">#</th>
                      <th className="text-left py-4 px-4">Order ID</th>
                      <th className="text-left py-4 px-4 hidden lg:table-cell">Date</th>
                      <th className="text-left py-4 px-4">Customer</th>
                      <th className="text-left py-4 px-4 hidden md:table-cell">Product Info</th>
                      <th className="text-center py-4 px-4 hidden sm:table-cell">Qty</th>
                      <th className="text-left py-4 px-4 hidden xl:table-cell">Price</th>
                      <th className="text-left py-4 px-4">Total</th>
                      <th className="text-left py-4 px-4">Status</th>
                      <th className="text-center py-4 px-4">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, index) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4 font-medium">
                            {index + 1 + (page - 1) * 10}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-primary">#{order.id}</div>
                          </td>
                          <td className="py-4 px-4 hidden lg:table-cell">
                            <div className="text-sm text-gray-600">
                              {formatDate(order.created_at)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{order.buyer?.username}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                {order.buyer?.email}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell">
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-[150px]">
                                {order.items[0]?.product?.name}
                              </div>
                              <div className="text-xs text-gray-500 space-y-0.5">
                                <div>SKU: {order.items[0]?.product?.sku}</div>
                                <div>Size: {order.items[0]?.variant?.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center hidden sm:table-cell">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                              {order.items.reduce((total, item) => total + item.quantity, 0)}
                            </span>
                          </td>
                          <td className="py-4 px-4 hidden xl:table-cell">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(order.items[0]?.unit_price)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(order.total_price)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`badge badge-lg font-medium  text-xs whitespace-nowrap ${
                              order.status === 'delivered' ? 'badge-success' :
                              order.status === 'rejected' || order.status === 'cancelled' ? 'badge-error' :
                              order.status === 'accepted' ? 'badge-primary' :
                              order.status === 'dispatched' ? 'badge-secondary' :
                              'badge-warning'
                            }`}>
                              {order.status_display}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              {activeTab === "new" && (
                                <>
                                  <button 
                                    className="btn btn-sm btn-success gap-1 flex-1"
                                    onClick={() => handleStatusUpdate(order.id, 'accepted')}
                                    disabled={processingOrders.has(order.id)}
                                  >
                                    {processingOrders.has(order.id) ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <FiCheck size={14} />
                                    )}
                                    <span className="hidden xs:inline">Accept</span>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-error gap-1 flex-1"
                                    onClick={() => setSelectedOrder(order)}
                                    disabled={processingOrders.has(order.id)}
                                  >
                                    <FiX size={14} />
                                    <span className="hidden xs:inline">Reject</span>
                                  </button>
                                </>
                              )}
                              {activeTab === "accepted" && (
                                <button 
                                  className="btn btn-sm btn-primary gap-1 flex-1"
                                  onClick={() => setSelectedOrder(order)}
                                  disabled={processingOrders.has(order.id)}
                                >
                                  <FiTruck size={14} />
                                  <span className="hidden xs:inline">Dispatch</span>
                                </button>
                              )}
                              <button 
                                className="btn btn-sm btn-outline gap-1 flex-1" 
                                onClick={() => handleViewOrderDetails(order)}
                                disabled={processingOrders.has(order.id)}
                              >
                                <FiFileText size={14} />
                                <span className="hidden xs:inline">Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-12">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">No orders found</h3>
                            <p className="text-gray-500 max-w-md text-center">
                              {searchTerm 
                                ? `No orders matching "${searchTerm}" in ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`
                                : `No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} available`
                              }
                            </p>
                            {searchTerm && (
                              <button 
                                className="btn btn-ghost btn-sm mt-2"
                                onClick={() => setSearchTerm("")}
                              >
                                Clear search
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {vendorOrders?.count > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{(page - 1) * 10 + 1}</span> to{' '}
                    <span className="font-semibold">{(page - 1) * 10 + (filteredOrders.length || 0)}</span> of{' '}
                    <span className="font-semibold">{vendorOrders.count}</span> entries
                  </div>
                  <div className="join">
                    <button 
                      className="join-item btn btn-sm btn-ghost" 
                      disabled={page === 1 || !vendorOrders.previous || tabChanging}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-sm bg-primary text-white border-primary">{page}</button>
                    <button 
                      className="join-item btn btn-sm btn-ghost" 
                      disabled={!vendorOrders.next || tabChanging}
                      onClick={() => setPage(p => p + 1)}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Suspense>
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedOrder.status === 'new' ? 'Reject Order' : 
                   selectedOrder.status === 'accepted' ? 'Dispatch Order' : 
                   'Order Details'}
                </h3>
                <button 
                  onClick={() => {
                    setSelectedOrder(null);
                    setDispatchForm({
                      courier_name: "",
                      tracking_id: "",
                      transport_charges: "",
                      delivery_date: "",
                      receipt: null
                    });
                  }} 
                  className="btn btn-sm btn-circle btn-ghost"
                  disabled={isDispatching}
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {/* Rest of your modal content remains the same */}
                {/* ... (keep the existing modal content structure) */}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrderForDetails && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          </div>
        }>
          <OrderDetailsModal 
            order={transformOrderForModal(selectedOrderForDetails)} 
            onClose={() => {
              setShowOrderDetails(false);
              setSelectedOrderForDetails(null);
            }} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default SalesPage;