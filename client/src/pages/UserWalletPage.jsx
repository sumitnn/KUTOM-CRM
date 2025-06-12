// features/wallet/UserWalletPage.jsx
import React, { useState, useMemo } from "react";
import {
  useGetWalletQuery,
  useGetTransactionsQuery,
  useUpdateWalletAmountMutation,
} from "../features/walletApi";
import Pagination from "../components/common/Pagination";
import WalletSummary from "../pages/WalletSummary";
import TransactionTable from "../pages/TransactionTable";
import TransactionFilter from "../pages/TransactionFilter";
import TransactionModal from "../pages/TransactionModal";

const UserWalletPage = () => {
  // Fetch wallet data
  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useGetWalletQuery();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transactions with pagination
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useGetTransactionsQuery({ page: currentPage });

  // Update wallet mutation
  const [updateWallet, { isLoading: isUpdating }] = useUpdateWalletAmountMutation();

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: "Deposit",
    amount: "",
    description: "",
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    setCurrentPage(1); // Reset page when filters change
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle transaction form changes
  const handleTransactionChange = (e) => {
    setTransactionForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle transaction submission
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const amount = parseFloat(transactionForm.amount);
      if (isNaN(amount)) return;

      await updateWallet({
        userEmail: "user@example.com", // Replace with actual user email
        data: {
          amount: transactionForm.type === "Deposit" ? amount : -amount,
          description: transactionForm.description,
        },
      }).unwrap();

      refetchWallet();
      setShowTransactionModal(false);
      setTransactionForm({
        type: "Deposit",
        amount: "",
        description: "",
      });
    } catch (error) {
      console.error("Failed to update wallet:", error);
    }
  };

  // Filter transactions based on filters state
  const filteredTransactions = useMemo(() => {
    if (!transactionsData?.results) return [];
    
    return transactionsData.results.filter((tx) => {
      const txDate = new Date(tx.created_at);
      const from = filters.fromDate ? new Date(filters.fromDate) : null;
      const to = filters.toDate ? new Date(filters.toDate) : null;

      if (filters.type && tx.transaction_type !== filters.type) return false;
      if (filters.status && tx.status !== filters.status) return false;
      if (from && txDate < from) return false;
      if (to && txDate > to) return false;

      return true;
    });
  }, [transactionsData, filters]);

  // Loading state
  if (walletLoading) {
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
  if (walletError) {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center text-primary">
          My Wallet
        </h1>

        <WalletSummary 
          walletData={walletData} 
        />

        {/* Transaction History */}
        <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">Transaction History</h2>

          <TransactionFilter 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />

          <TransactionTable
            transactions={filteredTransactions}
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

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        formData={transactionForm}
        onFormChange={handleTransactionChange}
        onSubmit={handleTransactionSubmit}
        isSubmitting={isUpdating}
      />
    </div>
  );
};

export default UserWalletPage;