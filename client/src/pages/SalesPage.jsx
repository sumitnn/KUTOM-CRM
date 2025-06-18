import { useState, useEffect } from "react";
import { FiDownload, FiFileText, FiPrinter, FiCalendar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useGetOrderHistoryQuery, useLazyExportOrderHistoryQuery } from "../features/order/orderApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SalesPage = ({ role }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);
  
  const { data: orderHistory, isLoading, isError } = useGetOrderHistoryQuery({
    status: activeTab,
    startDate: startDate?.toISOString().split('T')[0],
    endDate: endDate?.toISOString().split('T')[0],
    page
  });
  
  const [triggerExport] = useLazyExportOrderHistoryQuery();
  
  const tabs = [
    { id: "all", label: "All" },
    { id: "delivered", label: "Delivered" },
    { id: "rejected", label: "Rejected" },
    { id: "cancelled", label: "Cancelled" },
    { id: "in_processing", label: "In Processing" },
  ];

  const handleExport = async () => {
    try {
      const { data } = await triggerExport({
        status: activeTab,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0]
      });
      
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
          <p className="text-sm text-gray-500">Track all your sales transactions</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
            <FiCalendar className="text-gray-500" />
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="w-28 focus:outline-none"
            />
            <span>to</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="End Date"
              className="w-28 focus:outline-none"
            />
          </div>
          
          <button 
            className="btn btn-outline gap-2"
            onClick={handleExport}
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium text-sm ${
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
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Failed to load order history
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12">Sr No.</th>
                    <th>Date</th>
                    <th>User</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th>Qty</th>
                    <th>Actual Rate</th>
                    <th>Accepted Price</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                
                <tbody>
                  {orderHistory?.results?.length > 0 ? (
                    orderHistory.results.map((order, index) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td>{index + 1 + (page - 1) * 10}</td>
                        <td>
                          {new Date(order.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>{order.actor?.full_name || 'System'}</td>
                        <td>{order.order.product.brand?.name || '-'}</td>
                        <td>{order.order.product.category?.name || '-'}</td>
                        <td>{order.order.product.subcategory?.name || '-'}</td>
                        <td>{order.order.quantity}</td>
                        <td>₹{order.order.product.actual_rate?.toLocaleString() || '0'}</td>
                        <td>₹{order.order.accepted_price?.toLocaleString() || '0'}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.action === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.action === 'rejected' ? 'bg-red-100 text-red-800' :
                            order.action === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="font-semibold">₹{order.order.total_amount?.toLocaleString() || '0'}</td>
                        <td>
                          <div className="flex justify-center gap-2">
                            <button 
                              className="btn btn-xs btn-ghost btn-square hover:bg-blue-50 tooltip" 
                              data-tip="View Details"
                              onClick={() => navigate(`/orders/${order.order.id}`)}
                            >
                              <FiFileText className="text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                          <p className="text-gray-500">Your order history will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {orderHistory?.results?.length > 0 && (
              <div className="flex justify-between items-center p-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">{(page - 1) * 10 + orderHistory.results.length}</span> of{' '}
                  <span className="font-medium">{orderHistory.count}</span> entries
                </div>
                <div className="join">
                  <button 
                    className="join-item btn btn-sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
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
      </div>
    </div>
  );
};

export default SalesPage;