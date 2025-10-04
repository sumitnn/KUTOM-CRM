// features/wallet/UserWalletPage.jsx
import React, { useState, lazy, Suspense } from "react";
import {
  useGetTransactionsQuery,
  useGetWalletSummaryQuery,
} from "../features/walletApi";
import { toast } from "react-toastify";

// Lazy imports for better performance
const WalletSummary = lazy(() => import("../pages/WalletSummary"));
const TransactionTable = lazy(() => import("../pages/TransactionTable"));
const TransactionFilter = lazy(() => import("../pages/TransactionFilter"));
const Pagination = lazy(() => import("../components/common/Pagination"));

// Loading components for lazy imports
const LoadingCard = () => (
  <div className="card bg-base-100 shadow-xl border border-base-300">
    <div className="card-body">
      <div className="flex items-center justify-center py-8">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    </div>
  </div>
);

const LoadingTable = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="flex items-center space-x-4 animate-pulse">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-base-300 rounded w-3/4"></div>
          <div className="h-3 bg-base-300 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

const LoadingFilter = () => (
  <div className="flex flex-wrap gap-4 animate-pulse">
    <div className="h-12 bg-base-300 rounded-lg w-32"></div>
    <div className="h-12 bg-base-300 rounded-lg w-32"></div>
    <div className="h-12 bg-base-300 rounded-lg w-40"></div>
    <div className="h-12 bg-base-300 rounded-lg w-40"></div>
  </div>
);

const UserWalletPage = ({ role }) => {
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  // Fetch wallet summary data
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useGetWalletSummaryQuery();

  // Fetch transactions with filters and pagination
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useGetTransactionsQuery({
    page: currentPage,
    ...filters,
  });

  // Handle refresh all data
  const handleRefresh = () => {
    refetchSummary();
    refetchTransactions();
    toast.success("Data refreshed successfully");
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setCurrentPage(1); 
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Loading state with modern skeleton
  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="loading loading-infinity loading-lg text-primary"></div>
          <p className="mt-6 text-lg font-medium text-base-content/70">Loading wallet details...</p>
          <p className="text-sm text-base-content/50 mt-2">Please wait while we fetch your financial data</p>
        </div>
      </div>
    );
  }

  // Error state with modern design
  if (summaryError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl border border-error/20 max-w-md w-full">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-error mb-2">Connection Error</h3>
            <p className="text-base-content/70 mb-6">We couldn't load your wallet details. Please check your connection and try again.</p>
            <button 
              onClick={handleRefresh}
              className="btn btn-primary btn-outline w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if role is stockist or reseller
  const showCommissionCard = role === "stockist" || role === "reseller";

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200">
      <div className="container mx-auto px-3 py-6 lg:px-6 lg:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Wallet & Transactions
            </h1>
            <p className="text-base-content/60 mt-2 text-sm lg:text-base">
              Manage your finances and track your transaction history
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="btn btn-primary btn-outline lg:w-auto w-full group transition-all duration-200 hover:shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300">
            <div className="card-body p-6">
              <Suspense fallback={<LoadingCard />}>
                <WalletSummary 
                  currentBalance={summaryData?.current_balance || 0}
                  totalSales={summaryData?.total_sales || 0}
                  totalWithdrawals={summaryData?.total_withdrawals || 0}
                />
              </Suspense>
            </div>
          </div>
          
          {/* Commission Card for Stockist/Reseller */}
          {showCommissionCard && (
            <div className="card bg-gradient-to-br from-primary via-primary to-secondary shadow-2xl border-0 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
              <div className="card-body p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-7 w-7" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg tracking-wide opacity-90">YOUR EARNINGS</h3>
                        <p className="text-white/70 text-sm">Commission from sales</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="stat-value text-4xl lg:text-5xl font-bold mb-2 text-white">
                          ${summaryData?.payout_balance || 0}
                        </div>
                        <p className="text-white/80 text-sm font-medium">Available for withdrawal</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <div className="badge badge-lg bg-white/30 text-white border-0 px-4 py-3 font-semibold backdrop-blur-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {summaryData?.pending_commission || 0} Pending
                        </div>
                        <div className="text-white/70 text-sm font-medium flex items-center">
                          Earned from selling products
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
          <div className="card-body p-0">
            {/* Section Header */}
            <div className="px-6 py-6 border-b border-base-300 bg-base-200/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-base-content">Transaction History</h2>
                  <p className="text-base-content/60 text-sm mt-1">
                    {transactionsData?.total_count || 0} transactions found
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Real-time transaction updates
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 bg-base-200/30 border-b border-base-300">
              <Suspense fallback={<LoadingFilter />}>
                <TransactionFilter 
                  filters={filters} 
                  onFilterChange={handleFilterChange} 
                  onClearFilters={() => setFilters({
                    type: "",
                    status: "",
                    fromDate: "",
                    toDate: "",
                  })}
                />
              </Suspense>
            </div>

            {/* Transaction Table */}
            <div className="p-6">
              <Suspense fallback={<LoadingTable />}>
                <TransactionTable
                  transactions={transactionsData?.results || []}
                  isLoading={transactionsLoading}
                  error={transactionsError}
                />
              </Suspense>

              {/* Pagination */}
              {transactionsData?.total_pages > 1 && (
                <div className="mt-8 pt-6 border-t border-base-300">
                  <Suspense fallback={<div className="loading loading-dots loading-md"></div>}>
                    <Pagination
                      page={currentPage}
                      totalPages={transactionsData?.total_pages}
                      onPageChange={setCurrentPage}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-base-200/50 rounded-2xl p-4 border border-base-300">
            <div className="text-2xl font-bold text-primary">{transactionsData?.total_count || 0}</div>
            <div className="text-sm text-base-content/60">Total Transactions</div>
          </div>
          <div className="bg-base-200/50 rounded-2xl p-4 border border-base-300">
            <div className="text-2xl font-bold text-secondary">{transactionsData?.total_pages || 1}</div>
            <div className="text-sm text-base-content/60">Total Pages</div>
          </div>
          <div className="bg-base-200/50 rounded-2xl p-4 border border-base-300">
            <div className="text-2xl font-bold text-accent">{currentPage}</div>
            <div className="text-sm text-base-content/60">Current Page</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWalletPage;