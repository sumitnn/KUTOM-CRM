import React, { useState } from "react";
import WalletSummaryCard from "./WalletSummaryCard";
import WalletTransactionTable from "./WalletTransactionTable";
import AddWalletAmountModal from "./AddWalletAmountModal";


const WalletManagementPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-[#C42847]">Wallet Management</h1>
        <p className="text-lg text-gray-500">Smart wallet. Smarter moves. Manage your funds with ease and transparency.</p>
      </div>

      {/* Wallet Summary Section */}
      <section className="my-4">
        <WalletSummaryCard onAddAmount={() => setShowAddModal(true)} />
      </section>


      {/* Transaction History */}
      <section className="my-25">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">💳 Your Transaction History</h2>
        <p className="text-sm font-bold text-gray-500 mb-4">Track all your wallet activity in real-time.</p>
        <WalletTransactionTable />
      </section>

      

      {/* Modal */}
      <AddWalletAmountModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};

export default WalletManagementPage;
