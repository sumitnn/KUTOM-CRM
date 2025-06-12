// components/wallet/TransactionModal.jsx
const TransactionModal = ({
    isOpen,
    onClose,
    formData,
    onFormChange,
    onSubmit,
    isSubmitting,
  }) => {
    if (!isOpen) return null;
  
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">New Transaction</h3>
          <form onSubmit={onSubmit}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Transaction Type</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={onFormChange}
                className="select select-bordered w-full"
              >
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
              </select>
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Amount</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={onFormChange}
                className="input input-bordered w-full"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Description (Optional)</span>
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={onFormChange}
                className="input input-bordered w-full"
                placeholder="Transaction description"
              />
            </div>
            <div className="modal-action">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  export default TransactionModal;