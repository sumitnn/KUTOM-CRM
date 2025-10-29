import { useState, lazy, Suspense, useEffect } from "react";
import { FiFileText, FiCheck, FiX, FiTruck, FiRefreshCw, FiSearch, FiFilter, FiEdit } from "react-icons/fi";

import { 
  useGetVendorOrdersQuery, 
  useUpdateOrderStatusMutation,
  useUpdateDispatchStatusMutation,
  useUpdateOrderItemsMutation 
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
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState(null);
  const [batchFormData, setBatchFormData] = useState({});

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
  const [updateOrderItems] = useUpdateOrderItemsMutation();
  
  const tabs = [
    { id: "new", label: "New Orders", count: vendorOrders?.status_counts?.new || 0 },
    { id: "accepted", label: "Accepted", count: vendorOrders?.status_counts?.accepted || 0 },
    { id: "rejected", label: "Rejected", count: vendorOrders?.status_counts?.rejected || 0 },
    { id: "cancelled", label: "Cancelled", count: vendorOrders?.status_counts?.cancelled || 0 },
    { id: "dispatched", label: "Dispatched", count: vendorOrders?.status_counts?.dispatched || 0 },
    { id: "delivered", label: "Delivered", count: vendorOrders?.status_counts?.delivered || 0 },
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

  // Initialize batch form data when order is selected
  useEffect(() => {
    if (selectedOrderForBatch) {
      const initialData = {};
      selectedOrderForBatch.items.forEach((item, index) => {
        initialData[index] = {
          batch_number: item.batch_number || "",
          manufacture_date: item.manufacture_date || "",
          expiry_date: item.expiry_date || ""
        };
      });
      setBatchFormData(initialData);
    }
  }, [selectedOrderForBatch]);

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

  const handleBatchUpdate = async (orderId) => {
    // Validate all batch data
    const itemsToUpdate = [];
    let isValid = true;

    Object.keys(batchFormData).forEach(index => {
      const itemData = batchFormData[index];
      if (!itemData.batch_number || !itemData.manufacture_date || !itemData.expiry_date) {
        isValid = false;
        toast.error(`Please fill all batch details for item ${parseInt(index) + 1}`);
        return;
      }
      
      itemsToUpdate.push({
        item_id: selectedOrderForBatch.items[index].id,
        batch_number: itemData.batch_number,
        manufacture_date: itemData.manufacture_date,
        expiry_date: itemData.expiry_date
      });
    });

    if (!isValid) return;

    // Add to processing orders to disable button
    setProcessingOrders(prev => new Set(prev).add(orderId));

    try {
      await updateOrderItems({
        orderId,
        items: itemsToUpdate
      }).unwrap();
      
      toast.success("Batch details updated successfully");
      setShowBatchModal(false);
      setSelectedOrderForBatch(null);
      setBatchFormData({});
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update batch details");
    } finally {
      // Remove from processing orders
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleBatchFormChange = (itemIndex, field, value) => {
    setBatchFormData(prev => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        [field]: value
      }
    }));
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

  const handleBatchManagement = (order) => {
    setSelectedOrderForBatch(order);
    setShowBatchModal(true);
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
        discount: item.discount || "0",
        gst_percentage:item.gst_percentage,
        total: item.final_price,
        batch_number: item.batch_number,
        manufacture_date: item.manufacture_date,
        expiry_date: item.expiry_date,
        bulk_price_applied: item.bulk_price_applied,
        discount_percentage: item.discount_percentage,
        single_quantity_after_gst_and_discount_price:item.single_quantity_after_gst_and_discount_price
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
    order.items?.some(item => 
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  // Calculate total items and display first product name
  const getOrderSummary = (order) => {
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const firstProduct = order.items[0]?.product;
    const productNames = [...new Set(order.items.map(item => item.product.name))];
    
    return {
      totalItems,
      productName: productNames.length > 1 
        ? `${firstProduct.name} + ${productNames.length - 1} more` 
        : firstProduct?.name || 'N/A',
      productCount: productNames.length
    };
  };

  return (
    <div className="py-4 max-w-8xl mx-auto">
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
                   {tab.count}
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
                      <th className="text-left py-4 px-4 hidden xl:table-cell">Total Items</th>
                      <th className="text-left py-4 px-4">Total Price</th>
                      <th className="text-left py-4 px-4">Status</th>
                      <th className="text-center py-4 px-4">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, index) => {
                        const summary = getOrderSummary(order);
                        return (
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
                                  {summary.productName}
                                </div>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <div>SKU: {order.items[0]?.product?.sku}</div>
                                  <div>Items: {summary.productCount} product(s)</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center hidden sm:table-cell">
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                                {summary.totalItems}
                              </span>
                            </td>
                            <td className="py-4 px-4 hidden xl:table-cell">
                              <div className="font-medium text-gray-900">
                                {order.items.length} items
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-900">
                                {Math.round(
                        order?.transport_charges  > 0
                          ? parseInt(order?.total_price ) + parseInt(order?.transport_charges )
                          : order?.total_price 
                      )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`badge badge-lg font-medium text-xs whitespace-nowrap ${
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
                                  <>
                                    <button 
                                      className="btn btn-sm btn-primary gap-1 flex-1"
                                      onClick={() => setSelectedOrder(order)}
                                      disabled={processingOrders.has(order.id)}
                                    >
                                      <FiTruck size={14} />
                                      <span className="hidden xs:inline">Dispatch</span>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-info gap-1 flex-1"
                                      onClick={() => handleBatchManagement(order)}
                                      disabled={processingOrders.has(order.id)}
                                    >
                                      <FiEdit size={14} />
                                      <span className="hidden xs:inline">Batch</span>
                                    </button>
                                  </>
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
                        );
                      })
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
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
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
              
              {selectedOrder.status === 'accepted' ? (
                <div className="space-y-6">
                  {/* Order Summary Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3 text-gray-700">Order Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-700">Order ID</p>
                        <p className="font-medium">#{selectedOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">Order Created Date</p>
                        <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 ">Total Amount</p>
                        <p className="font-bold">{selectedOrder.total_price}</p>
                      </div>
                    </div>
                  </div>

                  {/* Products Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3 text-gray-700">Products</h4>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 bg-white rounded border border-gray-100">
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name} - {item.variant?.name}</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-sm">
                              <div>
                                <p className="text-gray-500">SKU</p>
                                <p className="font-bold text-gray-500" >{item.variant.sku || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="font-bold text-gray-500">{item.quantity}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Base Price</p>
                                <p className="font-bold text-gray-500">{item.unit_price}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 ">After GST & Discount </p>
                                <p className="font-bold text-gray-500">
                                {(
                              (item.unit_price - (item.unit_price * item.discount_percentage / 100)) *
                              (1 + item.gst_percentage / 100)
                            ).toFixed(2)}
                              </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total</p>
                                <p className="font-bold text-gray-500">{item.final_price }</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3 text-gray-700">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-2 text-gray-600">Contact Details</h5>
                        <div className="space-y-2">
                          <p>
                            <span className="text-gray-500 text-sm">Name: </span>
                            {selectedOrder.buyer?.username || 'N/A'}
                          </p>
                          <p>
                            <span className="text-gray-500 text-sm">Email: </span>
                            {selectedOrder.buyer?.email || 'N/A'}
                          </p>
                          <p>
                            <span className="text-gray-500 text-sm">Phone: </span>
                            {selectedOrder.buyer?.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-gray-600">Shipping Address</h5>
                        {selectedOrder.buyer?.address ? (
                          <div className="space-y-2">
                            <p>{selectedOrder.buyer.address.street_address || 'N/A'}</p>
                            <p>
                              {selectedOrder.buyer.address.city}, 
                              {selectedOrder.buyer.address.district && ` ${selectedOrder.buyer.address.district},`}
                              {selectedOrder.buyer.address.state && ` ${selectedOrder.buyer.address.state},`}
                            </p>
                            <p>
                              {selectedOrder.buyer.address.postal_code && `${selectedOrder.buyer.address.postal_code},`}
                              {selectedOrder.buyer.address.country}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">No address provided</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Form */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3 text-gray-700">Dispatch Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Courier Name <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="text"
                          name="courier_name"
                          value={dispatchForm.courier_name}
                          onChange={handleDispatchFormChange}
                          className="input input-bordered w-full"
                          placeholder="e.g. FedEx, UPS, DHL"
                          required
                          disabled={isDispatching}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Tracking ID <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="text"
                          name="tracking_id"
                          value={dispatchForm.tracking_id}
                          onChange={handleDispatchFormChange}
                          className="input input-bordered w-full"
                          placeholder="Enter tracking number"
                          required
                          disabled={isDispatching}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Shipping Cost <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="number"
                          name="transport_charges"
                          value={dispatchForm.transport_charges}
                          onChange={handleDispatchFormChange}
                          className="input input-bordered w-full"
                          placeholder="Enter shipping cost"
                          min="0"
                          step="0.01"
                          required
                          disabled={isDispatching}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Delivery Date <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="date"
                          name="delivery_date"
                          value={dispatchForm.delivery_date}
                          onChange={handleDispatchFormChange}
                          className="input input-bordered w-full"
                          required
                          min={minDate}
                          max={maxDate}
                          disabled={isDispatching}
                        />
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-medium">Shipping Receipt (Optional)</span>
                        </label>
                        <input
                          type="file"
                          name="receipt"
                          onChange={handleDispatchFormChange}
                          className="file-input file-input-bordered w-full"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isDispatching}
                        />
                        <label className="label">
                          <span className="label-text-alt">Upload receipt or proof of shipment</span>
                        </label>
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-medium">Notes</span>
                        </label>
                        <textarea 
                          className="textarea textarea-bordered h-24" 
                          placeholder="Enter any additional notes for this dispatch..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          disabled={isDispatching}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
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
                      className="btn btn-ghost"
                      disabled={isDispatching}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDispatch(selectedOrder.id)}
                      className="btn btn-primary"
                      disabled={!isDispatchFormValid() || isDispatching}
                    >
                      {isDispatching ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Dispatching...
                        </>
                      ) : (
                        "Confirm Dispatch"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-2 text-gray-700">Order #{selectedOrder.id}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Order Date</p>
                        <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium capitalize">{selectedOrder.status_display}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-2 text-gray-700">Products</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 bg-white rounded border border-gray-100">
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name} - {item.variant?.name}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p>{item.quantity}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Price</p>
                                <p>{formatCurrency(item.unit_price)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total</p>
                                <p>{formatCurrency(item.final_price || (item.unit_price * item.quantity))}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(selectedOrder.status === 'new' || selectedOrder.status === 'accepted') && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          {selectedOrder.status === 'new' ? 'Reason for Rejection' : 'Dispatch Notes'}
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <textarea 
                        className="textarea textarea-bordered h-24" 
                        placeholder={
                          selectedOrder.status === 'new' 
                            ? "Please provide reason for rejecting this order..."
                            : "Enter any notes about this dispatch..."
                        }
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        required
                        disabled={processingOrders.has(selectedOrder.id)}
                      ></textarea>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="btn btn-ghost"
                      disabled={processingOrders.has(selectedOrder.id)}
                    >
                      Cancel
                    </button>
                    {selectedOrder.status === 'new' && (
                      <button 
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'rejected')}
                        className="btn btn-error"
                        disabled={!statusNote || processingOrders.has(selectedOrder.id)}
                      >
                        {processingOrders.has(selectedOrder.id) ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Processing...
                          </>
                        ) : (
                          "Confirm Rejection"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Batch Management Modal */}
      {showBatchModal && selectedOrderForBatch && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Manage Batch Details</h3>
                <button 
                  onClick={() => {
                    setShowBatchModal(false);
                    setSelectedOrderForBatch(null);
                    setBatchFormData({});
                  }} 
                  className="btn btn-sm btn-circle btn-ghost"
                  disabled={processingOrders.has(selectedOrderForBatch.id)}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 text-gray-700">Order #{selectedOrderForBatch.id}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{selectedOrderForBatch.buyer?.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Items</p>
                      <p className="font-medium">{selectedOrderForBatch.items.length}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-gray-700">Product Batch Details</h4>
                  {selectedOrderForBatch.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-800">{item.product.name} - {item.variant?.name}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p>{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">SKU</p>
                            <p>{item.product.sku}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Price</p>
                            <p>{formatCurrency(item.unit_price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p>{formatCurrency(item.final_price || (item.unit_price * item.quantity))}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Batch Number <span className="text-red-500">*</span></span>
                          </label>
                          <input
                            type="text"
                            value={batchFormData[index]?.batch_number || ""}
                            onChange={(e) => handleBatchFormChange(index, 'batch_number', e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Enter batch number"
                            required
                            disabled={processingOrders.has(selectedOrderForBatch.id)}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Manufacture Date <span className="text-red-500">*</span></span>
                          </label>
                          <input
                            type="date"
                            value={batchFormData[index]?.manufacture_date || ""}
                            onChange={(e) => handleBatchFormChange(index, 'manufacture_date', e.target.value)}
                            className="input input-bordered w-full"
                            required
                            max={formatLocalDate(new Date())}
                            disabled={processingOrders.has(selectedOrderForBatch.id)}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Expiry Date <span className="text-red-500">*</span></span>
                          </label>
                          <input
                            type="date"
                            value={batchFormData[index]?.expiry_date || ""}
                            onChange={(e) => handleBatchFormChange(index, 'expiry_date', e.target.value)}
                            className="input input-bordered w-full"
                            required
                            min={formatLocalDate(new Date())}
                            disabled={processingOrders.has(selectedOrderForBatch.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowBatchModal(false);
                      setSelectedOrderForBatch(null);
                      setBatchFormData({});
                    }}
                    className="btn btn-ghost"
                    disabled={processingOrders.has(selectedOrderForBatch.id)}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleBatchUpdate(selectedOrderForBatch.id)}
                    className="btn btn-primary"
                    disabled={processingOrders.has(selectedOrderForBatch.id)}
                  >
                    {processingOrders.has(selectedOrderForBatch.id) ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Updating...
                      </>
                    ) : (
                      "Update Batch Details"
                    )}
                  </button>
                </div>
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