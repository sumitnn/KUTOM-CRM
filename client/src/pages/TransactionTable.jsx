// components/wallet/TransactionTable.jsx
import { format } from "date-fns";
import { formatCurrency } from "../utils/format";

const TransactionTable = ({ transactions, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error my-4">
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
        <span>Error loading transactions. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {transactions?.length > 0 ? (
            transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{format(new Date(tx.created_at), "MMM dd, yyyy")}</td>
                <td>{tx.transaction_type}</td>
                <td
                  className={
                    tx.transaction_type === "Withdrawal"
                      ? "text-error font-semibold"
                      : "text-success font-semibold"
                  }
                >
                  {formatCurrency(tx.amount)}
                </td>
                <td>
                  <StatusBadge status={tx.status} />
                </td>
                <td className="truncate max-w-xs">{tx.description || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const badgeClasses = {
    Completed: "badge-success",
    Pending: "badge-warning",
    Rejected: "badge-error",
  };

  return (
    <span className={`badge ${badgeClasses[status] || "badge-info"}`}>
      {status}
    </span>
  );
};

export default TransactionTable;