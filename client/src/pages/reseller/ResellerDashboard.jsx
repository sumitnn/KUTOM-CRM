import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

// Updated SummarySection to include Wallet Details and full width
const SummarySection = ({ total, pending, rejected, wallet }) => (
  <div className="bg-white rounded-xl shadow p-6 w-full">
    <h3 className="text-lg font-semibold mb-6">Summary & Wallet Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="card bg-primary text-white p-4 rounded-lg">
        <p className="text-sm">Total Orders</p>
        <p className="text-2xl font-bold">{total}</p>
      </div>
      <div className="card bg-warning text-white p-4 rounded-lg">
        <p className="text-sm">Pending Orders</p>
        <p className="text-2xl font-bold">{pending}</p>
      </div>
      <div className="card bg-error text-white p-4 rounded-lg">
        <p className="text-sm">Rejected Orders</p>
        <p className="text-2xl font-bold">{rejected}</p>
      </div>
    </div>

    <h4 className="text-md font-semibold mb-4">Wallet Details</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <div className="card bg-green-600 text-white p-4 rounded-lg">
        <p className="text-sm">Wallet Balance</p>
        <p className="text-2xl font-bold">${wallet.balance}</p>
      </div>
      <div className="card bg-blue-600 text-white p-4 rounded-lg">
        <p className="text-sm">Pending Amount</p>
        <p className="text-2xl font-bold">${wallet.pending}</p>
      </div>
      <div className="card bg-yellow-500 text-white p-4 rounded-lg">
        <p className="text-sm">Withdrawn</p>
        <p className="text-2xl font-bold">${wallet.withdrawn}</p>
      </div>
      <div className="card bg-purple-600 text-white p-4 rounded-lg">
        <p className="text-sm">Last Transaction</p>
        <p className="text-2xl font-bold">${wallet.lastTransaction}</p>
      </div>
    </div>
  </div>
);

const ResellerDashboard = () => {
  // Filters state
  const [selectedType, setSelectedType] = useState('Order');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Simulated data (ideally fetched from API)
  const [chartDataMap, setChartDataMap] = useState({
    Order: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [120, 90, 150, 80, 200, 170],
      statusCounts: { All: 720, Pending: 150, Approved: 500, Rejected: 70 },
    },
    Product: {
      labels: ['Product A', 'Product B', 'Product C'],
      data: [300, 500, 200],
    },
    Invoice: {
      labels: ['Paid', 'Pending', 'Overdue'],
      data: [600, 250, 150],
    },
  });

  // Dummy wallet data
  const walletData = {
    balance: 1250,
    pending: 300,
    withdrawn: 950,
    lastTransaction: 150,
  };

  // Filter chart data (demo logic)
  const filteredLabels = chartDataMap[selectedType]?.labels || [];
  const filteredData = chartDataMap[selectedType]?.data || [];

  // Summary stats for Orders
  const totalOrders = chartDataMap.Order.statusCounts.All;
  const pendingOrders = chartDataMap.Order.statusCounts.Pending;
  const rejectedOrders = chartDataMap.Order.statusCounts.Rejected;

  const barData = {
    labels: filteredLabels,
    datasets: [
      {
        label: selectedType,
        data: filteredData,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const pieData = {
    labels: chartDataMap.Invoice.labels,
    datasets: [
      {
        data: chartDataMap.Invoice.data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      },
    ],
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8">Reseller Dashboard</h1>

      {/* Filters */}
      <div className="card bg-white p-6 rounded-xl shadow mb-8 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
        <div className="flex flex-col">
          <label className="mb-1 font-semibold">Select Data Type</label>
          <select
            className="select select-bordered w-48"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option>Order</option>
            <option>Product</option>
            <option>Invoice</option>
          </select>
        </div>

        {selectedType === 'Order' && (
          <>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Filter by Status</label>
              <select
                className="select select-bordered w-48"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Filter by Month</label>
              <select
                className="select select-bordered w-48"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option>All</option>
                {chartDataMap.Order.labels.map((month) => (
                  <option key={month}>{month}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Summary Section full width */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SummarySection
          total={totalOrders}
          pending={pendingOrders}
          rejected={rejectedOrders}
          wallet={walletData}
        />
      </motion.div>

      {/* Charts in 2 columns on xl+ screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div
          className="bg-white rounded-xl shadow p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-4">{selectedType} Bar Chart</h2>
          <Bar data={barData} />
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          className="bg-white rounded-xl shadow p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Invoice Status Pie Chart</h2>
          <Pie data={pieData} />
        </motion.div>
      </div>
    </div>
  );
};

export default ResellerDashboard;
