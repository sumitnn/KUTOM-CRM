import { useUpdateWalletAmountMutation } from "../../features/walletApi";
import { useState } from "react";

const AddWalletAmountModal = ({ open, onClose }) => {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("CREDIT");

  const [updateWallet, { isLoading }] = useUpdateWalletAmountMutation();

  const handleSubmit = async () => {
    if (!userId || !amount) return alert("All fields are required");
    try {
      await updateWallet({
        userId,
        data: {
          amount,
          transaction_type: transactionType,
          transaction_status: "SUCCESS",
        },
      }).unwrap();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update wallet.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
        <h3 className="text-lg font-bold">Add Wallet Amount</h3>
        <input
          type="text"
          placeholder="User ID"
          className="input input-bordered w-full"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount (₹)"
          className="input input-bordered w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="select select-bordered w-full"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
        >
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWalletAmountModal;
