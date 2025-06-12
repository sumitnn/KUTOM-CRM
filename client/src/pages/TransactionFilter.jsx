// components/wallet/TransactionFilters.jsx
const TransactionFilter = ({ filters, onFilterChange }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="label">
            <span className="label-text font-semibold">Type</span>
          </label>
          <select
            name="type"
            value={filters.type}
            onChange={onFilterChange}
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
            onChange={onFilterChange}
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
            onChange={onFilterChange}
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
            onChange={onFilterChange}
            className="input input-bordered w-full"
            min={filters.fromDate || undefined}
          />
        </div>
      </div>
    );
  };
  
  export default TransactionFilter;