import { useVendors } from "../../context/VendorContext";
import VendorTable from "../../components/vendor/VendorTable";
import CreateVendorModal from "../../components/vendor/CreateVendorModal";
import { useState } from "react";

const AdminVendor = () => {
  const {
    vendors,
    loading,
    error,
    addVendor,
    editVendor,
    removeVendor,
  } = useVendors();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddVendor = async (vendorData) => {
    const res = await addVendor(vendorData);
  
    if (res.success) {
      toast.success("Vendor added successfully!");
     
    } else {
      toast.error(res.error?.message || "Failed to add vendor");
    }
  };
  
  

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          All Vendors ({vendors.length})
        </h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create New Vendor
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <VendorTable
          vendors={vendors}
          onEdit={editVendor}
          onDelete={removeVendor}
        />
      )}

      {isModalOpen && (
        <CreateVendorModal
          onClose={() => setIsModalOpen(false)}
          onAddVendor={handleAddVendor}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};

export default AdminVendor;
