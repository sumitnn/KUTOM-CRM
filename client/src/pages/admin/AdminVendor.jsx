import { useState, useEffect } from "react";
import { fetchVendors, createVendor, updateVendor, deleteVendor } from "../../api/Vendor";
import VendorTable from "../../components/vendor/VendorTable";
import CreateVendorModal from "../../components/vendor/CreateVendorModal";


const AdminVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await fetchVendors();
      setVendors(res.data);
    } catch (err) {

      console.log("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleAddVendor = async (vendorData) => {
    try {
      setLoading(true);
      const res = await createVendor(vendorData);
    
      if (res.status === 201) {
        loadVendors(); 
      setModalOpen(false);
      }
      
    } catch (err) {
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVendor = async (id, data) => {
    try {
      await updateVendor(id, data);
   
      loadVendors();
    } catch (err) {
      
      toast.error("Failed to update vendor");
    }
  };

  const handleDeleteVendor = async (id) => {
    try {
      await deleteVendor(id);
      
      loadVendors();
    } catch (err) {
    
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">All Vendors ({vendors.length})</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Create New Vendor
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <VendorTable vendors={vendors} onEdit={handleEditVendor} onDelete={handleDeleteVendor} />
      )}

      {modalOpen && (
        <CreateVendorModal
          onClose={() => setModalOpen(false)}
          onAddVendor={handleAddVendor}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};

export default AdminVendor;
