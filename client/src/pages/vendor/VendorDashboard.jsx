import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
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

const StatCard = ({ 
  title, 
  value, 
  subValue, 
  desValue,
  bgColor = 'bg-blue-50', 
  textColor = 'text-blue-600',
  borderColor = 'border-blue-100',
  navlink 
}) => (
  <Link to={navlink} className="block h-full group">
    <div className={`${bgColor} ${borderColor} p-5 rounded-xl border-2 shadow-xs hover:shadow-md transition-all duration-200 h-full flex flex-col`}>
      <p className={`text-sm font-extrabold ${textColor} mb-1`}>{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && (
        <p className={`text-xs mt-2 font-medium ${textColor} bg-white/50 rounded-full px-2 py-1 self-start`}>
          {desValue}
        </p>
      )}
      
    </div>
  </Link>
);

const SummarySection = () => {
  const cardGroups = [
    {
      title: "Products",
      description: "All active products",
      cards: [
        { 
          title: "Active Products", 
          value: "49", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-purple-50",
          textColor: "text-purple-600",
          borderColor: "border-purple-100",
          navlink: "/products" 
        }
      ]
    },
    {
      title: "Requested Products",
      description: "Total Requested Products",
      cards: [
        { 
          title: "Requested Products", 
          value: "49", 
          subValue: "50",
          desValue:"for more details go to product request",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          borderColor: "border-green-100",
          navlink: "/products" 
        }
      ]
    },
    {
      title: "Sales",
      description: "Total Sales",
      cards: [
        { 
          title: "Total Sales Amount", 
          value: "495253", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-orange-50",
          textColor: "text-orange-600",
          borderColor: "border-orange-100",
          navlink: "/products" 
        }
      ]
    },{
      title: "Dispatch",
      description: "Total Dispatched Products",
      cards: [
        { 
          title: "Dispatched Products", 
          value: "49", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
          borderColor: "border-blue-100",
          navlink: "/products" 
        }
      ]
    },{
      title: "Wallet Details",
      description: "Balance Summary",
      cards: [
        { 
          title: "Current Balance", 
          value: "4923525", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-600",
          borderColor: "border-yellow-100",
          navlink: "/products" 
        }
      ]
    },{
      title: "Created Products",
      description: "Total Created Products",
      cards: [
        { 
          title: "Created Products", 
          value: "49", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-indigo-50",
          textColor: "text-indigo-600",
          borderColor: "border-indigo-100",
          navlink: "/products" 
        }
      ]
    },{
      title: "Bank Transfer",
      description: "Transfer Request",
      cards: [
        { 
          title: "Total Transfer Request", 
          value: "4", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-purple-50",
          textColor: "text-purple-600",
          borderColor: "border-purple-100",
          navlink: "/products" 
        }
      ]
    },{
      title: "Withdrawl Request",
      description: "Total withdrawl Request Created",
      cards: [
        { 
          title: "Total Withdrawl Request", 
          value: "49", 
          subValue: "50",
          desValue:"available stocks",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          borderColor: "border-green-100",
          navlink: "/products" 
        }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Dashboard Overview</h3>
          <p className="text-gray-500 font-bold">Summary of your account activity</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This year</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-10">
        {cardGroups.map((group, index) => (
          <div key={index} className="flex flex-col">
            <div className="mb-2">
              <h4 className="text-lg font-extrabold text-gray-800">{group.title}</h4>
              <p className="text-sm font-bold text-gray-500">{group.description}</p>
            </div>
            {group.cards.map((card, cardIndex) => (
              <StatCard key={cardIndex} {...card} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
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

  // Dynamic filtering logic for Orders
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

  // Get bar chart data for selected type
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
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Vendor Dashboard</h1>
       {/* Filters */}
       <div className="card bg-white p-4 md:p-6 rounded-xl shadow mb-8 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
        <div className="flex flex-col w-full md:w-auto">
          <label className="mb-1 font-semibold">Select Data Type</label>
          <select
            className="select select-bordered w-full md:w-48"
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
            <div className="flex flex-col w-full md:w-auto">
              <label className="mb-1 font-semibold">Filter by Status</label>
              <select
                className="select select-bordered w-full md:w-48"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>

            <div className="flex flex-col w-full md:w-auto">
              <label className="mb-1 font-semibold">Filter by Month</label>
              <select
                className="select select-bordered w-full md:w-48"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option>All</option>
                {orderSummary?.monthlyOrders?.labels?.map((month) => (
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
          className="bg-white rounded-xl shadow p-4 md:p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-4">{selectedType} Bar Chart</h2>
          <div className="h-64 md:h-80">
            {filteredData.length ? <Bar data={barData} options={{ maintainAspectRatio: false }} /> : <p>No data available.</p>}
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow p-4 md:p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-4">{selectedType} Pie Chart</h2>
          <div className="h-64 md:h-80">
            {filteredData.length ? <Pie data={pieData} options={{ maintainAspectRatio: false }} /> : <p>No data available.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboard;