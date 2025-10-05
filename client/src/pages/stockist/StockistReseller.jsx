import React, { useState } from 'react';
import { useFetchMyResellerQuery } from '../../features/reseller/resellerApi';
import { useGetStatesQuery, useGetDistrictsQuery } from '../../features/location/locationApi';
import Spinner from '../../components/common/Spinner';

const StockistReseller = () => {
  const [filters, setFilters] = useState({
    postal_code: '',
    state: '',
    district: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { data: resellerData, isLoading, isError, refetch } = useFetchMyResellerQuery({
    ...appliedFilters,
    page: currentPage,
    limit: itemsPerPage
  });
  
  const { data: states = [] } = useGetStatesQuery();
  const { data: districts = [] } = useGetDistrictsQuery(filters.state, {
    skip: !filters.state
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'state' && { district: '' }) // Reset district when state changes
    }));
  };

  const handleSearch = () => {
    setAppliedFilters({
      postal_code: filters.postal_code.trim(),
      state: filters.state,
      district: filters.district
    });
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleReset = () => {
    const resetFilters = {
      postal_code: '',
      state: '',
      district: ''
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Pagination calculations
  const resellers = resellerData?.results || [];
  const totalCount = resellerData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load resellers</h3>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Network (Assigned Resellers)</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Showing {resellers.length} of {totalCount} resellers
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center px-4 py-2 cursor-pointer bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 sm:self-start"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters - Responsive Grid */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* State Filter */}
            <div className="xs:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full p-2 cursor-pointer border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="xs:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                disabled={!filters.state}
                className="w-full p-2 cursor-pointer border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Code Filter */}
            <div className="xs:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
              <input
                type="text"
                placeholder="Enter PIN"
                value={filters.postal_code}
                onChange={(e) => handleFilterChange('postal_code', e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full cursor-pointer p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* Action Buttons - Responsive */}
            <div className="xs:col-span-2 lg:col-span-1 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-end gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border cursor-pointer border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleSearch}
                className="flex-1 px-4 cursor-pointer py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table Container with Horizontal Scroll */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px] lg:min-w-full">
              {/* Responsive Table */}
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Reseller ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Reseller Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Street Address
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      City
                    </th>
                    <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      State
                    </th>
                    <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      District
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      PIN Code
                    </th>
                    <th className="hidden xl:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Country
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resellers.length > 0 ? (
                    resellers.map((reseller, index) => (
                      <tr key={reseller.user?.id || index} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {reseller.rolebased_id || 'N/A'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reseller.user?.full_name || reseller.user?.username || 'N/A'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="truncate block max-w-[120px] sm:max-w-none">
                            {reseller.user?.email || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <span className="truncate block max-w-[100px] sm:max-w-[150px]">
                            {reseller.street_address || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reseller.city || 'N/A'}
                        </td>
                        <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reseller.state || 'N/A'}
                        </td>
                        <td className="hidden lg:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reseller.district || 'N/A'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reseller.postal_code || 'N/A'}
                        </td>
                        <td className="hidden xl:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reseller.country || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-3 py-4 text-center text-sm text-gray-500">
                        No resellers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Responsive */}
          {totalPages > 1 && (
            <div className="bg-white px-3 py-4 sm:px-4 sm:py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Results Info */}
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex flex-col xs:flex-row items-center gap-3">
                  {/* Previous Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers - Hide on small screens, show on medium+ */}
                    <div className="hidden sm:flex space-x-1">
                      {getPageNumbers().map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Mobile Page Info */}
                  <div className="sm:hidden text-center">
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Summary Card for Small Screens */}
        <div className="lg:hidden mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use horizontal scroll to view all table columns</li>
              <li>• Some columns are hidden on smaller screens for better readability</li>
              <li>• Use filters to narrow down your search results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockistReseller;