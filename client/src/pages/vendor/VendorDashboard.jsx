import React, { useState } from 'react';
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
  FiUsers, 
  FiFilter, 
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
  FiMoreHorizontal,
  FiRefreshCw
} from 'react-icons/fi';

// Import your API hook
import { useGetDashboardDataQuery } from '../../features/dashboardApi';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

// Modern Stat Card Component with trends
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  navigateTo, 
  loading = false, 
  isCurrency = false,
  trend,
  trendValue,
  duration = "this month"
}) => {
  const navigate = useNavigate();
  
  const formatValue = (val) => {
    if (loading) return '---';
    if (isCurrency) {
      const numValue = typeof val === 'string' ? parseFloat(val.replace('₹', '')) : val;
      return `₹${numValue?.toLocaleString('en-IN') || 0}`;
    }
    return val?.toLocaleString('en-IN') || 0;
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? <FiArrowUp className="text-sm" /> : <FiArrowDown className="text-sm" />;
  };

  return (
    <div 
      className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 relative overflow-hidden"
      onClick={() => navigateTo && navigate(navigateTo)}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatValue(value)}
            </p>
            
            {trend && (
              <div className="flex items-center gap-1">
                <span className={`flex items-center gap-1 text-xs font-medium ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)}
                  {trendValue}%
                </span>
                <span className="text-xs text-gray-500">vs {duration}</span>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`text-xl ${color.replace('text-', 'text-')}`} />
          </div>
        </div>
        
        {/* Progress bar for visual indicator */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full ${color.replace('text-', 'bg-')} transition-all duration-1000`}
            style={{ width: loading ? '50%' : '100%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-2xl p-6 h-32"></div>
      ))}
    </div>
  </div>
);

const VendorDashboard = () => {
  const [period, setPeriod] = useState('today');
  const [activeView, setActiveView] = useState('overview');
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

  // Quick Stats with mock trend data (replace with actual data when available)
  const quickStats = [
    {
      title: "Active Products",
      value: dashboardData?.product?.active_product || 0,
      icon: FiPackage,
      color: "text-green-600",
      navigateTo: "/vendor/products",
      loading: isLoading,
      trend: "up",
      trendValue: 12
    },
    {
      title: `${getDisplayPeriod(period)} Total Revenue`,
      value: dashboardData?.other?.total_sales || 0,
      icon: FiDollarSign,
      color: "text-blue-600",
      navigateTo: "/vendor/sales-report",
      loading: isLoading,
      isCurrency: true,
      trend: "up",
      trendValue: 8
    },
    {
      title: "Pending Orders",
      value: dashboardData?.order?.pending || 0,
      icon: FiShoppingCart,
      color: "text-orange-600",
      navigateTo: "/vendor/my-sales",
      loading: isLoading,
      trend: "down",
      trendValue: 5
    },
    {
      title: "Wallet Balance",
      value: dashboardData?.wallet?.current_balance || 0,
      icon: FiCreditCard,
      color: "text-purple-600",
      navigateTo: "/vendor/my-wallet",
      loading: isLoading,
      isCurrency: true,
      trend: "up",
      trendValue: 15
    }
  ];

  // Secondary Stats
  const secondaryStats = [
    {
      title: "Total Products",
      value: dashboardData?.product?.total_product || 0,
      icon: FiPackage,
      color: "text-indigo-600",
      navigateTo: "/vendor/products",
      loading: isLoading
    },
    {
      title: "Published",
      value: dashboardData?.product?.published || 0,
      icon: FiPackage,
      color: "text-emerald-600",
      navigateTo: "/vendor/requested-products",
      loading: isLoading
    },
    {
      title: "In Draft",
      value: dashboardData?.product?.draft || 0,
      icon: FiPackage,
      color: "text-amber-600",
      navigateTo: "/vendor/requested-products",
      loading: isLoading
    },
    {
      title: "Approved Orders",
      value: dashboardData?.order?.approved || 0,
      icon: FiShoppingCart,
      color: "text-cyan-600",
      navigateTo: "/vendor/my-sales",
      loading: isLoading
    }
  ];

  // Chart data configurations
  const salesTrendData = {
    labels: dashboardData?.sales_summary?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales (₹)',
        data: dashboardData?.sales_summary?.amounts || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const productDistributionData = {
    labels: ['Active', 'Published', 'Draft', 'Inactive'],
    datasets: [
      {
        data: [
          dashboardData?.product?.active_product || 0,
          dashboardData?.product?.published || 0,
          dashboardData?.product?.draft || 0,
          dashboardData?.product?.inactive_product || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0,
        hoverOffset: 12
      }
    ]
  };

  const orderStatusData = {
    labels: ['Pending', 'Approved', 'Delivered'],
    datasets: [
      {
        data: [
          dashboardData?.order?.pending || 0,
          dashboardData?.order?.approved || 0,
          dashboardData?.order?.delivered || 0
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderWidth: 0,
        hoverOffset: 12
      }
    ]
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-200 max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiDollarSign className="text-3xl text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">We couldn't load your dashboard data. Please try again later.</p>
          <button 
            onClick={refetch}
            className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw className="text-lg" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Vendor Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-base flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {dashboardData?.date_range ? (
                  `Data for ${getDisplayPeriod(period)} • ${new Date(dashboardData.date_range.start).toLocaleDateString()} to ${new Date(dashboardData.date_range.end).toLocaleDateString()}`
                ) : (
                  'Manage your products and track your business performance'
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             
            

              {/* Period Selector */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <select 
                  className="appearance-none  border border-gray-300 rounded-xl pl-10 pr-8 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400 w-full sm:w-40 cursor-pointer"
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

              {/* Refresh Button */}
              <button
                onClick={refetch}
                disabled={isLoading}
                className="bg-white border cursor-pointer  border-gray-300 rounded-xl p-2.5 hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {quickStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {secondaryStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Sales Trend Chart */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Sales Trend</h3>
                    <p className="text-gray-600 text-sm mt-1">Revenue overview for {getDisplayPeriod(period).toLowerCase()}</p>
                  </div>
                  <button 
                    className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                    onClick={() => navigate('/vendor/sales-report')}
                  >
                    View Report
                    <FiTrendingUp className="text-sm group-hover:translate-x-0.5 transition-transform" />
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

              {/* Product Distribution */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Product Distribution</h3>
                    <p className="text-gray-600 text-sm mt-1">Status overview of your products</p>
                  </div>
                  <button 
                    className="bg-gradient-to-r cursor-pointer from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                    onClick={() => navigate('/vendor/products')}
                  >
                    Manage
                    <FiPackage className="text-sm group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="h-80">
                  <Doughnut 
                    data={productDistributionData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      cutout: '60%',
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                              size: 12
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Additional Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Order Status */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Order Status</h3>
                    <p className="text-gray-600 text-sm mt-1">Current order distribution</p>
                  </div>
                  <button 
                    className="bg-gradient-to-r cursor-pointer from-orange-600 to-amber-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                    onClick={() => navigate('/vendor/my-sales')}
                  >
                    View Orders
                    <FiShoppingCart className="text-sm group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="h-64">
                  <Pie 
                    data={orderStatusData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                              size: 11
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                    <p className="text-gray-600 text-sm mt-1">Latest transactions and updates</p>
                  </div>
                  <button 
                    className="bg-gradient-to-r cursor-pointer from-gray-600 to-slate-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
                    onClick={() => navigate('/vendor/my-wallet')}
                  >
                    View All
                    <FiUsers className="text-sm group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dashboardData?.recent?.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          activity.transaction_type === 'DEBIT' ? 'bg-blue-100 text-blue-600' :
                          activity.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {activity.transaction_type === 'DEBIT' ? <FiShoppingCart /> : <FiCreditCard />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
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
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {activity.transaction_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;