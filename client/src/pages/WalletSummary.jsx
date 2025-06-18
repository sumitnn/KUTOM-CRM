

const WalletSummary = ({ totalWithdrawals,totalSales,currentBalance}) => {
  return (
    <div className="bg-base-200 p-4 md:p-6 rounded-xl shadow-lg mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-extrabold">Wallet Overview</h2>
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-r from-primary to-primary-focus text-white rounded-xl p-4 md:p-6 shadow hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm md:text-base  text-black uppercase font-extrabold  tracking-wider opacity-80">
                Current Balance
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-2">
              ₹{currentBalance}
              </p>
            </div>
            <WalletIcon />
          </div>
        </div>

        <div className="bg-gradient-to-r from-success to-success-focus text-white rounded-xl p-4 md:p-6 shadow hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm md:text-base text-black font-extrabold uppercase tracking-wider opacity-80">
                Total Sales
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-2">
              ₹{totalSales}
              </p>
            </div>
            <DepositIcon />
          </div>
        </div>

        <div className="bg-gradient-to-r from-error to-error-focus text-white rounded-xl p-4 md:p-6 shadow hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm md:text-base uppercase text-black tracking-wider font-extrabold  opacity-80">
                Total Withdrawals
              </p>
              <p className="text-2xl md:text-3xl font-bold mt-2">
              ₹{totalWithdrawals}
              </p>
            </div>
            <WithdrawalIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

const WalletIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 opacity-70"
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
);

const DepositIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 opacity-70"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WithdrawalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 opacity-70"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default WalletSummary;