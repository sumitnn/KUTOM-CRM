// components/wallet/TransactionFilters.jsx
import React, { useState } from 'react';

const TransactionFilter = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearFilters = () => {
    const clearedFilters = {
      type: '',
      status: '',
      fromDate: '',
      toDate: ''
    };
    // Trigger filter change for each field
    Object.keys(clearedFilters).forEach(key => {
      onFilterChange({
        target: {
          name: key,
          value: clearedFilters[key]
        }
      });
    });
  };

  const hasActiveFilters = filters.type || filters.status || filters.fromDate || filters.toDate;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Filter Transactions
          </h3>
          <p className="text-gray-500 text-sm mt-1">Refine your transaction history</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Clear All</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className={`grid grid-cols-1 gap-6 ${isExpanded ? 'block' : 'hidden'} sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6`}>
        {/* Type Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Transaction Type</span>
          </label>
          <div className="relative">
            <select
              name="type"
              value={filters.type}
              onChange={onFilterChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="CREDIT" className="text-green-600">Credit</option>
              <option value="DEBIT" className="text-red-600">Debit</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Status</span>
          </label>
          <div className="relative">
            <select
              name="status"
              value={filters.status}
              onChange={onFilterChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="SUCCESS" className="text-green-600">Success</option>
              <option value="PENDING" className="text-yellow-600">Pending</option>
              <option value="FAILED" className="text-red-600">Failed</option>
              <option value="REFUND" className="text-blue-600">Refund</option>
              <option value="RECEIVED" className="text-purple-600">Received</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* From Date Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>From Date</span>
          </label>
          <div className="relative">
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={onFilterChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer"
              max={filters.toDate || undefined}
            />
          </div>
        </div>

        {/* To Date Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>To Date</span>
          </label>
          <div className="relative">
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={onFilterChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer"
              min={filters.fromDate || undefined}
            />
          </div>
        </div>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.type && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {filters.type}
                <button
                  onClick={() => onFilterChange({ target: { name: 'type', value: '' } })}
                  className="ml-2 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {filters.status}
                <button
                  onClick={() => onFilterChange({ target: { name: 'status', value: '' } })}
                  className="ml-2 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.fromDate && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                From: {filters.fromDate}
                <button
                  onClick={() => onFilterChange({ target: { name: 'fromDate', value: '' } })}
                  className="ml-2 hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.toDate && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                To: {filters.toDate}
                <button
                  onClick={() => onFilterChange({ target: { name: 'toDate', value: '' } })}
                  className="ml-2 hover:text-purple-900"
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