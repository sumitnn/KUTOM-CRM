import React, { useState, lazy, Suspense } from "react";

// Lazy imports for better performance
const WalletSummaryCard = lazy(() => import("./WalletSummaryCard"));
const WalletTransactionTable = lazy(() => import("./WalletTransactionTable"));
const AddWalletAmountModal = lazy(() => import("./AddWalletAmountModal"));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

const WalletManagementPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-red-50/30 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header Section */}
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-3 sm:mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
            <svg 
              className="w-6 h-6 sm:w-8 sm:h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" 
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            Wallet Management
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2 sm:px-0 leading-relaxed">
            Smart wallet. Smarter moves. Manage your funds with ease and transparency.
          </p>
        </div>

        {/* Wallet Summary Section */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <Suspense fallback={<LoadingFallback />}>
            <WalletSummaryCard onAddAmount={() => setShowAddModal(true)} />
          </Suspense>
        </section>

        {/* Transaction History Section */}
        <section className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-white/50 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-gradient-to-r from-blue-700 to-cyan-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1 sm:p-2 bg-white/20 rounded-lg">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    Transaction History
                  </h2>
                  <p className="text-orange-100 text-xs sm:text-sm">
                    Track all your wallet activity in real-time
                  </p>
                </div>
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center space-x-1 sm:space-x-2 text-orange-100">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium">Live Updates</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1 sm:p-2 lg:p-4">
            <Suspense fallback={<LoadingFallback />}>
              <WalletTransactionTable />
            </Suspense>
          </div>
        </section>
      </div>

      {/* Modal */}
      <Suspense fallback={null}>
        <AddWalletAmountModal 
          open={showAddModal} 
          onClose={() => setShowAddModal(false)} 
        />
      </Suspense>
    </div>
  );
};

export default WalletManagementPage;