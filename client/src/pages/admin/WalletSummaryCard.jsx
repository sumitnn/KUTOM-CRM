const WalletSummaryCard = ({ onAddAmount }) => {
    return (
      <div className="card bg-base-100 shadow-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Admin Wallet Balance</h2>
          <p className="text-2xl text-success mt-2">₹35,000</p>
        </div>
        <button onClick={onAddAmount} className="btn btn-primary">
          Add Wallet Amount
        </button>
      </div>
    );
  };
  
  export default WalletSummaryCard;
  