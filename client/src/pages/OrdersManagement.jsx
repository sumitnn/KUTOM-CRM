import React, { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useGetMyOrdersQuery } from "../features/order/orderApi";
import { FiSearch, FiChevronRight, FiRefreshCw, FiFilter } from "react-icons/fi";
import { BsBoxSeam, BsClockHistory, BsCheckCircle, BsXCircle } from "react-icons/bs";
import { Link } from "react-router-dom";

const statusConfig = {
  completed: {
    color: "bg-green-100 text-green-800",
    icon: <BsCheckCircle className="mr-1" />,
    label: "Completed"
  },
  pending: {
    color: "bg-yellow-100 text-yellow-800",
    icon: <BsClockHistory className="mr-1" />,
    label: "Pending"
  },
  rejected: {
    color: "bg-red-100 text-red-800",
    icon: <BsXCircle className="mr-1" />,
    label: "Rejected"
  },
  default: {
    color: "bg-gray-100 text-gray-800",
    icon: <BsBoxSeam className="mr-1" />,
    label: "Unknown"
  }
};

const today = new Date().toISOString().slice(0, 10);

const OrdersManagement = ({role}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { data, error, isLoading, isFetching } = useGetMyOrdersQuery({
    status: activeTab === "all" ? undefined : activeTab,
    page,
  });

  const filteredOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results
      .filter(
        (order) =>
          order.reseller.username.toLowerCase().includes(search.toLowerCase()) ||
          order.id.toString().toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, visibleCount);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-2">View and manage all your orders in one place</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50"
              onClick={() => window.location.reload()}
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
                    className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer group"
                    
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition">
                          #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500">{order.reseller.username}</p>
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
                        ${parseFloat(order.total_price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
                className="md:hidden px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              >
                <FiFilter className="mr-2" />
                Filter
              </button>
              
              <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block`}>
                <div className="flex flex-wrap gap-2">
                  {["all", "pending", "completed", "rejected"].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          setActiveTab(tab);
                          setVisibleCount(10);
                          setPage(1);
                          setIsMobileFilterOpen(false);
                        }}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const status = getStatusConfig(order.status);
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.reseller.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ${parseFloat(order.total_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/${role}/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full">
                            View <FiChevronRight className="ml-1" />
                          </Link>
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
                className="px-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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