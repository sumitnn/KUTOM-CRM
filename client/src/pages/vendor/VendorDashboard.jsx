// components/Dashboard/DynamicDashboard.jsx
import React, { useState } from 'react';
import { useGetDashboardDataQuery } from '../../features/dashboardApi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import StatCard from '../StatCard';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const VendorDashboard = () => {
  const [timeRange, setTimeRange] = useState(0);
  const { data, isLoading, isError } = useGetDashboardDataQuery(timeRange);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  // Process data for charts
  const processChartData = (type) => {
    switch (type) {
      case 'orders':
        return {
          labels: ['Pending', 'Approved', 'Rejected'],
          data: [
            data.orders.pending,
            data.orders.approved,
            data.orders.rejected
          ]
        };
      case 'products':
        return {
          labels: ['Total', 'Active', 'Requested', 'Dispatched'],
          data: [
            data.products.total,
            data.products.active,
            data.products.requested,
            data.products.dispatched
          ]
        };
      case 'wallet':
        return {
          labels: ['Balance', 'Sales', 'Withdrawals', 'Last Transaction'],
          data: [
            data.wallet.balance,
            data.wallet.total_sales,
            data.wallet.total_withdrawals,
            data.wallet.last_transaction
          ]
        };
      default:
        return { labels: [], data: [] };
    }
  };

  const cardData = [
    {
      title: "Active Products",
      value: data.products.active,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      borderColor: "border-purple-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },
    {
      title: "Requested Products",
      value: data.products.requested,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/products"
    },

  ];

  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Vendor Dashboard</h1>
        <select 
          className="select select-bordered"
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}

        >
          <option value={0}>Today</option>
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 3 Months</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cardData.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4">Orders Overview</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: processChartData('orders').labels,
                datasets: [{
                  label: 'Orders',
                  data: processChartData('orders').data,
                  backgroundColor: '#3b82f6'
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">Products Distribution</h2>
          <div className="h-64">
            <Pie
              data={{
                labels: processChartData('products').labels,
                datasets: [{
                  data: processChartData('products').data,
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e']
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboard;