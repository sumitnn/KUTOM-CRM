import React, { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useGetMyOrdersQuery } from "../features/order/orderApi"; // adjust path accordingly

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
};

const today = new Date().toISOString().slice(0, 10);

const OrdersManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const [page, setPage] = useState(1);

  const { data, error, isLoading, isFetching } = useGetMyOrdersQuery({
    status: activeTab,
    page,
  });

  // Filter client-side by customer name or order id since backend might not support search
  const filteredOrders = React.useMemo(() => {
    if (!data?.results) return [];

    return data.results
      .filter(
        (order) =>
          order.customer.toLowerCase().includes(search.toLowerCase()) ||
          order.id.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, visibleCount);
  }, [data, search, visibleCount]);

  // Today's orders from fetched data
  const todaysOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter((order) => order.date === today);
  }, [data]);

  const hasMore =
    data && data.next; // DRF paginated response includes `next` url when more pages exist

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900">My Orders</h1>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Today's Orders</h2>
          {todaysOrders.length === 0 ? (
            <p className="text-gray-500 italic">No orders placed today.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {todaysOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-white rounded-lg shadow-md border hover:shadow-lg transition cursor-pointer"
                  onClick={() => alert(`Viewing details for ${order.id}`)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg text-indigo-700">{order.customer}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        statusColors[order.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Order ID: {order.id}</p>
                  <p className="text-gray-600 text-sm mb-1">
                    Amount: <span className="font-semibold">${order.amount.toFixed(2)}</span>
                  </p>
                  <p className="text-gray-500 text-xs italic">
                    Placed {formatDistanceToNow(parseISO(order.date), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {["all", "pending", "completed", "rejected"].map((tab) => (
            <button
              key={tab}
              className={`py-3 px-5 font-semibold rounded-t-lg border-b-4 transition ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                  : "border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-400"
              }`}
              onClick={() => {
                setActiveTab(tab);
                setVisibleCount(5);
                setPage(1);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Orders
            </button>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-20 text-lg">Loading orders...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-20 text-lg">Failed to load orders.</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-20 text-lg">No orders found.</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border rounded-lg p-5 shadow-sm hover:shadow-lg transition cursor-pointer"
                onClick={() => alert(`Viewing details for ${order.id}`)}
              >
                <div className="mb-3 md:mb-0 md:w-2/5">
                  <p className="text-xl font-semibold text-indigo-700">{order.customer}</p>
                  <p className="text-sm text-gray-500">{order.id}</p>
                </div>

                <div className="mb-3 md:mb-0 text-gray-700 md:w-1/4">
                  <p>
                    <span className="font-semibold">Order Date:</span> {order.date} (
                    {formatDistanceToNow(parseISO(order.date), { addSuffix: true })})
                  </p>
                  <p>
                    <span className="font-semibold">Amount:</span> ${order.amount.toFixed(2)}
                  </p>
                </div>

                <div className="mb-3 md:mb-0 md:w-1/6">
                  <span
                    className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                      statusColors[order.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="md:w-1/6 text-right">
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View Details &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={isFetching}
              className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              {isFetching ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
