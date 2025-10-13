import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
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
  FiRefreshCw,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
  FiMoreHorizontal
} from 'react-icons/fi';

// Import your API hook
import { useGetDashboardDataQuery } from '../../features/dashboardApi';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

// Enhanced Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  navigateTo, 
  loading = false, 
  isCurrency = false,
  trend,
  subtitle 
}) => {
  const navigate = useNavigate();
  
  const formatValue = (val) => {
    if (loading) return '--';
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
      {/* Background accent */}
      <div className={`absolute top-0 left-0 w-1 h-full ${color.replace('text-', 'bg-')}`}></div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              {trend > 0 ? <FiArrowUp className="text-green-500" /> : 
               trend < 0 ? <FiArrowDown className="text-red-500" /> : null}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-2xl">
          <FiRefreshCw className="animate-spin text-blue-500 text-xl" />
        </div>
      )}
    </div>
  );
};

// Skeleton Loader Component
const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-7 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="p-3 rounded-xl bg-gray-200">
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

// Chart Container Component
const ChartContainer = ({ title, subtitle, action, children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-lg transition-all duration-300 ${className}`}>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button 
          className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl transition-colors duration-200 text-sm font-medium flex items-center gap-2 border border-gray-200"
          onClick={action.onClick}
        >
          {action.icon && <action.icon className="text-sm" />}
          {action.label}
        </button>
      )}
    </div>
    {children}
  </div>
);

const ResellerDashboard = () => {
  const [period, setPeriod] = useState('today');
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
      title: "Wallet Balance",
      value: dashboardData?.wallet?.current_balance || 0,
      icon: FiCreditCard,
      color: "text-blue-600",
      navigateTo: "/reseller/wallet",
      loading: isLoading,
      isCurrency: true,
      subtitle: "Available funds"
    },
    {
      title: "Commission Balance",
      value: dashboardData?.wallet?.commission_balance || 0,
      icon: FiTrendingUp,
      color: "text-green-600",
      navigateTo: "/reseller/wallet",
      loading: isLoading,
      isCurrency: true,
      subtitle: "Earned commissions"
    },
    {
      title: `${getDisplayPeriod(period)} Sales`,
      value: dashboardData?.other?.total_sales || 0,
      icon: FiDollarSign,
      color: "text-purple-600",
      navigateTo: "/reseller/customer-purchases",
      loading: isLoading,
      isCurrency: true,
      subtitle: "Total revenue"
    },
    {
      title: `${getDisplayPeriod(period)} Orders`,
      value: dashboardData?.order?.total_orders || 0,
      icon: FiShoppingCart,
      color: "text-orange-600",
      navigateTo: "/reseller/customer-purchases",
      loading: isLoading,
      subtitle: "Customer orders"
    }
  ];

  // Secondary Stats
  const secondaryStats = [
    {
      title: "Total Products",
      value: dashboardData?.product?.total_product || 0,
      icon: FiPackage,
      color: "text-indigo-600",
      navigateTo: "/reseller/my-stocks",
      loading: isLoading,
      subtitle: "In catalog"
    },
    {
      title: "Active Products", 
      value: dashboardData?.product?.active_product || 0,
      icon: FiPackage,
      color: "text-green-600",
      navigateTo: "/reseller/my-stocks",
      loading: isLoading,
      subtitle: "Available for sale"
    },
    {
      title: "Pending Orders",
      value: dashboardData?.order?.pending || 0,
      icon: FiShoppingCart,
      color: "text-yellow-600",
      navigateTo: "/reseller/my-orders",
      loading: isLoading,
      subtitle: "Awaiting processing"
    },
    {
      title: "Delivered Orders",
      value: dashboardData?.order?.delivered || 0,
      icon: FiShoppingCart,
      color: "text-teal-600",
      navigateTo: "/reseller/my-orders",
      loading: isLoading,
      subtitle: "Completed"
    }
  ];

  // Chart data configurations
  const ordersChartData = {
    labels: ['Pending', 'Processing', 'Delivered'],
    datasets: [
      {
        data: [
          dashboardData?.order?.pending || 0,
          dashboardData?.order?.dispatching || 0,
          dashboardData?.order?.delivered || 0
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.9)',
          'rgba(59, 130, 246, 0.9)',
          'rgba(16, 185, 129, 0.9)'
        ],
        borderWidth: 0,
        hoverOffset: 12
      }
    ]
  };

  const salesChartData = {
    labels: dashboardData?.sales_summary?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales (₹)',
        data: dashboardData?.sales_summary?.amounts || [12000, 19000, 15000, 25000, 22000, 30000, 28000],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      }
    }
  };

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
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/60">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                {isLoading && (
                  <FiRefreshCw className="animate-spin text-blue-500" />
                )}
              </div>
              <p className="text-gray-600 text-sm">
                {dashboardData?.date_range ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {getDisplayPeriod(period)} • {new Date(dashboardData.date_range.start).toLocaleDateString()} - {new Date(dashboardData.date_range.end).toLocaleDateString()}
                  </span>
                ) : (
                  'Welcome back! Here\'s your business overview.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                <select 
                  className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-xs transition-all duration-200 hover:border-gray-400 appearance-none"
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
              <button 
                onClick={refetch}
                disabled={isLoading}
                className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                <FiRefreshCw className={`text-gray-600 text-lg ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => <StatCardSkeleton key={index} />)
          ) : (
            quickStats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))
          )}
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => <StatCardSkeleton key={index} />)
          ) : (
            secondaryStats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend Chart */}
          <ChartContainer
            title="Sales Trend"
            subtitle="Revenue overview for the current period"
            action={{
              label: "View Report",
              icon: FiTrendingUp,
              onClick: () => navigate('/reseller/customer-purchases')
            }}
          >
            <div className="h-72">
              <Line 
                data={salesChartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { display: false },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      callbacks: {
                        label: (context) => `₹${context.parsed.y.toLocaleString('en-IN')}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { drawBorder: false },
                      ticks: {
                        callback: (value) => `₹${value.toLocaleString('en-IN')}`
                      }
                    },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>
          </ChartContainer>

          {/* Orders Distribution */}
          <ChartContainer
            title="Orders Distribution"
            subtitle="Current order status breakdown"
            action={{
              label: "View All",
              icon: FiShoppingCart,
              onClick: () => navigate('/reseller/my-order-request')
            }}
          >
            <div className="h-72">
              <Doughnut 
                data={ordersChartData}
                options={{
                  ...chartOptions,
                  cutout: '60%',
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12
                    }
                  }
                }}
              />
            </div>
          </ChartContainer>
        </div>

        {/* Recent Activity */}
        <ChartContainer
          title="Recent Activity"
          subtitle="Latest wallet transactions and updates"
          action={{
            label: "View All",
            icon: FiUsers,
            onClick: () => navigate('/reseller/my-wallet')
          }}
        >
          <div className="space-y-3">
            {dashboardData?.recent?.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${
                    activity.transaction_type === 'DEBIT' ? 'bg-blue-100 text-blue-600' :
                    activity.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.transaction_type === 'DEBIT' ? <FiCreditCard /> :
                     activity.transaction_type === 'CREDIT' ? <FiTrendingUp /> :
                     <FiPackage />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.created_at}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    activity.transaction_type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {activity.transaction_type === 'DEBIT' ? '-' : '+'}₹{activity.amount}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.transaction_type === 'DEBIT' ? 'bg-red-100 text-red-800' :
                    activity.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {activity.transaction_type}
                  </span>
                </div>
              </div>
            ))}
            
            {(!dashboardData?.recent || dashboardData.recent.length === 0) && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <FiCreditCard className="text-3xl mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
            
            {isLoading && (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 animate-pulse">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
};

export default ResellerDashboard;