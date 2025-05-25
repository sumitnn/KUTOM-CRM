import React, { useState, useMemo } from "react";

const UserWalletPage = () => {
  const walletDetails = {
    balance: 1250.75,
    totalDeposits: 3000,
    totalWithdrawals: 1750.25,
  };

  const allTransactions = [
    { id: 1, date: "2025-05-20", type: "Deposit", amount: 500, status: "Completed" },
    { id: 2, date: "2025-05-18", type: "Withdrawal", amount: 200, status: "Completed" },
    { id: 3, date: "2025-05-17", type: "Deposit", amount: 1000, status: "Completed" },
    { id: 4, date: "2025-05-15", type: "Withdrawal", amount: 300, status: "Pending" },
    { id: 5, date: "2025-05-14", type: "Deposit", amount: 1500, status: "Completed" },
    { id: 6, date: "2025-05-10", type: "Withdrawal", amount: 250, status: "Rejected" },
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 4;

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

  // Filter transactions based on filters state
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const from = filters.fromDate ? new Date(filters.fromDate) : null;
      const to = filters.toDate ? new Date(filters.toDate) : null;

      if (filters.type && tx.type !== filters.type) return false;
      if (filters.status && tx.status !== filters.status) return false;
      if (from && txDate < from) return false;
      if (to && txDate > to) return false;

      return true;
    });
  }, [allTransactions, filters]);

  // Pagination calculations on filtered data
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const indexOfLastTx = currentPage * transactionsPerPage;
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTx, indexOfLastTx);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center">My Wallet</h1>

      {/* Wallet Summary */}
      <div className="bg-white p-6 rounded-xl shadow mb-10 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">Wallet Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-primary text-white rounded-lg p-6 shadow-lg hover:scale-105 transition-transform">
            <p className="text-sm uppercase tracking-widest">Balance</p>
            <p className="text-4xl font-bold">${walletDetails.balance.toFixed(2)}</p>
          </div>
          <div className="bg-success text-white rounded-lg p-6 shadow-lg hover:scale-105 transition-transform">
            <p className="text-sm uppercase tracking-widest">Total Deposits</p>
            <p className="text-4xl font-bold">${walletDetails.totalDeposits.toFixed(2)}</p>
          </div>
          <div className="bg-error text-white rounded-lg p-6 shadow-lg hover:scale-105 transition-transform">
            <p className="text-sm uppercase tracking-widest">Total Withdrawals</p>
            <p className="text-4xl font-bold">${walletDetails.totalWithdrawals.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-5xl mx-auto mb-10 bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn btn-primary flex-1">Add Funds</button>
          <button className="btn btn-secondary flex-1">Withdraw</button>
          <button className="btn btn-outline flex-1">View Statements</button>
        </div>
      </div>

      {/* Transaction History with Filters */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-6">Transaction History</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Type</span>
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="select select-bordered w-full"
            >
              <option value="">All</option>
              <option value="Deposit">Deposit</option>
              <option value="Withdrawal">Withdrawal</option>
            </select>
          </div>
          <div>
            <label className="label">
              <span className="label-text font-semibold">Status</span>
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="select select-bordered w-full"
            >
              <option value="">All</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="label">
              <span className="label-text font-semibold">From Date</span>
            </label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="input input-bordered w-full"
              max={filters.toDate || undefined}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text font-semibold">To Date</span>
            </label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="input input-bordered w-full"
              min={filters.fromDate || undefined}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount ($)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.length > 0 ? (
                currentTransactions.map(({ id, date, type, amount, status }) => (
                  <tr key={id}>
                    <td>{date}</td>
                    <td>{type}</td>
                    <td className={type === "Withdrawal" ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                      {amount.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          status === "Completed"
                            ? "badge-success"
                            : status === "Pending"
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between mt-6 items-center">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`btn btn-outline ${currentPage === 1 ? "btn-disabled" : ""}`}
          >
            Previous
          </button>
          <span className="font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`btn btn-outline ${currentPage === totalPages || totalPages === 0 ? "btn-disabled" : ""}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserWalletPage;
