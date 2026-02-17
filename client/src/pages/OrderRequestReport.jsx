import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  useGetOrderRequestsReportQuery, 
  useExportOrderRequestsMutation 
} from "../features/order/orderRequest";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { saveAs } from 'file-saver';

const OrderRequestReport = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(today, 2), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd')
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rangeFilter, setRangeFilter] = useState('last_3_days');
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState('approved');

  const { data: orderRequestsData, isLoading, isError, refetch } = useGetOrderRequestsReportQuery({
    range: rangeFilter,
    search: searchTerm,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    status: statusFilter
  });

  const [exportOrderRequests] = useExportOrderRequestsMutation();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'dd MMM yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusDisplay = (status) => {
    const displays = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled'
    };
    return displays[status] || status;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setRangeFilter('custom');
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleRangeFilterChange = (range) => {
    setRangeFilter(range);
    setCurrentPage(1);
    
    const today = new Date();
    switch(range) {
      case 'today':
        setDateRange({
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      case 'last_3_days':
        setDateRange({
          startDate: format(subDays(today, 2), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      case 'this_week':
        setDateRange({
          startDate: format(subDays(today, 6), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      case 'last_month':
        setDateRange({
          startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        });
        break;
      default:
        break;
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const response = await exportOrderRequests({
        range: rangeFilter,
        search: searchTerm,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        status: statusFilter
      }).unwrap();
      
      const blob = new Blob([response], { type: 'text/csv' });
      const filename = `order_requests_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Colors for charts
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#8b5cf6',
    background: '#f8fafc'
  };

  // Calculate pagination
  const orderRequests = orderRequestsData?.order_requests || [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orderRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orderRequests.length / itemsPerPage);

  // Summary stats
  const summary = orderRequestsData?.summary || {
    total_requests: 0,
    total_sales_amount: 0,
    total_items_quantity: 0,
    average_order_value: 0,
    status_counts: { pending: 0, approved: 0, rejected: 0, cancelled: 0 },
    sales_by_status: { pending: 0, approved: 0, rejected: 0, cancelled: 0 },
    approval_rate: 0
  };

  // Chart data
  const statusDistributionData = orderRequestsData?.charts?.status_distribution || [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm p-2 border border-slate-200/60 rounded-lg shadow-lg max-w-[200px]">
          <p className="font-semibold text-gray-900 text-xs">{format(new Date(label), 'dd MMM yyyy')}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.dataKey === 'daily_sales' ? 'Sales Amount: ' + formatCurrency(entry.value) : 
               entry.dataKey === 'sales_amount' ? 'Sales: ' + formatCurrency(entry.value) :
               entry.name + ': ' + entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Order Requests Report</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Track and analyze your order requests and sales performance
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 text-xs sm:text-sm font-medium shadow-sm gap-1.5 w-full sm:w-auto justify-center"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 sm:p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-[10px] sm:text-xs font-medium opacity-90">Total Requests</p>
              <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-1">{summary.total_requests || 0}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 sm:p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-[10px] sm:text-xs font-medium opacity-90">Total Sales</p>
              <p className="text-sm sm:text-lg font-bold mt-0.5 sm:mt-1 truncate max-w-[100px] sm:max-w-none">{formatCurrency(summary.total_sales_amount)}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 sm:p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-[10px] sm:text-xs font-medium opacity-90">Total Items</p>
              <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-1">{summary.total_items_quantity || 0}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 sm:p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-[10px] sm:text-xs font-medium opacity-90">Avg Order Value</p>
              <p className="text-sm sm:text-lg font-bold mt-0.5 sm:mt-1 truncate max-w-[100px] sm:max-w-none">{formatCurrency(summary.average_order_value)}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 sm:p-4 rounded-xl shadow-lg text-white sm:col-span-1 col-span-2 sm:col-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-[10px] sm:text-xs font-medium opacity-90">Approval Rate</p>
              <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-1">{summary.approval_rate || 0}%</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Responsive */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'today', label: 'Today' },
                { key: 'last_3_days', label: '3 Days' },
                { key: 'this_week', label: 'Week' },
                { key: 'last_month', label: 'Month' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleRangeFilterChange(key)}
                  className={`px-2 py-1 rounded-lg cursor-pointer text-[10px] sm:text-xs font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    rangeFilter === key 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              className="w-full px-2 py-1.5 cursor-pointer border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-xs"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              className="w-full px-2 py-1.5 border cursor-pointer border-slate-200/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-xs"
              value={dateRange.endDate}
              onChange={handleDateChange}
              min={dateRange.startDate}
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-2 py-1.5 cursor-pointer border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-xs"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">Items/Page</label>
            <select
              className="w-full px-2 py-1.5 cursor-pointer border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-xs"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="w-full px-3 py-1.5 cursor-pointer bg-gray-100/80 text-gray-700 rounded-lg hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium flex items-center justify-center gap-1 text-xs"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Status Distribution Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Status Distribution</h3>
            <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100/80 px-2 py-1 rounded-lg">Count & Sales</span>
          </div>
          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistributionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="status" 
                  tickFormatter={(status) => getStatusDisplay(status)}
                  stroke="#64748b"
                  fontSize={10}
                  tick={{ fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={10}
                  tick={{ fill: '#64748b' }}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar 
                  dataKey="count" 
                  name="Count"
                  fill={chartColors.primary}
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                />
                <Bar 
                  dataKey="sales_amount" 
                  name="Sales"
                  fill={chartColors.secondary}
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Order Requests Table - Responsive with horizontal scroll only on table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="p-6 sm:p-10 text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 sm:mt-3 text-xs text-gray-600">Loading order requests data...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 sm:p-10 text-center">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Failed to load order requests</h3>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-3 sm:mb-4">Please check your connection and try again</p>
            <button
              onClick={refetch}
              className="px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Content */}
        {!isLoading && !isError && (
          <>
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Order Requests Details</h3>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                    {orderRequests.length} records found {searchTerm && `for "${searchTerm}"`}
                  </p>
                </div>
              </div>
            </div>

            {/* Table with horizontal scroll only */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/60">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Request ID
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Requested By
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Type
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Target
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Amount
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Qty
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th scope="col" className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-200/60">
                  {currentItems.length > 0 ? (
                    currentItems.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                          <div className="text-[10px] sm:text-xs font-medium text-gray-900">{request.request_id}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                          <div>
                            <div className="text-[10px] sm:text-xs font-medium text-gray-900">
                              {request.requested_by?.name}
                            </div>
                            <div className="text-[8px] sm:text-xs text-gray-500">
                              {request.requested_by?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-900 capitalize">
                          {request.requestor_type}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-900 capitalize">
                          {request.target_type}
                          {request.target_user && (
                            <div className="text-[8px] sm:text-xs text-gray-500">
                              {request.target_user.name}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-xs font-medium capitalize"
                            style={{ 
                              backgroundColor: `${getStatusColor(request.status)}20`,
                              color: getStatusColor(request.status)
                            }}
                          >
                            {getStatusDisplay(request.status)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs font-semibold text-green-600">
                          {formatCurrency(request.total_amount)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-900">
                          {request.total_quantity}
                        </td>
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[8px] sm:text-xs text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-[8px] sm:text-xs text-gray-500 max-w-[80px] sm:max-w-[120px] truncate">
                          {request.note || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-2 sm:px-4 py-6 sm:py-8 text-center">
                        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">No order requests found</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">Try adjusting your filters or search terms</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {currentItems.length > 0 && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-slate-200/60 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-[10px] sm:text-xs text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, orderRequests.length)}</span> of{' '}
                    <span className="font-medium">{orderRequests.length}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 rounded-lg border border-slate-200/60 bg-white/80 text-[10px] sm:text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 backdrop-blur-sm"
                    >
                      Prev
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 2) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNumber = totalPages - 2 + i;
                        } else {
                          pageNumber = currentPage - 1 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-colors duration-200 ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/80 text-gray-700 hover:bg-gray-100 border border-slate-200/60 backdrop-blur-sm'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1 rounded-lg border border-slate-200/60 bg-white/80 text-[10px] sm:text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 backdrop-blur-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderRequestReport;