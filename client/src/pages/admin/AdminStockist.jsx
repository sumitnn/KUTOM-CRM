import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useFetchStockistsQuery,
  useUpdateStockistStatusMutation,
} from "../../features/stockist/StockistApi";

import {
  useGetAllAccountApplicationsQuery,
  useApproveAccountApplicationMutation,
  useRejectAccountApplicationMutation,
  useUpdateUserAccountKycMutation
} from "../../features/newapplication/newAccountApplicationApi";

import VendorTable from '../../components/vendor/VendorTable';
import RejectReasonModal from '../../components/RejectReasonModal';

const statusTabs = [
  { id: 'new', label: 'New Request' },
  { id: 'pending', label: 'Processing' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Inactive' },
];

export default function AdminStockist() {
  const [activeTab, setActiveTab] = useState('new');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    searchType: 'email'
  });
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [currentActionId, setCurrentActionId] = useState(null);

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
          role: 'stockist'
        } 
      : null,
    { skip: !['new', 'pending', 'rejected'].includes(activeTab) }
  );

  // Stockist APIs (active, suspended)
  const { 
    data: stockists = [], 
    isLoading: isLoadingStockists, 
    refetch: refetchStockists 
  } = useFetchStockistsQuery(
    ['active', 'suspended'].includes(activeTab)
      ? { 
          status: activeTab,
          search: searchParams.searchTerm,
          search_type: searchParams.searchType
        }
      : null,
    { skip: !['active', 'suspended'].includes(activeTab) }
  );

  const [updateStockist] = useUpdateStockistStatusMutation();
  const [approveApplication] = useApproveAccountApplicationMutation();
  const [rejectApplication] = useRejectAccountApplicationMutation();
  const [UpdateKyc] = useUpdateUserAccountKycMutation();

  const isLoading = isLoadingApplications || isLoadingStockists;

  const getCurrentData = () => {
    if (['new', 'pending', 'rejected'].includes(activeTab)) {
      return applications;
    }
    return stockists;
  };

  const handleSearch = (searchTerm, searchType) => {
    setSearchParams({ searchTerm, searchType });
  };

  const handleRefresh = async (id) => {
    try {
      if (id === 'all') {
        if (['new', 'pending', 'rejected'].includes(activeTab)) {
          await refetchApplications();
        } else {
          await refetchStockists();
        }
        toast.success('Data refreshed successfully');
      }
    } catch (err) {
      toast.error('Failed to refresh data');
    }
  };

  const handleMarkKycCompleted = async (userId) => {
  setIsLoadingAction(true);
    

  try {
    await UpdateKyc({ userId }).unwrap();
    toast.success('KYC marked as completed successfully');
    refetchApplications();
  } catch (err) {
    toast.error(err?.data?.message || "Something went wrong while verifying KYC");
  } finally {
    setIsLoadingAction(false);
   
  }
};


  const handleApproveApplication = async (id, actionType = 'approve') => {
    setIsLoadingAction(true);
    setCurrentActionId(actionType);
    try {
      await approveApplication(id).unwrap();
      toast.success(actionType === 'kyc' 
        ? 'KYC marked as completed successfully' 
        : 'Application Status Updated');
      refetchApplications();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    } finally {
      setIsLoadingAction(false);
      setCurrentActionId(null);
    }
  };

  const handleRejectApplication = async (id, reason) => {
    setIsLoadingAction(true);
    setCurrentActionId('reject');
    try {
      await rejectApplication({ id, reason }).unwrap();
      toast.success('Application rejected!');
      setRejectModalOpen(false);
      refetchApplications();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject application');
    } finally {
      setIsLoadingAction(false);
      setCurrentActionId(null);
    }
  };

  const handleToggleStockistStatus = async (id) => {
    setIsLoadingAction(true);
    setCurrentActionId('status');
    try {
      const newStatus = activeTab === 'active' ? 'suspended' : 'active';
      await updateStockist({ id, data: { status: newStatus } }).unwrap();
      toast.success("User Profile Status Updated");
      refetchStockists();
    } catch (err) {
      toast.error('Failed to update stockist status');
    } finally {
      setIsLoadingAction(false);
      setCurrentActionId(null);
    }
  };

  return (
    <div className="p-2 md:p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Stockist Management</h1>
      </div>

      <VendorTable 
        data={getCurrentData()}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onApprove={handleApproveApplication}
        MarkFullKyc={handleMarkKycCompleted}
        onReject={(id) => {
          if (['new', 'pending', 'rejected'].includes(activeTab)) {
            setSelectedApplication(id);
            setRejectModalOpen(true);
          } else {
            handleToggleStockistStatus(id);
          }
        }}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isLoadingAction={isLoadingAction}
        currentActionId={currentActionId}
        role="stockist"
      />

      {rejectModalOpen && (
        <RejectReasonModal
          onClose={() => setRejectModalOpen(false)}
          onSubmit={(reason) => handleRejectApplication(selectedApplication, reason)}
          isLoading={isLoadingAction && currentActionId === 'reject'}
        />
      )}
    </div>
  );
}