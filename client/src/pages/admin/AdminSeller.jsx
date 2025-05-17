import React, { useState } from 'react';

import CreateSellerModal from '../../components/seller/CreateSellerModal';
import SellerTable from '../../components/seller/SellerTable';

const AdminSeller = () => {
  const [vendors, setVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddVendor = (vendor) => {
    setVendors([...vendors, vendor]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          All Seller ({vendors.length})
        </h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create New Seller
        </button>
      </div>

      {/* Table */}
      <SellerTable vendors={vendors} setVendors={setVendors} />

      {/* Modal */}
      {isModalOpen && (
        <CreateSellerModal
          onClose={() => setIsModalOpen(false)}
          onAddVendor={handleAddVendor}
        />
      )}
    </div>
  );
};

export default AdminSeller;
