import { useState, lazy, Suspense } from "react";
import { FiFileText, FiCheck, FiX, FiTruck, FiPackage, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useGetVendorOrdersQuery, useUpdateOrderStatusMutation } from "../features/order/orderApi";
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
  
  const { data: vendorOrders, isLoading, isError, refetch } = useGetVendorOrdersQuery({
    status: activeTab,
    page
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  
  const tabs = [
    { id: "new", label: "New Orders" },
    { id: "accepted", label: "Accepted Orders" },
    { id: "rejected", label: "Rejected Orders" },
    { id: "dispatched", label: "Dispatched Orders" },
    { id: "delivered", label: "Delivered Orders" },
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
      toast.success(`Order ${status} successfully`);
      setSelectedOrder(null);
      setStatusNote("");
      refetch();
    } catch (error) {
      
      toast.error(error.data?.message||"Something Went Wrong");
      
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
                              order.status === 'rejected' ? 'badge-error' :
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
                                  onClick={() => {
                                    setSelectedOrder(order);
                                  }}
                                >
                                  <FiTruck size={14} />
                                  Dispatch
                                </button>
                              )}
                              {activeTab === "dispatched" && (
                                <button 
                                  className="btn btn-xs btn-success gap-1"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                  }}
                                >
                                  <FiPackage size={14} />
                                  Deliver
                                </button>
                              )}
                              <button 
                                className="btn btn-xs btn-ghost hover:bg-blue-50 gap-1" 
                                onClick={() => navigate(`/vendor/orders/${order.id}`)}
                              >
                                <FiFileText className="text-blue-600" size={14} />
                                View
                              </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {selectedOrder.status === 'new' ? 'Reject Order' : 
                 selectedOrder.status === 'accepted' ? 'Dispatch Order' : 
                 'Mark as Delivered'}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="mb-2 font-medium">Order #{selectedOrder.id}</p>
              <p className="text-sm text-gray-600 mb-4">
                {selectedOrder.items.map(item => `${item.product.name} (${item.quantity}x)`).join(', ')}
              </p>
              
              {(selectedOrder.status === 'new' || selectedOrder.status === 'accepted') && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Note (Required)</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered" 
                    placeholder="Enter reason or notes..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  ></textarea>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (selectedOrder.status === 'new') {
                    handleStatusUpdate(selectedOrder.id, 'rejected');
                  } else if (selectedOrder.status === 'accepted') {
                    handleStatusUpdate(selectedOrder.id, 'dispatched');
                  } else {
                    handleStatusUpdate(selectedOrder.id, 'delivered');
                  }
                }}
                className={`btn ${
                  selectedOrder.status === 'new' ? 'btn-error' : 
                  selectedOrder.status === 'accepted' ? 'btn-primary' : 
                  'btn-success'
                }`}
                disabled={!statusNote && ['new', 'accepted'].includes(selectedOrder.status)}
              >
                {selectedOrder.status === 'new' ? 'Reject Order' : 
                 selectedOrder.status === 'accepted' ? 'Dispatch Order' : 
                 'Mark Delivered'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;