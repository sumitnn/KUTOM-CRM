import { useUpdateWalletAmountMutation } from "../../features/walletApi";
import { useState } from "react";
import { toast } from "react-toastify";


const AddWalletAmountModal = ({ open, onClose }) => {
  const [userEmail, setUserEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("CREDIT");
  const [errorMsg, setErrorMsg] = useState("");

  const [updateWallet, { isLoading }] = useUpdateWalletAmountMutation();

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!userEmail.trim() || !amount.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    try {
      await updateWallet({
        userEmail,
        data: {
          amount,
          transaction_type: transactionType,
          transaction_status: "SUCCESS",
        },
      }).unwrap();

      // Reset fields after successful submission
      toast.success(`Amount Added Successfully`);
      setUserEmail("");
      setAmount("");
      setTransactionType("CREDIT");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err);
      setErrorMsg("Failed to update wallet. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-center">Add Wallet Amount</h3>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm">
            {errorMsg}
          </div>
        )}

        <input
          type="email"
          placeholder="User Email"
          className="input input-bordered w-full"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
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
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWalletAmountModal;
