import React from 'react';

const WalletSummary = ({ totalWithdrawals, totalSales, currentBalance }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Financial Overview
          </h2>
          <div className="text-gray-600 text-sm mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Real-time financial dashboard
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Live Updates</span>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded-md"></div>
            </div>
            <div className="text-gray-700 text-sm font-semibold uppercase">
              Available Balance
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ₹{currentBalance?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">Ready for withdrawals</span>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded-md"></div>
            </div>
            <div className="text-gray-700 text-sm font-semibold uppercase">
              Total Revenue
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ₹{totalSales?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-green-600 font-medium">All-time sales</span>
          </div>
        </div>

        {/* Total Withdrawals Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <div className="w-6 h-6 bg-orange-600 rounded-md"></div>
            </div>
            <div className="text-gray-700 text-sm font-semibold uppercase">
              Total Withdrawn
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ₹{totalWithdrawals?.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-orange-600 font-medium">Successfully processed</span>
          </div>
        </div>
      </div>

      {/* Analytics Footer */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-2">Daily Average</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{Math.round(totalSales / 30) || '0'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-2">Withdrawal Rate</div>
            <div className="text-xl font-bold text-gray-900">
              {totalSales > 0 ? ((totalWithdrawals / totalSales) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-2">Available Ratio</div>
            <div className="text-xl font-bold text-gray-900">
              {totalSales > 0 ? ((currentBalance / totalSales) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium mb-2">Last Sync</div>
            <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Now
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSummary;