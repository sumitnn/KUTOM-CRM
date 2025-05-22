import { useState } from "react";
import { useGetTransactionsQuery } from "../../features/walletApi";

const WalletTransactionTable = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useGetTransactionsQuery({ page, pageSize });

  const transactions = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  if (isLoading) return <p>Loading transactions...</p>;
  if (error) return <p>Failed to load transactions.</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className={tx.transaction_type === "CREDIT" ? "text-green-600" : "text-red-600"}>
                  ₹{tx.amount}
                </td>
                <td>{tx.transaction_type}</td>
                <td>{tx.transaction_status}</td>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4">
        <button
          className="btn btn-outline btn-sm"
          onClick={handlePrev}
          disabled={page === 1 || isFetching}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleNext}
          disabled={page === totalPages || isFetching}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WalletTransactionTable;
