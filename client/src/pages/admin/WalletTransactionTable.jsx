import { useState } from "react";
import { useGetTransactionsQuery } from "../../features/walletApi";
import { format, parseISO } from 'date-fns';

const WalletTransactionTable = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    fromDate: '',
    toDate: ''
  });

  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useGetTransactionsQuery({ 
    page, 
    page_size: pageSize,
    ...filters
  });

  const transactions = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      fromDate: '',
      toDate: ''
    });
    setPage(1);
  };

  if (isLoading && page === 1) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (error) return (
    <div className="alert alert-error shadow-lg mx-4 my-6">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="ml-2">Failed to load transactions. Please try again.</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2 ">
      {/* Enhanced Filters */}
      <div className="bg-white/50 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 cursor-pointer py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">All Types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm  font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={clearFilters}
              className="w-full px-4 py-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{totalCount} transactions found</span>
            {isFetching && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-orange-600">Updating...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Show:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200/30">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium">{isFetching ? 'Loading transactions...' : 'No transactions found'}</p>
                      <p className="text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-orange-50/30 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">#{tx.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {format(parseISO(tx.created_at), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(tx.created_at), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {tx.user_id || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 bg-blue-100 px-2 py-1 rounded-md">
                        {tx.order_id || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        tx.transaction_type === "CREDIT" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {tx.transaction_type === "CREDIT" ? (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        tx.transaction_type === "CREDIT" ? "text-green-600" : "text-red-600"
                      }`}>
                        {tx.transaction_type === "CREDIT" ? "+" : "-"}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </div>
                      {tx.transaction_status && (
                        <div className="text-xs text-gray-500 mt-1">
                          Status: <span className={`font-medium ${
                            tx.transaction_status === "SUCCESS" ? "text-green-600" :
                            tx.transaction_status === "PENDING" ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {tx.transaction_status}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <div className="bg-white/50 px-6 py-4 border-t border-gray-200/30">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(page * pageSize, totalCount)}</span> of{' '}
              <span className="font-semibold">{totalCount}</span> results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                disabled={page === 1 || isFetching}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  page === 1 || isFetching 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : 
                                page >= totalPages - 2 ? totalPages - 4 + i : 
                                page - 2 + i;
                  return pageNum <= totalPages && pageNum >= 1 ? (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={isFetching}
                      className={`w-10 h-10 rounded-lg border transition-all duration-200 ${
                        page === pageNum
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } ${isFetching ? 'opacity-50' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ) : null;
                })}
              </div>
              
              <button
                onClick={handleNext}
                disabled={page === totalPages || isFetching}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  page === totalPages || isFetching
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTransactionTable;