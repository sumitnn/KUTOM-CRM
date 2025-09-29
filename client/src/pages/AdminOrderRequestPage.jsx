import { useState, lazy, Suspense, useEffect } from "react";
import { 
  FiFileText, 
  FiCheck, 
  FiX, 
  FiTruck, 
  FiPackage,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiCalendar
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { 
  useGetAdminOrdersQuery, 
  useUpdateOrderStatusMutation,
  useUpdateDispatchStatusMutation
} from "../features/order/orderApi";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const AdminOrderRequestPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("today");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Dispatch form state
  const [dispatchForm, setDispatchForm] = useState({
    courier_name: "",
    tracking_id: "",
    transport_charges: "",
    delivery_date: "",
    receipt: null
  });

  // Set default date range to today
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDateRange([today, new Date()]);
  }, []);

  const { data: adminOrders, isLoading, isError, refetch } = useGetAdminOrdersQuery({
    filter: activeTab,
    page,
    search: searchTerm,
    start_date: startDate?.toISOString(),
    end_date: endDate?.toISOString()
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateDispatchStatus] = useUpdateDispatchStatusMutation();
  
  const tabs = [
    { id: "today", label: "Today's Orders", icon: <FiCalendar className="mr-1" /> },
    { id: "all", label: "All Orders" },
    { id: "new", label: "New Orders" },
    { id: "accepted", label: "Accepted" },
   
    { id: "dispatched", label: "Dispatched" },
    { id: "delivered", label: "Delivered" },
    { id: "rejected", label: "Rejected" },
    { id: "cancelled", label: "Cancelled" }
  ];

  const handleStatusUpdate = async (orderId, status) => {
    if (!statusNote && ['rejected', 'cancelled'].includes(status)) {
      toast.error("Please enter a note for this action");
      return;
    }

    try {
      await updateOrderStatus({
        orderId,
        status,
        note: statusNote
      }).unwrap();
      toast.success(`Order status updated to ${status}`);
      setSelectedOrder(null);
      setStatusNote("");
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update order status");
    }
  };

  const handleDispatch = async (orderId) => {
    const { courier_name, tracking_id, transport_charges, delivery_date, receipt } = dispatchForm;
    
    if (!courier_name || !tracking_id || !transport_charges || !delivery_date) {
      toast.error("Please fill all required fields");
      return;
    }

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

  const clearFilters = () => {
    setSearchTerm("");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDateRange([today, new Date()]);
    setActiveTab("today");
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Order Requests</h1>
          <p className="text-sm text-gray-500 font-bold">Manage all recieved order request by customer</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost gap-2"
            onClick={refetch}
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn btn-outline gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filters
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Search Orders</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by ID, customer, vendor..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Date Range</span>
              </label>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                placeholderText="Select date range"
                className="input input-bordered w-full"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setPage(1);
                }}
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={clearFilters}
              className="btn btn-ghost btn-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="hidden md:flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium cursor-pointer text-sm whitespace-nowrap flex items-center ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
          >
            {tab.icon && tab.icon}
            {tab.label}
            {adminOrders?.counts?.[tab.id] ? (
              <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {adminOrders.counts[tab.id]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden mb-4">
        <select 
          className="select select-bordered w-full"
          value={activeTab}
          onChange={(e) => {
            setActiveTab(e.target.value);
            setPage(1);
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label} 
              {adminOrders?.counts?.[tab.id] ? ` (${adminOrders.counts[tab.id]})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Suspense fallback={<div>Loading...</div>}>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner />
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <ErrorMessage message="Failed to load orders" />
              <button 
                className="btn btn-sm btn-outline mt-4" 
                onClick={refetch}
              >
                Retry
              </button>
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
                      <th>Customer</th>
                      <th>Role</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {adminOrders?.results?.length > 0 ? (
                      adminOrders.results.map((order, index) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="font-medium">{index + 1 + (page - 1) * 10}</td>
                          <td className="font-medium">#{order.id}</td>
                          <td className="font-medium">
                            {formatDate(order.created_at)}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{order.created_by?.username}</div>
                                <div className="text-xs text-gray-500">{order.created_by?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{order.created_for?.username}</div>
                                <div className="text-xs text-gray-500">ID: {order.created_for?.role_based_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="font-medium">
                            {formatCurrency(order.total_price)}
                          </td>
                          <td>
                            <span className={`badge ${
                              order.status === 'new' ? 'badge-info' :
                              order.status === 'accepted' ? 'badge-primary' :
                              order.status === 'ready_for_dispatch' ? 'badge-secondary' :
                              order.status === 'dispatched' ? 'badge-warning' :
                              order.status === 'delivered' ? 'badge-success' :
                              'badge-error'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-center gap-2">
                              <button 
                                className="btn btn-xs btn-ghost hover:bg-blue-50 gap-1 font-bold cursor-pointer" 
                                onClick={() => navigate(`/admin/orders-request/${order.id}/`)}
                              >
                                <FiFileText className="text-blue-600 font-bold" size={14} />
                                View
                              </button>
                              
                              {order.status === "new" && (
                                <>
                                  <button 
                                    className="btn btn-xs btn-success gap-1"
                                    onClick={() => handleStatusUpdate(order.id, 'accepted')}
                                  >
                                    <FiCheck size={14} />
                                    Accept
                                  </button>
                                  <button 
                                    className="btn btn-xs btn-error gap-1"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <FiX size={14} />
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {order.status === "accepted" && (
                                <button 
                                  className="btn btn-xs btn-primary gap-1"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <FiTruck size={14} />
                                  Dispatch
                                </button>
                              )}
                              
                              {order.status === "ready_for_dispatch" && (
                                <button 
                                  className="btn btn-xs btn-secondary gap-1"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <FiPackage size={14} />
                                  Mark Dispatched
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-8">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                            <p className="text-gray-500">
                              {activeTab === 'all' ? 'No orders available' : 
                               `No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} available`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {adminOrders?.count > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{(page - 1) * 10 + (adminOrders.results?.length || 0)}</span> of{' '}
                    <span className="font-medium">{adminOrders.count}</span> entries
                  </div>
                  <div className="join">
                    <button 
                      className="join-item btn btn-sm" 
                      disabled={page === 1 || !adminOrders.previous}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-sm btn-active">{page}</button>
                    <button 
                      className="join-item btn btn-sm" 
                      disabled={!adminOrders.next}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedOrder.status === 'new' ? 'Reject Order' : 
                 selectedOrder.status === 'accepted' ? 'Dispatch Order' : 
                 selectedOrder.status === 'ready_for_dispatch' ? 'Mark as Dispatched' :
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
              >
                <FiX size={20} />
              </button>
            </div>
            
            {(selectedOrder.status === 'accepted' || selectedOrder.status === 'ready_for_dispatch') ? (
              <div className="space-y-6">
                {/* Order Summary Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 text-gray-700">Order Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-medium">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium">{formatCurrency(selectedOrder.total_price)}</p>
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
                          <p className="font-medium">{item.product?.name || item.admin_product?.name || 'Unknown Product'}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">SKU</p>
                              <p>{item.product?.sku || item.admin_product?.sku || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Size</p>
                              <p>{item.product_size?.size || item.admin_product_size?.size || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Quantity</p>
                              <p>{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Price</p>
                              <p>{formatCurrency(item.price)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer/Vendor Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 text-gray-700">Customer & Vendor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-2 text-gray-600">Customer Details</h5>
                      <div className="space-y-2">
                        <p>
                          <span className="text-gray-500 text-sm">Name: </span>
                          {selectedOrder.created_by?.username || 'N/A'}
                        </p>
                        <p>
                          <span className="text-gray-500 text-sm">Email: </span>
                          {selectedOrder.created_by?.email || 'N/A'}
                        </p>
                        <p>
                          <span className="text-gray-500 text-sm">Phone: </span>
                          {selectedOrder.created_by?.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 text-gray-600">Vendor Details</h5>
                      <div className="space-y-2">
                        <p>
                          <span className="text-gray-500 text-sm">Name: </span>
                          {selectedOrder.created_for?.username || 'N/A'}
                        </p>
                        <p>
                          <span className="text-gray-500 text-sm">ID: </span>
                          {selectedOrder.created_for?.role_based_id || 'N/A'}
                        </p>
                        <p>
                          <span className="text-gray-500 text-sm">Email: </span>
                          {selectedOrder.created_for?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 text-gray-700">
                    {selectedOrder.status === 'ready_for_dispatch' ? 'Dispatch Confirmation' : 'Dispatch Information'}
                  </h4>
                  {selectedOrder.status === 'ready_for_dispatch' ? (
                    <div className="space-y-4">
                      <div className="alert alert-info">
                        <div>
                          <span>This order is marked as ready for dispatch. Confirm that it has been shipped.</span>
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Tracking ID (Optional)</span>
                        </label>
                        <input
                          type="text"
                          name="tracking_id"
                          value={dispatchForm.tracking_id}
                          onChange={handleDispatchFormChange}
                          className="input input-bordered w-full"
                          placeholder="Enter tracking number if available"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Notes</span>
                        </label>
                        <textarea 
                          className="textarea textarea-bordered h-24" 
                          placeholder="Enter any additional notes..."
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  ) : (
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
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Order Delivery Date <span className="text-red-500">*</span></span>
                        </label>
                        <input
                          type="date"
                          name="delivery_date"
                          value={dispatchForm.delivery_date}
                          onChange={handleDispatchFormChange}
                          className="input input-bordered w-full"
                          required
                          min={new Date().toISOString().split('T')[0]}
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
                        ></textarea>
                      </div>
                    </div>
                  )}
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
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => selectedOrder.status === 'ready_for_dispatch' ? 
                      handleStatusUpdate(selectedOrder.id, 'dispatched') : 
                      handleDispatch(selectedOrder.id)}
                    className="btn btn-primary"
                    disabled={
                      selectedOrder.status === 'ready_for_dispatch' ? false :
                      !isDispatchFormValid() || isDispatching
                    }
                  >
                    {isDispatching ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Processing...
                      </>
                    ) : (
                      selectedOrder.status === 'ready_for_dispatch' ? 
                        "Confirm Dispatch" : 
                        "Save Dispatch Info"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-2 text-gray-700">Order #{selectedOrder.id}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{selectedOrder.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium">{formatCurrency(selectedOrder.total_price)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-2 text-gray-700">Products</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 bg-white rounded border border-gray-100">
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name || item.admin_product?.name || 'Unknown Product'}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">Quantity</p>
                              <p>{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Price</p>
                              <p>{formatCurrency(item.price)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total</p>
                              <p>{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.status === 'new' && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Reason for Rejection
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered h-24" 
                      placeholder="Please provide reason for rejecting this order..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      required
                    ></textarea>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  {selectedOrder.status === 'new' && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'rejected')}
                      className="btn btn-error"
                      disabled={!statusNote}
                    >
                      Confirm Rejection
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderRequestPage;