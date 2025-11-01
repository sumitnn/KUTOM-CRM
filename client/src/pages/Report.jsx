// Report.jsx
import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useGetVendorSalesQuery, useExportVendorSalesMutation } from "../features/sales/salesApi";
import {

  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { saveAs } from 'file-saver';

const Report = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(today, 2), 'yyyy-MM-dd'), // Last 3 days default
    endDate: format(today, 'yyyy-MM-dd')
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rangeFilter, setRangeFilter] = useState('last_3_days'); // Default to last 3 days
  const [searchInput, setSearchInput] = useState("");

  const { data: salesData, isLoading, isError, refetch } = useGetVendorSalesQuery({
    range: rangeFilter,
    search: searchTerm,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const [exportSales] = useExportVendorSalesMutation();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

 const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'dd MMM yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setRangeFilter('custom');
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

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const response = await exportSales({
        range: rangeFilter,
        search: searchTerm,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }).unwrap();
      
      // For CSV response
      const blob = new Blob([response], { type: 'text/csv' });
      const filename = `sales_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
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
  const sales = salesData?.sales || [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sales.length / itemsPerPage);

  // Summary stats
  const summary = salesData?.summary || {
    total_sales: 0,
    total_quantity: 0,
    total_orders: 0
  };

  // Chart data
  
  const topProductsData = salesData?.charts?.top_products || [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
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
    <div className="min-h-screen ">
      <div className="max-w-8xl mx-auto py-4 ">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track and analyze your sales performance
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
             
             
              <button
                onClick={handleExport}
                className="px-6 py-2.5 cursor-pointer bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(summary.total_sales || 0)}</p>
              </div>
              <div className="p-3 bg-blue-400/20 rounded-xl">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Quantity</p>
                <p className="text-3xl font-bold mt-2">{summary.total_quantity || 0}</p>
              </div>
              <div className="p-3 bg-green-400/20 rounded-xl">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold mt-2">{summary.total_orders || 0}</p>
              </div>
              <div className="p-3 bg-purple-400/20 rounded-xl">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'last_3_days', label: 'Last 3 Days' },
                  { key: 'this_week', label: 'This Week' },
                  { key: 'last_month', label: 'Last Month' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleRangeFilterChange(key)}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                      rangeFilter === key 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="w-full px-3 py-2.5 cursor-pointer border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            
            <div>
              <label className="block text-sm  font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                className="w-full px-3 py-2.5 border cursor-pointer border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items per page</label>
              <select
                className="w-full px-3 py-2.5 cursor-pointer border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                className="w-full px-4 py-2.5 cursor-pointer bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 mb-8">
          {/* Daily Sales Chart */}
        

          {/* Top Products Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Sales Amount
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="product__name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="product_total" 
                    fill={chartColors.secondary}
                    radius={[4, 4, 0, 0]}
                  >
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors.secondary} opacity={0.7 + (index * 0.3 / topProductsData.length)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading sales data...</p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load sales data</h3>
              <p className="text-gray-600 mb-4">Please check your connection and try again</p>
              <button
                onClick={refetch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Content */}
          {!isLoading && !isError && (
            <>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Sales Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {sales.length} records found {searchTerm && `for "${searchTerm}"`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase ">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase ">
                        Variant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase ">
                        Order Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase ">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase ">
                        Price (included GST And Discount)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase ">
                        Total Price (Without Shipping)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                      currentItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.product_image && (
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img 
                                    className="h-10 w-10 rounded-lg object-cover border border-gray-200" 
                                    src={item.product_image} 
                                    alt={item.product_name} 
                                  />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500">Order #{item.order_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.variant_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(item.order_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales data found</h3>
                          <p className="text-gray-600">Try adjusting your filters or search terms</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  
                  {currentItems.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                          Page Totals
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {currentItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(currentItems.reduce((sum, item) => sum + item.total_price, 0))}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                          Grand Totals
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {summary.total_quantity || 0}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(summary.total_sales || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination */}
              {currentItems.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, sales.length)}</span> of{' '}
                      <span className="font-medium">{sales.length}</span> results
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => paginate(pageNumber)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                currentPage === pageNumber
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
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
                        className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
    </div>
  );
};

export default Report;