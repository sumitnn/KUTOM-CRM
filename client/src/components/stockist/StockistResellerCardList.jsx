import React, { useState, useEffect } from 'react';
import ViewResellerModal from '../reseller/ViewResellerModal';
import StockistResellerCard from './StockistResellerCard';

export default function StockistResellerCardList({ reseller }) {
  const [viewing, setViewing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 500 >=
        document.documentElement.scrollHeight
      ) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((prev) => prev + 6);
          setIsLoadingMore(false);
        }, 300);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filtered = reseller
    .filter(user => 
      user.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc
        ? (a.user?.full_name || '').localeCompare(b.user?.full_name || '')
        : (b.user?.full_name || '').localeCompare(a.user?.full_name || '')
    )
    .slice(0, visibleCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or email"
            className="input input-bordered pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-outline btn-sm flex items-center gap-1"
          onClick={() => setSortAsc(!sortAsc)}
        >
          <span>Sort {sortAsc ? 'A-Z' : 'Z-A'}</span>
          {sortAsc ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map(user => (
            <StockistResellerCard
              key={user.id}
              user={user}
              onView={setViewing}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No resellers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'No resellers assigned yet'}
            </p>
          </div>
        )}
      </div>

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* View Modal */}
      {viewing && (
        <ViewResellerModal
          user={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}