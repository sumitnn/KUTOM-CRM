import React, { useState,useEffect } from 'react';
import StockistTable from '../../components/stockist/StockistTable';
import CreateStockistModal from '../../components/stockist/CreateStockistModal';
import { toast } from "react-toastify";
import { fetchStockist, createStockist, updateStockist, deleteStockist } from "../../api/Stockist";



const AdminStockist = () => {
  const [stockist, setStockist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadStockist = async () => {
    setLoading(true);
    try {
      const res = await fetchStockist();
      setStockist(res.data);
    } catch (err) {

      console.log("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockist();
  }, []);

  const handleAddStockist = async (stockistData) => {
    try {
      setLoading(true);
      const res = await createStockist(stockistData);
    
      if (res.status === 201) {
        loadStockist(); 
        setModalOpen(false);
        
      }
      toast.success("Stockist Account created successfully!");
    } catch (err) {
      console.log(err);
      setError(err);
      toast.error(err.response.data.message || "Failed to create stockist");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStockist = async (id, data) => {
    try {
      const res=await updateStockist(id, data);
      if (res.status === 200) {
        loadStockist();
        toast.success("Stockist Account updated successfully!");
      }
      
    } catch (err) {
      
      toast.error("Failed to update stockist account");
      console.log(err);
    }
  };

  const handleDeleteStockist = async (id) => {
    try {
      await deleteStockist(id);
      
      loadStockist();
      toast.success("Stockist Account deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete Stockist Account");
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">All Stockist ({stockist.length})</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Create New Stockist
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <StockistTable stockists={stockist} onEdit={handleEditStockist} onDelete={handleDeleteStockist} />
      )}

      {modalOpen && (
        <CreateStockistModal
          onClose={() => setModalOpen(false)}
          onAddStockist={handleAddStockist}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};

export default AdminStockist;
