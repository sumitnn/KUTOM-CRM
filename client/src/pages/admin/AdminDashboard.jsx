import React, { useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiPackage, 
  FiShoppingCart, 
  FiCreditCard, 
  FiArchive, 
  FiUsers, 
  FiCalendar,
  FiRefreshCw,
  FiActivity,
  FiBox,
  FiShoppingBag
} from 'react-icons/fi';

// Import your API hook
import { useGetADMINDashboardDataQuery } from '../../features/dashboardApi';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

// Enhanced Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, navigateTo, loading = false, isCurrency = false, trend }) => {
  const navigate = useNavigate();
  
  const formatValue = (val) => {
    if (loading) return 'Loading...';
    if (isCurrency) {
      const numValue = typeof val === 'string' ? parseFloat(val.replace('₹', '')) : val;
      return `₹${numValue?.toLocaleString('en-IN') || 0}`;
    }
    return val?.toLocaleString('en-IN') || 0;
  };

  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-200 hover:translate-y-[-4px] relative overflow-hidden"
      onClick={() => navigateTo && navigate(navigateTo)}
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
            {title}
            {trend && (
              <span className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatValue(value)}
          </p>
          {loading && (
            <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`text-2xl ${color.replace('text-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-xs animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-xs animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-xs animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [period, setPeriod] = useState('today');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // Fetch data from API
  const { data: dashboardData, isLoading, error, refetch } = useGetADMINDashboardDataQuery(period);

  // Format period for display
  const getDisplayPeriod = (period) => {
    const periodMap = {
      'today': 'Today',
      'weekly': 'This Week', 
      'monthly': 'This Month',
      'yearly': 'This Year'
    };
    return periodMap[period] || 'Today';
  };

  // Quick Stats Cards
  const quickStats = [
    {
      title: "Active Products",
      value: dashboardData?.product?.active_product || 0,
      icon: FiPackage,
      color: "text-green-600",
      navigateTo: "/my-products",
      loading: isLoading,
      trend: dashboardData?.product?.active_product || 0
    },
    {
      title: "Inactive Products",
      value: dashboardData?.product?.inactive_product || 0,
      icon: FiPackage,
      color: "text-red-600",
      navigateTo: "/my-products",
      loading: isLoading,
      trend: -5
    },
    {
      title: `${getDisplayPeriod(period)} Sales`,
      value: dashboardData?.other?.total_sales || 0,
      icon: FiDollarSign,
      color: "text-purple-600",
      navigateTo: "#",
      loading: isLoading,
      isCurrency: true,
      trend: 10
    },
    {
      title: "Current Wallet Balance",
      value: dashboardData?.wallet?.current_balance || 0,
      icon: FiCreditCard,
      color: "text-blue-600",
      navigateTo: "/my-wallet",
      loading: isLoading,
      isCurrency: true,
      trend: 8
    }
  ];

  // Product Stats Cards
  const productStats = [
    {
      title: `${getDisplayPeriod(period)} Topup-request (Approved)`,
      value: dashboardData?.other?.total_topup || 0,
      icon: FiBox,
      color: "text-indigo-600",
      navigateTo: "/topup",
      loading: isLoading
    },
    {
      title:  `${getDisplayPeriod(period)} Withdrawal-request (Approved)`,
      value: dashboardData?.other?.total_withdrawals || 0,
      icon: FiActivity,
      color: "text-yellow-600",
      navigateTo: "/withdrawal-request",
      loading: isLoading
    },
    {
      title: `Product-Approval-Request (In-Draft)`,
      value: dashboardData?.product?.draft || 0,
      icon: FiArchive,
      color: "text-orange-600",
      navigateTo: "/admin/product-requests",
      loading: isLoading
    },
    {
      title: `Product-Approval-Request (Published)`,
      value: dashboardData?.product?.published || 0,
      icon: FiShoppingBag,
      color: "text-cyan-600",
      navigateTo: "/admin/product-requests",
      loading: isLoading
    }
  ];

  // Chart data configurations
  const salesTrendData = {
    labels: dashboardData?.sales_summary?.days ,
    datasets: [
      {
        label: 'Sales (₹)',
        data: dashboardData?.sales_summary?.amounts ,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const productsChartData = {
    labels: ['Active', 'Inactive', 'Published', 'Draft'],
    datasets: [
      {
        data: [
          dashboardData?.product?.active_product || 0,
          dashboardData?.product?.inactive_product || 0,
          dashboardData?.product?.published || 0,
          dashboardData?.product?.draft || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderWidth: 0,
        hoverOffset: 8
      }
    ]
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiDollarSign className="text-2xl text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">We couldn't load your dashboard data. Please try again later.</p>
          <button 
            onClick={refetch}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw className="text-sm" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FiActivity className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {dashboardData?.date_range ? (
                      `Data for ${getDisplayPeriod(period)} • ${new Date(dashboardData.date_range.start).toLocaleDateString()} to ${new Date(dashboardData.date_range.end).toLocaleDateString()}`
                    ) : (
                      'Manage your products and track your business performance'
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Refresh Button */}
              <button
                onClick={refetch}
                disabled={isLoading}
                className="flex cursor-pointer items-center gap-2 px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                <FiRefreshCw className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Period Selector */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <select 
                  className="border cursor-pointer border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-xs transition-all duration-200 hover:border-gray-300 w-full sm:w-40 appearance-none"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="today">Today</option>
                  <option value="weekly">This Week</option>
                  <option value="monthly">This Month</option>
                  <option value="yearly">This Year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quickStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {productStats.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Sales Trend</h3>
                <p className="text-gray-600 text-sm mt-1">Revenue overview for {getDisplayPeriod(period).toLowerCase()}</p>
              </div>
              
            </div>
            <div className="h-64 sm:h-80">
              <Line 
                data={salesTrendData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { size: 12 },
                      bodyFont: { size: 14 },
                      padding: 12,
                      callbacks: {
                        label: function(context) {
                          return `₹${context.parsed.y.toLocaleString('en-IN')}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        drawBorder: false
                      },
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString('en-IN');
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'nearest'
                  }
                }}
              />
            </div>
          </div>

          {/* Products Overview Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Products Overview</h3>
                <p className="text-gray-600 text-sm mt-1">Product status distribution</p>
              </div>
              <button 
                className="bg-indigo-600 text-white px-4 cursor-pointer py-2 rounded-xl hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={() => navigate('/my-products')}
              >
                Manage
                <FiPackage className="text-sm" />
              </button>
            </div>
            <div className="h-64 sm:h-80">
              <Pie 
                data={productsChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: window.innerWidth < 640 ? 'bottom' : 'right',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                          size: window.innerWidth < 640 ? 10 : 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 10,
                      bodyFont: {
                        size: 12
                      }
                    }
                  },
                  cutout: '0%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h3>
              <p className="text-gray-600 text-sm mt-1">Latest orders and transactions</p>
            </div>
            <button 
              className="bg-gray-600 text-white cursor-pointer px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors duration-200 text-sm font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
              onClick={() => navigate('/my-wallet')}
            >
              View All
              <FiUsers className="text-sm" />
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardData?.recent?.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    activity.transaction_type === 'DEBIT' ? 'bg-blue-100 text-blue-600' :
                    activity.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-600' :
                    activity.type === 'wallet' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {activity.transaction_type === 'DEBIT' && <FiShoppingCart className="text-lg" />}
                    {activity.transaction_type === 'CREDIT' && <FiCreditCard className="text-lg" />}
                    {activity.type === 'wallet' && <FiCreditCard className="text-lg" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.created_at}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={`text-sm font-semibold ${
                    activity.transaction_type === "CREDIT" ? "text-green-600" : "text-red-600"
                  }`}>
                    {activity.transaction_type === "CREDIT"
                      ? `+₹${activity.amount}`
                      : `-₹${activity.amount}`}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.transaction_type === 'DEBIT' ? 'bg-blue-100 text-blue-800' :
                    activity.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-800' :
                    activity.type === 'wallet' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {activity.transaction_type}
                  </span>
                </div>
              </div>
            ))}
            
            {(!dashboardData?.recent || dashboardData.recent.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <FiActivity className="text-3xl mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;