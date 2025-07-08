// Report.jsx
import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useGetVendorSalesQuery, useExportVendorSalesMutation } from "../features/sales/salesApi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { saveAs } from 'file-saver';

const Report = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd')
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rangeFilter, setRangeFilter] = useState('this_week');
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
      minimumFractionDigits: 2
    }).format(amount);
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
      case 'this_week':
        setDateRange({
          startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
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
      
      const blob = new Blob([response], { type: 'application/vnd.ms-excel' });
      const filename = `sales_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
    }
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
  const dailySalesData = salesData?.charts?.daily_sales || [];
  const topProductsData = salesData?.charts?.top_products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Sales Report</h2>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  value={searchInput}
                  onChange={handleSearchChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearchSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              >
                Search
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-500">Total Sales</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatCurrency(summary.total_sales || 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-500">Total Quantity</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.total_quantity || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-500">Total Orders</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.total_orders || 0}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 border-b border-gray-200">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sale_date__date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                    labelFormatter={(date) => format(new Date(date), 'MMMM dd, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="daily_total" 
                    name="Sales Amount"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product__name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="product_total" 
                    name="Sales Amount"
                    fill="#10b981" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRangeFilterChange('today')}
                  className={`px-3 py-1 rounded-md text-sm font-medium cursor-pointer ${rangeFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleRangeFilterChange('this_week')}
                  className={`px-3 py-1 rounded-md text-sm font-medium cursor-pointer ${rangeFilter === 'this_week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleRangeFilterChange('last_month')}
                  className={`px-3 py-1 rounded-md text-sm font-medium cursor-pointer ${rangeFilter === 'last_month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Last Month
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading sales data...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 text-center text-red-600">
            Failed to load sales data. Please try again.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    SR No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Order Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Variant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Unit Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Total Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(item.order_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {item.product_image && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-md object-cover" 
                                src={item.product_image} 
                                alt={item.product_name} 
                              />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{item.product_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product_size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No sales data found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
              {currentItems.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                      Totals
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {sales.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(sales.reduce((sum, item) => sum + item.total_price, 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && currentItems.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-bold">{Math.min(indexOfLastItem, sales.length)}</span> of{' '}
              <span className="font-bold">{sales.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-md text-sm font-bold ${currentPage === pageNum 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-3 py-1 text-gray-700">...</span>
              )}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-3 py-1 border rounded-md text-sm font-bold ${currentPage === totalPages 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;