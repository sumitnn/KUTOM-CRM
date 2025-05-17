import React, { useState } from 'react';
import VendorTable from '../../components/vendor/VendorTable';
import CreateVendorModal from "../../components/vendor/CreateVendorModal";

const AdminVendor = () => {
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
          All Vendors ({vendors.length})
        </h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create New Vendor
        </button>
      </div>

      {/* Table */}
      <VendorTable vendors={vendors} setVendors={setVendors} />

      {/* Modal */}
      {isModalOpen && (
        <CreateVendorModal
          onClose={() => setIsModalOpen(false)}
          onAddVendor={handleAddVendor}
        />
      )}
    </div>
  );
};

export default AdminVendor;
