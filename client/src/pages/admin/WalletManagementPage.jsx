import React, { useState } from "react";
import WalletSummaryCard from "./WalletSummaryCard";
import WalletTransactionTable from "./WalletTransactionTable";
import AddWalletAmountModal from "./AddWalletAmountModal";
import TopUpRequestsTable from "./TopUpRequestsTable";

const WalletManagementPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-10">
      <h1 className="text-3xl font-bold text-center mb-6">Wallet Management</h1>

      <WalletSummaryCard onAddAmount={() => setShowAddModal(true)} />

      <section>
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <WalletTransactionTable />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Top-Up Requests (via UPI)</h2>
        <TopUpRequestsTable />
      </section>

      <AddWalletAmountModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};

export default WalletManagementPage;
