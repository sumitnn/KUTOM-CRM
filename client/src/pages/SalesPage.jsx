import { useState, lazy, Suspense } from "react";
import { FiFileText, FiCheck, FiX, FiTruck, FiPackage } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { 
  useGetVendorOrdersQuery, 
  useUpdateOrderStatusMutation,
  useUpdateDispatchStatusMutation 
} from "../features/order/orderApi";
import { toast } from "react-toastify";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const SalesPage = ({ role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("new");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  
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
    { id: "new", label: "New Orders" },
    { id: "accepted", label: "Accepted Orders" },
    { id: "rejected", label: "Rejected Orders" },
    { id: "cancelled", label: "Cancelled Orders" },
    { id: "dispatched", label: "Dispatched Orders" },
    { id: "delivered", label: "Delivered Orders" },
  ];

  const handleStatusUpdate = async (orderId, status) => {
    if (status === 'dispatched') {
      return;
    }

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
      toast.success(`Order ${status} successfully`);
      setSelectedOrder(null);
      setStatusNote("");
      refetch();
    } catch (error) {
      toast.error(error.data?.message||"Something Went Wrong");
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

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Orders Management</h1>
          <p className="text-sm text-gray-500 font-bold">Manage your orders</p>
        </div>
        
        <button 
          className="btn btn-ghost gap-2"
          onClick={refetch}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
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
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
      
      <div className="hidden md:flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium cursor-pointer text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
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
              <ErrorMessage message="Failed to load vendor orders" />
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
                      <th>Product Info</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {vendorOrders?.results?.length > 0 ? (
                      vendorOrders.results.map((order, index) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="font-medium">{index + 1 + (page - 1) * 10}</td>
                          <td className="font-medium">#{order.id}</td>
                          <td className="font-medium">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="font-medium">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{order.created_by?.username}</div>
                                <div className="text-xs text-gray-500">{order.created_by?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="font-medium">
                            <div className="space-y-1">
                              <div>{order.items[0]?.product?.name}</div>
                              <div className="text-xs space-y-1">
                                <div>SKU: {order.items[0]?.product?.sku}</div>
                                <div>ID: {order.items[0]?.product?.id}</div>
                                <div>Category: {order.items[0]?.product?.category_name}</div>
                                <div>Brand: {order.items[0]?.product?.brand_name}</div>
                                <div>Size: {order.items[0]?.product_size}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-medium">
                            {order.items.reduce((total, item) => total + item.quantity, 0)}
                          </td>
                          <td className="font-medium">
                            {formatCurrency(order.items[0]?.price)}
                          </td>
                          <td className="font-medium">
                            {formatCurrency(order.total_price)}
                          </td>
                          <td className="font-medium">
                            <span className={`badge badge-sm ${
                              order.status === 'delivered' ? 'badge-success' :
                              order.status === 'rejected' || order.status === 'cancelled' ? 'badge-error' :
                              order.status === 'accepted' ? 'badge-primary' :
                              order.status === 'dispatched' ? 'badge-secondary' :
                              'badge-ghost'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-center gap-2">
                              {activeTab === "new" && (
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
                              {activeTab === "accepted" && (
                                <button 
                                  className="btn btn-xs btn-primary gap-1"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <FiTruck size={14} />
                                  Dispatch
                                </button>
                              )}
                              {activeTab !== "accepted" && activeTab !== "cancelled" && (
                                <button 
                                  className="btn btn-xs btn-ghost hover:bg-blue-50 gap-1 font-bold cursor-pointer" 
                                  onClick={() => navigate(`/vendor/my-sales/${order.id}`)}
                                >
                                  <FiFileText className="text-blue-600 font-bold" size={14} />
                                  View Order Details
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-8">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                            <p className="text-gray-500">
                              {activeTab === 'new' ? 'No new orders available' : 
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
              {vendorOrders?.count > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{(page - 1) * 10 + (vendorOrders.results?.length || 0)}</span> of{' '}
                    <span className="font-medium">{vendorOrders.count}</span> entries
                  </div>
                  <div className="join">
                    <button 
                      className="join-item btn btn-sm" 
                      disabled={page === 1 || !vendorOrders.previous}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-sm btn-active">{page}</button>
                    <button 
                      className="join-item btn btn-sm" 
                      disabled={!vendorOrders.next}
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
            
            {selectedOrder.status === 'accepted' ? (
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
                          <p className="font-medium">{item.product.name}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">SKU</p>
                              <p>{item.product.sku || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Size</p>
                              <p>{item.product_size || 'N/A'}</p>
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

                {/* Customer Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 text-gray-700">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-2 text-gray-600">Contact Details</h5>
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
                      <h5 className="font-medium mb-2 text-gray-600">Shipping Address</h5>
                      {selectedOrder.created_by?.address ? (
                        <div className="space-y-2">
                          <p>{selectedOrder.created_by.address.street_address || 'N/A'}</p>
                          <p>
                            {selectedOrder.created_by.address.city}, 
                            {selectedOrder.created_by.address.district && ` ${selectedOrder.created_by.address.district},`}
                            {selectedOrder.created_by.address.state && ` ${selectedOrder.created_by.address.state},`}
                          </p>
                          <p>
                            {selectedOrder.created_by.address.postal_code && `${selectedOrder.created_by.address.postal_code},`}
                            {selectedOrder.created_by.address.country}
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
                        <span className="label-text font-medium">Expected Delivery Date <span className="text-red-500">*</span></span>
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
                      <p className="font-medium capitalize">{selectedOrder.status}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-2 text-gray-700">Products</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 bg-white rounded border border-gray-100">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
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

export default SalesPage;