// features/wallet/UserWalletPage.jsx
import React, { useState } from "react";
import {
  useGetTransactionsQuery,
  useGetWalletSummaryQuery,
} from "../features/walletApi";
import Pagination from "../components/common/Pagination";
import WalletSummary from "../pages/WalletSummary";
import TransactionTable from "../pages/TransactionTable";
import TransactionFilter from "../pages/TransactionFilter";
import { toast } from "react-toastify";

const UserWalletPage = () => {
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
    toast.success("Data refreshed successfully");
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setCurrentPage(1); 
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Loading state
  if ( summaryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Loading wallet details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if ( summaryError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Error loading wallet details. Please try again later.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-base-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Wallet & Transactions
          </h1>
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
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
            Refresh
          </button>
        </div>

        <WalletSummary 
          currentBalance={summaryData?.current_balance || 0}
          totalSales={summaryData?.total_sales || 0}
          totalWithdrawals={summaryData?.total_withdrawals || 0}
        />

        {/* Transaction History */}
        <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold">Transaction History</h2>
          </div>

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

          <TransactionTable
            transactions={transactionsData?.results || []}
            isLoading={transactionsLoading}
            error={transactionsError}
          />

          {/* Pagination */}
          {transactionsData?.total_pages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={transactionsData?.total_pages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserWalletPage;