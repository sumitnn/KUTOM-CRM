// components/wallet/TransactionTable.jsx
import { format } from "date-fns";
import { formatCurrency } from "../utils/format";

const TransactionTable = ({ transactions, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="card bg-base-200 border border-base-300 animate-pulse">
            <div className="card-body py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-base-300 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-base-300 rounded w-1/4"></div>
                    <div className="h-3 bg-base-300 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-base-300 rounded w-20"></div>
                  <div className="h-6 bg-base-300 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-error/10 border border-error/20">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-error">Unable to load transactions</h3>
              <p className="text-error/70 text-sm mt-1">
                There was a problem loading your transaction history. Please try again.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-error btn-sm btn-outline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-base-content/40"
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
            <h3 className="text-lg font-semibold text-base-content mb-2">No transactions found</h3>
            <p className="text-base-content/60 text-sm">
              Your transaction history will appear here once you start making transactions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="card bg-base-100 border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-auto w-full">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-base-content/70">Date & Time</th>
                  <th className="px-6 py-4 text-left font-semibold text-base-content/70">Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-base-content/70">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold text-base-content/70">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-base-content/70">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {transactions.map((tx) => (
          <TransactionCard key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
};

const TransactionRow = ({ transaction: tx }) => {
  return (
    <tr className="hover:bg-base-200/30 transition-colors duration-200">
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="font-medium text-base-content">
            {format(new Date(tx.created_at), "MMM dd, yyyy")}
          </div>
          <div className="text-sm text-base-content/50">
            {format(new Date(tx.created_at), "hh:mm a")}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <TransactionIcon type={tx.transaction_type} />
          <span className="font-semibold capitalize">
            {tx.transaction_type?.toLowerCase()}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <AmountDisplay 
          amount={tx.amount} 
          type={tx.transaction_type} 
        />
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={tx.transaction_status} />
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <p className="text-base-content font-medium truncate">
            {tx.description || "No description"}
          </p>
          {tx.reference_id && (
            <p className="text-sm text-base-content/50 mt-1">
              Ref: {tx.reference_id}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
};

const TransactionCard = ({ transaction: tx }) => {
  return (
    <div className="card bg-base-100 border border-base-300 hover:shadow-md transition-all duration-200">
      <div className="card-body p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <TransactionIcon type={tx.transaction_type} />
            <div>
              <h3 className="font-semibold capitalize text-base-content">
                {tx.transaction_type?.toLowerCase()}
              </h3>
              <p className="text-sm text-base-content/50">
                {format(new Date(tx.created_at), "MMM dd, yyyy 'at' hh:mm a")}
              </p>
            </div>
          </div>
          <StatusBadge status={tx.transaction_status} />
        </div>

        <div className="flex justify-between items-center mb-3">
          <div>
            <AmountDisplay 
              amount={tx.amount} 
              type={tx.transaction_type} 
              size="lg"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-base-300">
          <p className="text-base-content font-medium text-sm">
            {tx.description || "No description provided"}
          </p>
          {tx.user_id && (
            <p className="text-xs text-base-content/50 mt-1">
              Reference ID: {tx.user_id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TransactionIcon = ({ type }) => {
  const iconConfig = {
    DEBIT: {
      icon: "M19 14v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2zm-8-2H6.414l3.293-3.293-1.414-1.414L2.586 12l5.707 5.707 1.414-1.414L6.414 14H11V6h2v6z",
      color: "text-error"
    },
    CREDIT: {
      icon: "M13 7h8v2h-8v6h-2V9H3V7h10V1l8 8-8 8V7z",
      color: "text-success"
    },
    REFUND: {
      icon: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z",
      color: "text-info"
    }
  };

  const config = iconConfig[type] || {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    color: "text-warning"
  };

  return (
    <div className={`w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center ${config.color}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={config.icon}
        />
      </svg>
    </div>
  );
};

const AmountDisplay = ({ amount, type, size = "md" }) => {
  const isDebit = type === "DEBIT";
  const amountClass = isDebit ? "text-error" : "text-success";
  const prefix = isDebit ? "-" : "+";
  const textSize = size === "lg" ? "text-xl" : "text-base";

  return (
    <div className={`font-bold ${amountClass} ${textSize}`}>
      {prefix} ₹{amount}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    SUCCESS: {
      class: "badge-success",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      text: "Completed"
    },
    PENDING: {
      class: "badge-warning",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      text: "Pending"
    },
    FAILED: {
      class: "badge-error",
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      text: "Failed"
    },
    RECEIVED: {
      class: "badge-success",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      text: "Received"
    },
    REFUND: {
      class: "badge-info",
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
      text: "Refunded"
    }
  };

  const config = statusConfig[status] || {
    class: "badge-info",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    text: status
  };

  return (
    <div className={`badge gap-1.5 ${config.class} badge-lg`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={config.icon}
        />
      </svg>
      {config.text}
    </div>
  );
};

export default TransactionTable;