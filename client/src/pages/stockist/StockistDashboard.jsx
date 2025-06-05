import React, { useState, useEffect } from 'react';
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

import { useGetOrderSummaryQuery } from '../../features/order/orderApi'; 
import { useGetProductStatsQuery } from '../../features/product/productApi'; 
import { useGetWalletQuery  } from '../../features/walletApi'; 

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

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
        <p className="text-2xl font-bold">${wallet?.balance ?? 0}</p>
      </div>
      <div className="card bg-blue-600 text-white p-4 rounded-lg">
        <p className="text-sm">Pending Amount</p>
        <p className="text-2xl font-bold">${wallet?.pending ?? 0}</p>
      </div>
      <div className="card bg-yellow-500 text-white p-4 rounded-lg">
        <p className="text-sm">Withdrawn</p>
        <p className="text-2xl font-bold">${wallet?.withdrawn ?? 0}</p>
      </div>
      <div className="card bg-purple-600 text-white p-4 rounded-lg">
        <p className="text-sm">Last Transaction</p>
        <p className="text-2xl font-bold">${wallet?.lastTransaction ?? 0}</p>
      </div>
    </div>
  </div>
);

const StockistDashboard = () => {
  const [selectedType, setSelectedType] = useState('Order');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Fetch data
  const { data: orderSummary, isLoading: ordersLoading, error: ordersError } = useGetOrderSummaryQuery();
  const { data: productStats, isLoading: productLoading, error: productError } = useGetProductStatsQuery();
  const { data: walletData, isLoading: walletLoading, error: walletError } = useGetWalletQuery();

  // Prepare data for charts
  const totalOrders = orderSummary?.statusCounts?.All || 0;
  const pendingOrders = orderSummary?.statusCounts?.Pending || 0;
  const rejectedOrders = orderSummary?.statusCounts?.Rejected || 0;

  // Chart data based on selected type
  const chartDataMap = {
    Order: {
      labels: orderSummary?.monthlyOrders?.labels || [],
      data: orderSummary?.monthlyOrders?.data || [],
      statusCounts: orderSummary?.statusCounts || { All: 0, Pending: 0, Approved: 0, Rejected: 0 },
    },
    Product: {
      labels: productStats?.labels || [],
      data: productStats?.data || [],
    },
    // If you have real invoice data, replace here, else dummy fallback
    Invoice: {
      labels: ['Paid', 'Pending', 'Overdue'],
      data: [600, 250, 150],
    },
  };

  // Filter chart data for bar chart
  const filteredLabels = chartDataMap[selectedType]?.labels || [];
  const filteredData = chartDataMap[selectedType]?.data || [];

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

  // Loading or error states can be handled as needed
  if (ordersLoading || productLoading || walletLoading) return <div>Loading dashboard data...</div>;
  if (ordersError || productError || walletError) return <div>Error loading data. Please try again.</div>;

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
            <option>Wallet</option>
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

      {/* Summary Section */}
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
          wallet={walletData || {}}
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-xl shadow p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-4">{selectedType} Bar Chart</h2>
          <Bar data={barData} />
        </motion.div>

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

export default StockistDashboard;
