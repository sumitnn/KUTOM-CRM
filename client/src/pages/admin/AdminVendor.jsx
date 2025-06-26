import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  useFetchVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorStatusMutation,
} from "../../features/vendor/VendorApi";
import {
  useGetAllAccountApplicationsQuery,
  useApproveAccountApplicationMutation,
  useRejectAccountApplicationMutation,
} from "../../features/newapplication/newAccountApplicationApi";

import VendorTable from '../../components/vendor/VendorTable';
import CreateVendorModal from '../../components/vendor/CreateVendorModal';
import RejectReasonModal from '../../components/RejectReasonModal';

const AdminVendor = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    searchType: 'email'
  });

  // Application APIs (new, pending, rejected)
  const { 
    data: applications = [], 
    isLoading: isLoadingApplications, 
    refetch: refetchApplications 
  } = useGetAllAccountApplicationsQuery(
    ['new', 'pending', 'rejected'].includes(activeTab) 
      ? { 
          status: activeTab,
          search: searchParams.searchTerm,
        search_type: searchParams.searchType,
         role: 'vendor'
          
        } 
      : null,
    { skip: !['new', 'pending', 'rejected'].includes(activeTab) }
  );

  // Vendor APIs (active, suspended)
  const { 
    data: vendors = [], 
    isLoading: isLoadingVendors, 
    refetch: refetchVendors 
  } = useFetchVendorsQuery(
    ['active', 'suspended'].includes(activeTab)
      ? { 
          status: activeTab,
          search: searchParams.searchTerm,
          search_type: searchParams.searchType
        }
      : null,
    { skip: !['active', 'suspended'].includes(activeTab) }
  );

  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorStatusMutation();
  const [approveApplication] = useApproveAccountApplicationMutation();
  const [rejectApplication] = useRejectAccountApplicationMutation();

  const isLoading = isLoadingApplications || isLoadingVendors;

  const getCurrentData = () => {
    if (['new', 'pending', 'rejected'].includes(activeTab)) {
      return applications;
    }
    return vendors;
  };

  const handleSearch = (searchTerm, searchType) => {
    setSearchParams({ searchTerm, searchType });
  };

  const handleAddVendor = async (vendorData) => {
    setError(null);
    try {
      await createVendor(vendorData).unwrap();
      toast.success('Vendor created successfully!');
      setModalOpen(false);
      refetchVendors();
    } catch (err) {
      const errorMessage = err?.data?.message || 'Failed to create vendor';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleApproveApplication = async (id) => {
    try {
      await approveApplication(id).unwrap();
      toast.success('Application approved,User Account Created Successfully');
      refetchApplications();
    } catch (err) {
      toast.error(err?.error||"something went wrong");
    }
  };

  const handleRejectApplication = async (id, reason) => {
    try {
      await rejectApplication({ id, reason }).unwrap();
      toast.success('Application rejected!');
      setRejectModalOpen(false);
      refetchApplications();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject application');
    }
  };

  const handleToggleVendorStatus = async (id) => {
    try {
      const newStatus = activeTab === 'active' ? 'suspended' : 'active';
      await updateVendor({ id, data: { status: newStatus } }).unwrap();
      toast.success(`Vendor ${newStatus === 'active' ? 'activated' : 'suspended'}!`);
      refetchVendors();
    } catch (err) {
      toast.error('Failed to update vendor status');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Vendor Management</h1>
        {activeTab === 'active' && (
          <button 
            className="btn btn-primary animate-bounce" 
            onClick={() => setModalOpen(true)}
          >
            + Create New Vendor
          </button>
        )}
      </div>

      <VendorTable 
        data={getCurrentData()}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onApprove={handleApproveApplication}
        onReject={(id) => {
          if (['new', 'pending', 'rejected'].includes(activeTab)) {
            setSelectedApplication(id);
            setRejectModalOpen(true);
          } else {
            handleToggleVendorStatus(id);
          }
        }}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {modalOpen && (
        <CreateVendorModal
          onClose={() => {
            setModalOpen(false);
            setError(null);
          }}
          onAddVendor={handleAddVendor}
          error={error}
        />
      )}

      {rejectModalOpen && (
        <RejectReasonModal
          onClose={() => setRejectModalOpen(false)}
          onSubmit={(reason) => handleRejectApplication(selectedApplication, reason)}
        />
      )}
    </div>
  );
};

export default AdminVendor;