import React from 'react';

const TransactionFilter = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters = filters.type || filters.status || filters.fromDate || filters.toDate;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filter Transactions</h3>
          <p className="text-gray-600 text-sm">Refine your transaction history</p>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUND">Refund</option>
            <option value="RECEIVED">Received</option>
          </select>
        </div>

        {/* From Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            max={filters.toDate || undefined}
          />
        </div>

        {/* To Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={onFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={filters.fromDate || undefined}
          />
        </div>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Type: {filters.type}
                <button
                  onClick={() => onFilterChange({ target: { name: 'type', value: '' } })}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Status: {filters.status}
                <button
                  onClick={() => onFilterChange({ target: { name: 'status', value: '' } })}
                  className="ml-1 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.fromDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                From: {filters.fromDate}
                <button
                  onClick={() => onFilterChange({ target: { name: 'fromDate', value: '' } })}
                  className="ml-1 hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.toDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                To: {filters.toDate}
                <button
                  onClick={() => onFilterChange({ target: { name: 'toDate', value: '' } })}
                  className="ml-1 hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilter;