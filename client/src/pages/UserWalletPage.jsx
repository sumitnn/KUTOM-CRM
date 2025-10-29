import React, { useState, lazy, Suspense } from "react";
import {
  useGetTransactionsQuery,
  useGetWalletSummaryQuery,
} from "../features/walletApi";
import { toast } from "react-toastify";

// Lazy imports
const WalletSummary = lazy(() => import("../pages/WalletSummary"));
const TransactionTable = lazy(() => import("../pages/TransactionTable"));
const TransactionFilter = lazy(() => import("../pages/TransactionFilter"));
const Pagination = lazy(() => import("../components/common/Pagination"));

// Loading components
const LoadingCard = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  </div>
);

const LoadingTable = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-xl"></div>
      </div>
    ))}
  </div>
);

const LoadingFilter = () => (
  <div className="flex flex-wrap gap-3 animate-pulse">
    <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
    <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
    <div className="h-12 bg-gray-200 rounded-lg w-40"></div>
  </div>
);

const UserWalletPage = ({ role }) => {
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

  const handleRefresh = () => {
    refetchSummary();
    refetchTransactions();
    toast.success("Data refreshed successfully");
  };

  const handleFilterChange = (e) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilters({
      type: "",
      status: "",
      fromDate: "",
      toDate: "",
    });
  };

  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading wallet details...</p>
        </div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-600 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">We couldn't load your wallet details. Please try again.</p>
            <button 
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showCommissionCard = role === "stockist" || role === "reseller";

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto  py-4 max-w-8xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Wallet & Transactions
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your finances and track your transaction history
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="bg-white text-gray-700 cursor-pointer px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Wallet Summary */}
        <div className="mb-6">
          <Suspense fallback={<LoadingCard />}>
            <WalletSummary 
              currentBalance={summaryData?.current_balance || 0}
              totalSales={summaryData?.total_sales || 0}
              totalWithdrawals={summaryData?.total_withdrawals || 0}
            />
          </Suspense>
        </div>
        
        {/* Commission Card for Stockist/Reseller */}
        {showCommissionCard && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg text-white p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">YOUR EARNINGS</h3>
                      <p className="text-white/80 text-sm">Commission from sales and referrals</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-xl font-bold">₹{summaryData?.payout_balance || 0}</div>
                      <p className="text-white/80 text-xs">Available for Withdrawal</p>
                    </div>
                    
                   
                    
                    
                  </div>
                </div>

                
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                <p className="text-gray-600 text-sm">
                  {transactionsData?.count || 0} transactions found
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Real-time updates
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Suspense fallback={<LoadingFilter />}>
              <TransactionFilter 
                filters={filters} 
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
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
            {transactionsData?.count > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Suspense fallback={<div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>}>
                  <Pagination
                    page={currentPage}
                    totalPages={Math.ceil(transactionsData.count / 10)} // Assuming 10 items per page
                    onPageChange={setCurrentPage}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-lg font-bold text-blue-600">{transactionsData?.count || 0}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-lg font-bold text-purple-600">{Math.ceil(transactionsData?.count / 10) || 1}</div>
            <div className="text-sm text-gray-600">Total Pages</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-lg font-bold text-green-600">{currentPage}</div>
            <div className="text-sm text-gray-600">Current Page</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWalletPage;