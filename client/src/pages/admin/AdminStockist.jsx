import React, { useState } from 'react';
import StockistTable from '../../components/stockist/StockistTable';
import CreateStockistModal from '../../components/stockist/CreateStockistModal';


const AdminStockist = () => {
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
          All Stockist ({vendors.length})
        </h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create New Stockist
        </button>
      </div>

      {/* Table */}
      <StockistTable vendors={vendors} setVendors={setVendors} />

      {/* Modal */}
      {isModalOpen && (
        <CreateStockistModal
          onClose={() => setIsModalOpen(false)}
          onAddVendor={handleAddVendor}
        />
    
        
        
      )}
    </div>
  );
};

export default AdminStockist;
