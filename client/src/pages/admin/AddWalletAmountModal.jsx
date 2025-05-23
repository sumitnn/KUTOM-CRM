const AddWalletAmountModal = ({ open, onClose }) => {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
          <h3 className="text-lg font-bold">Add Wallet Amount</h3>
          <select className="select select-bordered w-full">
            <option disabled selected>Select User Type</option>
            <option>Vendor</option>
            <option>Seller</option>
            <option>Stockist</option>
          </select>
          <input type="text" placeholder="User Name or ID" className="input input-bordered w-full" />
          <input type="number" placeholder="Amount (₹)" className="input input-bordered w-full" />
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary">Add</button>
          </div>
        </div>
      </div>
    );
  };
  
  export default AddWalletAmountModal;
  