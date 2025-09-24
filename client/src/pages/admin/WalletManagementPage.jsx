import React, { useState } from "react";
import WalletSummaryCard from "./WalletSummaryCard";
import WalletTransactionTable from "./WalletTransactionTable";
import AddWalletAmountModal from "./AddWalletAmountModal";

const WalletManagementPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Wallet Management
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Smart wallet. Smarter moves. Manage your funds with ease and transparency.
          </p>
        </div>

        {/* Wallet Summary Section */}
        <section className="mb-8">
          <WalletSummaryCard onAddAmount={() => setShowAddModal(true)} />
        </section>

        {/* Transaction History Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-orange-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Transaction History</h2>
                  <p className="text-orange-100 text-sm">Track all your wallet activity in real-time</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 text-orange-100">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Updates</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1">
            <WalletTransactionTable />
          </div>
        </section>
      </div>

      {/* Modal */}
      <AddWalletAmountModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};

export default WalletManagementPage;