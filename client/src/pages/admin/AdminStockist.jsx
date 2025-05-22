import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useFetchStockistQuery,
  useCreateStockistMutation,
  useUpdateStockistMutation,
  useDeleteStockistMutation,
} from '../../features/stockist/stockistApi';
import StockistTable from '../../components/stockist/StockistTable';
import CreateStockistModal from '../../components/stockist/CreateStockistModal';

const AdminStockist = () => {
  const { data: stockist = [], isLoading, refetch } = useFetchStockistQuery();
  const [createStockist, { isLoading: creating }] = useCreateStockistMutation();
  const [updateStockist] = useUpdateStockistMutation();
  const [deleteStockist] = useDeleteStockistMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleAddStockist = async (stockistData) => {
    setError(null);
    try {
      await createStockist(stockistData).unwrap();
      toast.success('stockist created successfully!');
      setModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Create vendor error:', err);
  
      // Extract error message from the nested message.email array
      const errorMessage =
        err?.data?.message?.email?.[0] ||    
        err?.data?.message ||                 
        err?.error ||                       
        'Failed to create stockist';
  
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditStockist = async (id, data) => {
    try {
      await updateStockist({ id, data }).unwrap();
      toast.success('stockist updated successfully!');
      refetch();
    } catch (err) {
      console.error('Update stockist error:', err);
      toast.error('Failed to update stockist');
    }
  };

  const handleDeleteStockist = async (id) => {
    try {
      await deleteStockist(id).unwrap();
      toast.success('Stockist deleted successfully!');
      refetch();
    } catch (err) {
      console.error('Delete stockist error:', err);
      toast.error('Failed to delete stockist');
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

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <StockistTable stockist={stockist} onEdit={handleEditStockist} onDelete={handleDeleteStockist} />
      )}

      {modalOpen && (
        <CreateStockistModal
          onClose={() => {
            setModalOpen(false);
            setError(null);
          }}
          onAddVendor={handleAddStockist}
          loading={creating}
          error={error}
        />
      )}
    </div>
  );
};

export default AdminStockist;
