import { format } from "date-fns";

const TransactionTable = ({ transactions, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-700">Unable to load transactions</h3>
            <p className="text-red-600 text-sm">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No transactions found</h3>
        <p className="text-gray-500 text-sm">Your transaction history will appear here once you start making transactions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </tbody>
        </table>
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="space-y-1">
          <div className="font-medium text-gray-900 text-sm">
            {format(new Date(tx.created_at), "MMM dd, yyyy")}
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(tx.created_at), "hh:mm a")}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TransactionIcon type={tx.transaction_type} />
          <span className="font-medium text-sm capitalize">
            {tx.transaction_type?.toLowerCase()}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <AmountDisplay 
          amount={tx.amount} 
          type={tx.transaction_type} 
        />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={tx.transaction_status} />
      </td>
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-gray-900 font-medium text-sm truncate">
            {tx.description || "No description"}
          </p>
          {tx.reference_id && (
            <p className="text-xs text-gray-500 mt-1">
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <TransactionIcon type={tx.transaction_type} />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm capitalize">
              {tx.transaction_type?.toLowerCase()}
            </h3>
            <p className="text-gray-500 text-xs">
              {format(new Date(tx.created_at), "MMM dd, yyyy 'at' hh:mm a")}
            </p>
          </div>
        </div>
        <StatusBadge status={tx.transaction_status} />
      </div>

      <div className="flex justify-between items-center mb-3">
        <AmountDisplay 
          amount={tx.amount} 
          type={tx.transaction_type} 
          size="lg"
        />
      </div>

      <div className="pt-3 border-t border-gray-200">
        <p className="text-gray-900 font-medium text-sm">
          {tx.description || "No description provided"}
        </p>
        {tx.user_id && (
          <p className="text-xs text-gray-500 mt-1">
            Reference ID: {tx.user_id}
          </p>
        )}
      </div>
    </div>
  );
};

const TransactionIcon = ({ type }) => {
  const iconConfig = {
    DEBIT: {
      icon: "M19 14v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2zm-8-2H6.414l3.293-3.293-1.414-1.414L2.586 12l5.707 5.707 1.414-1.414L6.414 14H11V6h2v6z",
      color: "text-red-600",
      bg: "bg-red-100"
    },
    CREDIT: {
      icon: "M13 7h8v2h-8v6h-2V9H3V7h10V1l8 8-8 8V7z",
      color: "text-green-600",
      bg: "bg-green-100"
    },
    REFUND: {
      icon: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z",
      color: "text-blue-600",
      bg: "bg-blue-100"
    }
  };

  const config = iconConfig[type] || {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    color: "text-yellow-600",
    bg: "bg-yellow-100"
  };

  return (
    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 ${config.color}`}
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
  const amountClass = isDebit ? "text-red-600" : "text-green-600";
  const prefix = isDebit ? "-" : "+";
  const textSize = size === "lg" ? "text-lg" : "text-base";

  return (
    <div className={`font-bold ${amountClass} ${textSize}`}>
      {prefix} ₹{amount}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    SUCCESS: {
      class: "bg-green-100 text-green-800",
      text: "Completed"
    },
    PENDING: {
      class: "bg-yellow-100 text-yellow-800",
      text: "Pending"
    },
    FAILED: {
      class: "bg-red-100 text-red-800",
      text: "Failed"
    },
    RECEIVED: {
      class: "bg-green-100 text-green-800",
      text: "Received"
    },
    REFUND: {
      class: "bg-blue-100 text-blue-800",
      text: "Refunded"
    }
  };

  const config = statusConfig[status] || {
    class: "bg-gray-100 text-gray-800",
    text: status
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
      {config.text}
    </span>
  );
};

export default TransactionTable;