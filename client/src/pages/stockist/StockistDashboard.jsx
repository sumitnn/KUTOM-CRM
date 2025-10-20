import React, { useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
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
  FiFilter, 
  FiCalendar,
  FiRefreshCw,
  FiAlertCircle,
  FiChevronRight
} from 'react-icons/fi';

// Import your API hook
import { useGetDashboardDataQuery } from '../../features/dashboardApi';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

// Enhanced Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, navigateTo, loading = false, isCurrency = false, trend }) => {
  const navigate = useNavigate();
  
  const formatValue = (val) => {
    if (loading) return '---';
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
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatValue(value)}
          </p>
          {trend && (
            <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              trend.value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`text-2xl ${color.replace('text-', 'text-')}`} />
        </div>
      </div>
      
      {/* Bottom accent border */}
      <div className={`absolute bottom-0 left-0 w-0 group-hover:w-full h-1 ${color.replace('text-', 'bg-')} transition-all duration-300`}></div>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <div className="max-w-8xl mx-auto">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StockistDashboard = () => {
  const [period, setPeriod] = useState('today');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // Fetch data from API
  const { data: dashboardData, isLoading, error, refetch } = useGetDashboardDataQuery(period);

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
      title: "Current Wallet Balance",
      value: dashboardData?.wallet?.current_balance || 0,
      icon: FiCreditCard,
      color: "text-blue-600",
      navigateTo: "/stockist/my-wallet",
      loading: isLoading,
      isCurrency: true,
      trend: { value: 12, label: 'vs last month' }
    },
    {
      title: "Current Payout Balance",
      value: dashboardData?.wallet?.commission_balance || 0,
      icon: FiCreditCard,
      color: "text-green-600",
      navigateTo: "/stockist/my-wallet",
      loading: isLoading,
      isCurrency: true,
      trend: { value: 8, label: 'vs last month' }
    },
    {
      title: `${getDisplayPeriod(period)} Sales`,
      value: dashboardData?.other?.total_sales || 0,
      icon: FiDollarSign,
      color: "text-purple-600",
      navigateTo: "/stockist/sales-report",
      loading: isLoading,
      isCurrency: true,
      trend: { value: 15, label: 'vs last period' }
    },
    {
      title: "Total Products in Inventory",
      value: dashboardData?.product?.total_product || 0,
      icon: FiPackage,
      color: "text-indigo-600",
      navigateTo: "/stockist/my-stocks",
      loading: isLoading,
      trend: { value: 5, label: 'new this week' }
    },
  ];

  // Order & Financial Stats
  const orderFinancialStats = [
    {
      title: `${getDisplayPeriod(period)} Pending Orders`,
      value: dashboardData?.order?.pending || 0,
      icon: FiShoppingCart,
      color: "text-yellow-600",
      navigateTo: "/stockist/reseller-order-request",
      loading: isLoading
    },
    {
      title: `${getDisplayPeriod(period)} Approved Orders`,
      value: dashboardData?.order?.approved || 0,
      icon: FiShoppingCart,
      color: "text-green-600",
      navigateTo: "/stockist/reseller-order-request",
      loading: isLoading
    },
    {
      title: `${getDisplayPeriod(period)} Bank Transfer Requests`,
      value: dashboardData?.other?.total_withdrawals || 0,
      icon: FiDollarSign,
      color: "text-cyan-600",
      navigateTo: "/stockist/my-withdrawl-history",
      loading: isLoading,
      isCurrency: true
    },
    {
      title: `${getDisplayPeriod(period)} Topup Requests`,
      value: dashboardData?.other?.total_topup || 0,
      icon: FiDollarSign,
      color: "text-orange-600",
      navigateTo: "/stockist/my-topup-request",
      loading: isLoading,
      isCurrency: true
    }
  ];

  // Chart data configurations
  const salesTrendData = {
    labels: dashboardData?.sales_summary?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales (₹)',
        data: dashboardData?.sales_summary?.amounts || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const ordersChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [
          dashboardData?.order?.pending || 0,
          dashboardData?.order?.approved || 0,
          dashboardData?.order?.rejected || 0
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.9)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(239, 68, 68, 0.9)'
        ],
        borderWidth: 0,
        hoverOffset: 12,
        borderRadius: 6
      }
    ]
  };

  const walletChartData = {
    labels: ['Current Balance', 'Total Sales', 'Total Withdrawals'],
    datasets: [
      {
        data: [
          dashboardData?.wallet?.current_balance || 0,
          dashboardData?.other?.total_sales || 0,
          dashboardData?.other?.total_withdrawals || 0
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.9)',
          'rgba(139, 92, 246, 0.9)',
          'rgba(6, 182, 212, 0.9)'
        ],
        borderWidth: 0,
        hoverOffset: 12,
        borderRadius: 6
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
            <FiAlertCircle className="text-2xl text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">We couldn't load your dashboard data. Please try again later.</p>
          <button 
            onClick={refetch}
            className="bg-red-600 cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2 w-full"
          >
            <FiRefreshCw className="text-sm" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200/60 shadow-xs">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stockist Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-base flex items-center gap-2">
                {dashboardData?.date_range ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Data for {getDisplayPeriod(period)} • {new Date(dashboardData.date_range.start).toLocaleDateString()} to {new Date(dashboardData.date_range.end).toLocaleDateString()}
                  </>
                ) : (
                  'Manage your products and track your business performance'
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <select 
                  className="appearance-none border border-gray-300 rounded-xl pl-10 pr-8 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-xs transition-all duration-200 hover:border-gray-400 w-full sm:w-48 cursor-pointer"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="weekly">This Week</option>
                  <option value="monthly">This Month</option>
                  <option value="yearly">This Year</option>
                </select>
              </div>
              
              <button 
                onClick={refetch}
                className="bg-white border cursor-pointer border-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-xs"
              >
                <FiRefreshCw className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Order & Financial Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {orderFinancialStats.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiTrendingUp className="text-purple-600" />
                  Sales Trend
                </h3>
                <p className="text-gray-600 text-sm mt-1">Revenue overview for {getDisplayPeriod(period).toLowerCase()}</p>
              </div>
              <button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                onClick={() => navigate('/stockist/sales-report')}
              >
                View Report
                <FiChevronRight className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
            <div className="h-80">
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
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#1f2937',
                      bodyColor: '#374151',
                      borderColor: '#e5e7eb',
                      borderWidth: 1,
                      titleFont: { size: 12, weight: '600' },
                      bodyFont: { size: 14 },
                      padding: 12,
                      boxPadding: 6,
                      usePointStyle: true,
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
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString('en-IN');
                        },
                        font: {
                          size: 11
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          size: 11
                        }
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

          {/* Orders Distribution Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiShoppingCart className="text-green-600" />
                  Orders Distribution
                </h3>
                <p className="text-gray-600 text-sm mt-1">Current order status breakdown</p>
              </div>
              <button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                onClick={() => navigate('/stockist/reseller-order-request')}
              >
                View Orders
                <FiChevronRight className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
            <div className="h-80">
              <Pie 
                data={ordersChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12
                        },
                        color: '#374151'
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#1f2937',
                      bodyColor: '#374151',
                      borderColor: '#e5e7eb',
                      borderWidth: 1,
                      padding: 12,
                      bodyFont: {
                        size: 14
                      },
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${context.parsed}`;
                        }
                      }
                    }
                  },
                  cutout: '0%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Wallet Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiCreditCard className="text-blue-600" />
                  Wallet Distribution
                </h3>
                <p className="text-gray-600 text-sm mt-1">Financial breakdown</p>
              </div>
              <button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                onClick={() => navigate('/stockist/my-wallet')}
              >
                View Wallet
                <FiChevronRight className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
            <div className="h-80">
              <Pie 
                data={walletChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12
                        },
                        color: '#374151'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ₹${context.parsed.toLocaleString('en-IN')}`;
                        }
                      },
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#1f2937',
                      bodyColor: '#374151',
                      borderColor: '#e5e7eb',
                      borderWidth: 1,
                      padding: 12,
                      bodyFont: {
                        size: 14
                      }
                    }
                  },
                  cutout: '0%'
                }}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FiUsers className="text-orange-600" />
                  Recent Activity
                </h3>
                <p className="text-gray-600 text-sm mt-1">Latest transactions and updates</p>
              </div>
              <button 
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                onClick={() => navigate('/stockist/my-wallet')}
              >
                View All
                <FiChevronRight className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dashboardData?.recent?.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      activity.transaction_type === 'DEBIT' ? 'bg-blue-100 text-blue-600' :
                      activity.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-600' :
                      activity.type === 'wallet' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    } group-hover:scale-110 transition-transform duration-200`}>
                      {activity.transaction_type === 'DEBIT' && <FiShoppingCart className="text-lg" />}
                      {activity.transaction_type === 'CREDIT' && <FiCreditCard className="text-lg" />}
                      {activity.type === 'wallet' && <FiCreditCard className="text-lg" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.created_at}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      activity.transaction_type === "CREDIT" ? "text-green-600" : "text-red-600"
                    }`}>
                      {activity.transaction_type === "CREDIT" ? `+₹${activity.amount}` : `-₹${activity.amount}`}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockistDashboard;