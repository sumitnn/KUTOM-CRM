import { useGetWalletQuery } from "../../features/walletApi";

const WalletSummaryCard = ({ onAddAmount }) => {
  const { data, isLoading, error } = useGetWalletQuery();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  return (
    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl rounded-2xl p-6 w-full max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-semibold"> Current Wallet Balance</h2>
        <p className="text-3xl font-bold mt-2">₹{data?.balance}</p>
      </div>
      <button
        onClick={onAddAmount}
        className="btn px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-100 transition duration-200 shadow-md"
      >
        Add Wallet Amount
      </button>
    </div>
  );
};

export default WalletSummaryCard;
