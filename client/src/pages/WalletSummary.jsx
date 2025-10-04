import React from 'react';

const WalletSummary = ({ totalWithdrawals, totalSales, currentBalance }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-8 hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Wallet Overview
          </h2>
          <p className="text-gray-500 text-sm mt-1">Real-time financial summary</p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2 rounded-full border border-orange-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Live</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Balance Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
          <div className="relative bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform group-hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
                  Current Balance
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{currentBalance?.toLocaleString() || '0'}
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <WalletIcon />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Available for withdrawal</p>
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
          <div className="relative bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform group-hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
                  Total Sales
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{totalSales?.toLocaleString() || '0'}
                </p>
                <div className="flex items-center mt-2">
                  <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-green-600 font-medium">Revenue</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DepositIcon />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Lifetime sales amount</p>
            </div>
          </div>
        </div>

        {/* Total Withdrawals Card */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
          <div className="relative bg-white rounded-xl p-6 shadow-lg border border-gray-100 transform group-hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
                  Total Withdrawals
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{totalWithdrawals?.toLocaleString() || '0'}
                </p>
                <div className="flex items-center mt-2">
                  <svg className="w-3 h-3 text-orange-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-orange-600 font-medium">Withdrawn</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <WithdrawalIcon />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Total amount withdrawn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Daily Avg.</p>
            <p className="font-semibold text-gray-800">₹{(totalSales / 30)?.toFixed(0) || '0'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Withdrawal %</p>
            <p className="font-semibold text-gray-800">
              {totalSales > 0 ? ((totalWithdrawals / totalSales) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Available %</p>
            <p className="font-semibold text-gray-800">
              {totalSales > 0 ? ((currentBalance / totalSales) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-semibold text-gray-800">Now</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modern Icon Components
const WalletIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-blue-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const DepositIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-green-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WithdrawalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-orange-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

export default WalletSummary;