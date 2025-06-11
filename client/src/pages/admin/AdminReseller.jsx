import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    useDeleteResellerMutation,
    useUpdateResellerMutation,
    useCreateResellerMutation,
    useFetchResellerQuery,
} from '../../features/reseller/resellerApi';

import ResellerCardList from '../../components/reseller/ResellerCardList';
import CreateResellerModal from '../../components/reseller/CreateResellerModal';

const AdminReseller = () => {
  const { data: reseller = [], isLoading, refetch } = useFetchResellerQuery();
  const [createReseller, { isLoading: creating }] = useCreateResellerMutation();
  const [updateReseller] = useUpdateResellerMutation();
  const [deleteReseller] = useDeleteResellerMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleAddReseller = async (resellerData) => {
    setError(null);
    try {
      await createReseller(resellerData).unwrap();
      toast.success('reseller created successfully!');
      setModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Create reseller error:', err);
  
      // Extract error message from the nested message.email array
      const errorMessage =
        err?.data?.message?.email?.[0] ||    
        err?.data?.message ||                 
        err?.error ||                       
        'Failed to create reseller';
  
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditReseller = async (id, data) => {
    try {
      await updateReseller({ id, data }).unwrap();
      toast.success('reseller updated successfully!');
      refetch();
    } catch (err) {
      console.error('Update reseller error:', err);
      toast.error('Failed to update reseller');
    }
  };

  const handleDeleteReseller = async (id) => {
    try {
      await deleteReseller(id).unwrap();
      toast.success('reseller deleted successfully!');
      refetch();
    } catch (err) {
      console.error('Delete reseller error:', err);
      toast.error('Failed to delete reseller');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">All Reseller ({reseller.length})</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Create New Reseller
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ResellerCardList reseller={reseller} onEdit={handleEditReseller} onDelete={handleDeleteReseller} />
      )}

      {modalOpen && (
        <CreateResellerModal
          onClose={() => {
            setModalOpen(false);
            setError(null);
           
          }}
          onAddVendor={handleAddReseller}
          loading={creating}
          error={error}
        />
      )}
    </div>
  );
};

export default AdminReseller;
