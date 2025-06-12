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
import { useGetWalletQuery } from '../../features/walletApi';

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

const VendorDashboard = () => {
  const [selectedType, setSelectedType] = useState('Order');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  const { data: orderSummary, isLoading: ordersLoading } = useGetOrderSummaryQuery();
  const { data: productStats, isLoading: productLoading } = useGetProductStatsQuery();
  const { data: walletData, isLoading: walletLoading } = useGetWalletQuery();

  const totalOrders = orderSummary?.statusCounts?.All || 0;
  const pendingOrders = orderSummary?.statusCounts?.Pending || 0;
  const rejectedOrders = orderSummary?.statusCounts?.Rejected || 0;

  // === Dynamic filtering logic for Orders ===
  const getFilteredOrderData = () => {
    const labels = orderSummary?.monthlyOrders?.labels || [];
    const allData = orderSummary?.monthlyOrders?.datasets || [];

    const dataset = selectedStatus === 'All'
      ? allData.find(d => d.label === 'All')
      : allData.find(d => d.label === selectedStatus);

    if (!dataset) return { labels: [], data: [] };

    if (selectedMonth !== 'All') {
      const index = labels.indexOf(selectedMonth);
      return {
        labels: [labels[index]],
        data: [dataset.data[index]],
      };
    }

    return { labels, data: dataset.data };
  };

  const orderChartData = getFilteredOrderData();

  // === Get bar chart data for selected type ===
  const chartDataMap = {
    Order: orderChartData,
    Product: {
      labels: productStats?.labels || [],
      data: productStats?.data || [],
    },
    Wallet: {
      labels: ['Balance', 'Pending', 'Withdrawn', 'Last Transaction'],
      data: [
        walletData?.balance || 0,
        walletData?.pending || 0,
        walletData?.withdrawn || 0,
        walletData?.lastTransaction || 0,
      ],
    },
  };

  const filteredLabels = chartDataMap[selectedType]?.labels || [];
  const filteredData = chartDataMap[selectedType]?.data || [];

  const barData = {
    labels: filteredLabels,
    datasets: [
      {
        label: `${selectedType} Data`,
        data: filteredData,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const pieData = {
    labels: filteredLabels,
    datasets: [
      {
        label: `${selectedType} Distribution`,
        data: filteredData,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1'],
      },
    ],
  };

  if (ordersLoading || productLoading || walletLoading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <span className="loading loading-spinner text-error loading-lg"></span>
      </div>
    );

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8">Vendor Dashboard</h1>

      {/* Filters */}
      <div className="card bg-white p-6 rounded-xl shadow mb-8 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
        <div className="flex flex-col">
          <label className="mb-1 font-semibold">Select Data Type</label>
          <select
            className="select select-bordered w-48"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedStatus('All');
              setSelectedMonth('All');
            }}
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
                {orderSummary?.monthlyOrders?.labels.map((month) => (
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
          {filteredData.length ? <Bar data={barData} /> : <p>No data available.</p>}
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-2xl font-semibold mb-4">{selectedType} Pie Chart</h2>
          {filteredData.length ? <Pie data={pieData} /> : <p>No data available.</p>}
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboard;
