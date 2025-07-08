import React, { useState } from 'react';
import { useGetDashboardDataQuery } from '../../features/dashboardApi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import StatCard from '../StatCard';
import { FiFilter, FiCalendar, FiTrendingUp } from 'react-icons/fi';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const VendorDashboard = () => {
  const [timeRange, setTimeRange] = useState(0);
  const [activeFilter, setActiveFilter] = useState('products'); // Changed default to 'products'
  const { data, isLoading, isError } = useGetDashboardDataQuery(timeRange);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  
  if (isError) return (
    <div className="alert alert-error shadow-lg max-w-md mx-auto mt-8">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Error loading dashboard data</span>
      </div>
    </div>
  );

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
          labels: ['Total', 'Active', 'Requested', 'In Active'],
          data: [
            data.products.total,
            data.products.active,
            data.products.draft,
            data.products.inactive
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
      navlink: "/vendor/products"
    },
    {
      title: "In-Active Products",
      value: data.products.inactive,
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      borderColor: "border-red-100",
      navlink: "/vendor/products"
    },
    {
      title: "Published Products",
      value: data.products.published,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-100",
      navlink: "/vendor/products"
    },
    {
      title: "Requested Products(Draft)",
      value: data.products.draft,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-100",
      navlink: "/vendor/products"
    },
    {
      title: "Wallet Balance",
      value: `₹${data.wallet.balance}`,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-100",
      navlink: "/vendor/wallet"
    },
    {
      title: "Topup Requests",
      value: data.products.active,
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
      borderColor: "border-rose-100",
      navlink: "/vendor/my-topup"
    },
    {
      title: "Total Sales",
      value: `₹${data.wallet.total_sales}`,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      borderColor: "border-indigo-100",
      navlink: "/vendor/wallet"
    },
    {
      title: "Bank Transfer Requests",
      value: `₹${data.wallet.total_withdrawals}`,
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-600",
      borderColor: "border-cyan-100",
      navlink: "/vendor/my-withdrawl"
    },
  ];

  const filterOptions = [
    { value: 'products', label: 'Products' },
    { value: 'orders', label: 'Orders' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'all', label: 'All Data' },
  ];

  // Get data based on active filter
  const getFilteredChartData = () => {
    if (activeFilter === 'all') {
      return {
        orders: processChartData('orders'),
        products: processChartData('products'),
        wallet: processChartData('wallet')
      };
    }
    return {
      [activeFilter]: processChartData(activeFilter)
    };
  };

  const filteredData = getFilteredChartData();

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Header with filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Vendor Dashboard</h1>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <FiTrendingUp className="text-primary" />
              <span>Overview of your business performance</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select 
                className="select select-bordered pl-10 w-full cursor-pointer"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
              <select 
                className="select select-bordered pl-10 w-full cursor-pointer"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value={0}>Today</option>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 3 Months</option>
                <option value={365}>Last Year</option>
              </select>
            </div>
          </div>
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
          {/* Orders Chart - only show if activeFilter is 'orders' or 'all' */}
          {(activeFilter === 'orders' || activeFilter === 'all') && (
            <motion.div
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Orders Overview</h2>
                <div className="flex gap-2">
                  <button className="btn btn-xs btn-outline">Daily</button>
                  <button className="btn btn-xs btn-outline btn-active">Weekly</button>
                  <button className="btn btn-xs btn-outline">Monthly</button>
                </div>
              </div>
              <div className="h-64">
                <Bar
                  data={{
                    labels: filteredData.orders?.labels || [],
                    datasets: [{
                      label: 'Orders',
                      data: filteredData.orders?.data || [],
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(244, 63, 94, 0.7)'
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(244, 63, 94, 1)'
                      ],
                      borderWidth: 1,
                      borderRadius: 6
                    }]
                  }}
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          drawBorder: false
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Products Chart - only show if activeFilter is 'products' or 'all' */}
          {(activeFilter === 'products' || activeFilter === 'all') && (
            <motion.div
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">Products Analysis</h2>
              <div className="h-64">
                <Pie
                  data={{
                    labels: filteredData.products?.labels || [],
                    datasets: [{
                      data: filteredData.products?.data || [],
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(244, 63, 94, 0.7)'
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(244, 63, 94, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Wallet Chart - only show if activeFilter is 'wallet' or 'all' */}
          {(activeFilter === 'wallet' || activeFilter === 'all') && (
            <motion.div
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Wallet Overview</h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: filteredData.wallet?.labels || [],
                    datasets: [{
                      label: 'Wallet',
                      data: filteredData.wallet?.data || [],
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(244, 63, 94, 0.7)'
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(244, 63, 94, 1)'
                      ],
                      borderWidth: 1,
                      borderRadius: 6
                    }]
                  }}
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          drawBorder: false
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;