import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useFetchVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} from "../../features/vendor/VendorApi";

import VendorTable from '../../components/vendor/VendorTable';
import CreateVendorModal from '../../components/vendor/CreateVendorModal';

const AdminVendor = () => {
  const { data: vendors = [], isLoading, refetch } = useFetchVendorsQuery();
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleAddVendor = async (vendorData) => {
    setError(null);
    try {
      await createVendor(vendorData).unwrap();
      toast.success('Vendor created successfully!');
      setModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Create vendor error:', err);
  
      // Extract error message from the nested message.email array
      const errorMessage =
        err?.data?.message?.email?.[0] ||    
        err?.data?.message ||                 
        err?.error ||                       
        'Failed to create vendor';
  
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditVendor = async (id, data) => {
    try {
      await updateVendor({ id, data }).unwrap();
      toast.success('Vendor updated successfully!');
      refetch();
    } catch (err) {
      console.error('Update vendor error:', err);
      toast.error('Failed to update vendor');
    }
  };

  const handleDeleteVendor = async (id) => {
    try {
      await deleteVendor(id).unwrap();
      toast.success('Vendor deleted successfully!');
      refetch();
    } catch (err) {
      console.error('Delete vendor error:', err);
      toast.error('Failed to delete vendor');
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

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <VendorTable vendors={vendors} onEdit={handleEditVendor} onDelete={handleDeleteVendor} />
      )}

      {modalOpen && (
        <CreateVendorModal
          onClose={() => {
            setModalOpen(false);
            setError(null);
          }}
          onAddVendor={handleAddVendor}
          loading={creating}
          error={error}
        />
      )}
    </div>
  );
};

export default AdminVendor;
