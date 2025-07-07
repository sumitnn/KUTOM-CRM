import { useState, lazy, Suspense } from "react";
import { FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useGetOrderHistoryQuery } from "../features/order/orderApi";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const SalesPage = ({ role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("new");
  const [page, setPage] = useState(1);
  
  const { data: orderHistory, isLoading, isError, refetch } = useGetOrderHistoryQuery({
    status: activeTab,
    page
  });
  
  const tabs = [
    { id: "new", label: "New Orders" },
    { id: "accepted", label: "Accepted Orders" },
    { id: "rejected", label: "Rejected Orders" },
    { id: "dispatched", label: "Dispatched Orders" },
    { id: "delivered", label: "Delivered Orders" },
  ];

  const handleAction = async (orderId, action) => {
    try {
      // Implement your API call for order actions here
      // Example: await updateOrderStatus({ orderId, status: action }).unwrap();
      toast.success(`Order ${action} successfully`);
      refetch();
    } catch (error) {
      toast.error(`Failed to ${action} order`);
      console.error(error);
    }
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-sm text-gray-500">Manage your sales orders</p>
        </div>
        
        <button 
          className="btn btn-ghost gap-2"
          onClick={refetch}
        >
          Refresh
        </button>
      </div>

      {/* Tabs - Horizontal on desktop, dropdown on mobile */}
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
            className={`px-4 py-2 font-bold cursor-pointer text-sm whitespace-nowrap ${
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
              <ErrorMessage message="Failed to load order history" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12">Sr No.</th>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {orderHistory?.results?.length > 0 ? (
                      orderHistory.results.map((order, index) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td>{index + 1 + (page - 1) * 10}</td>
                          <td>{order.order_id || order.id}</td>
                          <td>
                            {new Date(order.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td>{order.customer_name || 'N/A'}</td>
                          <td>{order.product_name || 'N/A'}</td>
                          <td>{order.quantity}</td>
                          <td>₹{order.total_amount?.toLocaleString() || '0'}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'dispatched' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-center gap-1">
                              {activeTab === "new" && (
                                <>
                                  <button 
                                    className="btn btn-xs btn-success"
                                    onClick={() => handleAction(order.id, 'accepted')}
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    className="btn btn-xs btn-error"
                                    onClick={() => handleAction(order.id, 'rejected')}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {activeTab === "accepted" && (
                                <button 
                                  className="btn btn-xs btn-primary"
                                  onClick={() => handleAction(order.id, 'dispatched')}
                                >
                                  Dispatch
                                </button>
                              )}
                              {activeTab === "dispatched" && (
                                <button 
                                  className="btn btn-xs btn-success"
                                  onClick={() => handleAction(order.id, 'delivered')}
                                >
                                  Mark Delivered
                                </button>
                              )}
                              <button 
                                className="btn btn-xs btn-ghost btn-square hover:bg-blue-50" 
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <FiFileText className="text-blue-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-8">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                            <p className="text-gray-500">Your {tabs.find(t => t.id === activeTab)?.label} will appear here</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {orderHistory?.count > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{(page - 1) * 10 + (orderHistory.results?.length || 0)}</span> of{' '}
                    <span className="font-medium">{orderHistory.count}</span> entries
                  </div>
                  <div className="join">
                    <button 
                      className="join-item btn btn-sm" 
                      disabled={page === 1 || !orderHistory.previous}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-sm btn-active">{page}</button>
                    <button 
                      className="join-item btn btn-sm" 
                      disabled={!orderHistory.next}
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
    </div>
  );
};

export default SalesPage;