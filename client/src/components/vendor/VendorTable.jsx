import React, { useState, lazy, Suspense } from 'react';
import VendorTableRow from './VendorTableRow';
import { FaSync } from 'react-icons/fa';

const ViewVendorModal = lazy(() => import('./ViewVendorModal'));
const ProfileReviewModal = lazy(() => import('../ProfileReviewModal'));
const KycConfirmationModal = lazy(() => import('../KycConfirmationModal'));

const statusTabs = [
  { id: 'new', label: 'New Request' },
  { id: 'pending', label: 'Processing' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Inactive' },
];

export default function VendorTable({ 
  data,
  activeTab,
  setActiveTab,
  onApprove, 
  onReject,
  onSearch,
  onRefresh,
  isLoading,
  isLoadingAction,
  currentActionId,
  MarkFullKyc,
  role
}) {
  const [viewVendor, setViewVendor] = useState(null);
  const [reviewVendor, setReviewVendor] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('email');

  const handleSearch = () => {
    onSearch(searchTerm, searchType);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('', searchType);
  };

  const handleRefreshAll = () => {
    onRefresh('all');
  };

 const handleConfirmKyc = async () => {
    if (selectedVendor) {
      await MarkFullKyc(selectedVendor?.id); 
      setShowKycModal(false);
    }
  };

  const getTableHeaders = () => {
    const getRoleIdLabel = () => {
    switch (role) {
      case 'stockist':
        return 'Stockist ID';
      case 'reseller':
        return 'Reseller ID';
      default:
        return 'Vendor ID';
    }
  };
    switch (activeTab) {
      case 'new':
        return ['Sr.No', 'Created Date', 'Full Name', 'Email', 'Phone Number', 'Actions'];
      case 'pending':
        return ['Sr.No', 'Created Date', 'Name', 'Email', 'Phone', 'Profile %', 'Actions'];
      case 'rejected':
        return ['Sr.No', 'Created Date', 'Email', 'Full Name', 'Phone', 'Actions'];
      case 'active':
      case 'suspended':
        return [
        getRoleIdLabel(), 
        'Created Date',
        'Name',
        'Email',
        'Phone',
        'Business',
        'Location',
        'Actions',
      ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-2 md:p-4">
      {/* Tabs */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab flex-1 min-w-fit ${activeTab === tab.id ? 'tab-active bg-white shadow-sm' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
            >
              <strong>{tab.label}</strong>
            </button>
          ))}
        </div>
        
        <button 
          className="btn btn-ghost btn-sm md:btn-md"
          onClick={handleRefreshAll}
          disabled={isLoading}
        >
          <FaSync /> Refresh All
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="join w-full">
          <select 
            className="join-item select select-bordered select-sm md:select-md"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="name">Name</option>
            <option value="business">Business</option>
          </select>
          <input
            type="text"
            className="join-item input input-bordered w-full input-sm md:input-md"
            placeholder={`Search by ${searchType}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            className="join-item btn btn-primary btn-sm md:btn-md"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Search
          </button>
          <button 
            className="join-item btn btn-ghost btn-sm md:btn-md"
            onClick={handleClearSearch}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="table table-zebra table-pin-rows">
            <thead className="bg-gray-50 sticky top-0 font-bold text-black">
              <tr>
                {getTableHeaders().map(header => (
                  <th key={header} className="sticky top-0">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={getTableHeaders().length} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                  data.map((item, index) => (
                  
                  <VendorTableRow
                  key={item.id}
                  vendor={item}
                  index={index}
                  activeTab={activeTab}
                  onView={() => setViewVendor(item)}
                  onReview={() => setReviewVendor(item)}
                  onApprove={onApprove}
                  onReject={onReject}
                  onToggleStatus={onReject} 
                  onMarkKycCompleted={() => {
                    setSelectedVendor(item);
                    setShowKycModal(true);
                  }}
                  onRefresh={onRefresh}
                  isLoadingAction={isLoadingAction}
                  currentActionId={currentActionId}
                  setShowKycModal={setShowKycModal}
                  setSelectedVendor={setSelectedVendor}
                />
                ))
              ) : (
                <tr>
                  <td colSpan={getTableHeaders().length} className="text-center py-8 text-gray-500">
                    No {activeTab === 'new' ? 'applications' : role } found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={<div className="loading loading-spinner loading-md"></div>}>
        {viewVendor && (
          <ViewVendorModal 
            user={viewVendor} 
            onClose={() => setViewVendor(null)} 
          />
        )}
        {reviewVendor && (
          <ProfileReviewModal
            vendor={reviewVendor}
            role={role}
            onClose={() => setReviewVendor(null)}
          />
        )}
        {showKycModal && (
        <KycConfirmationModal
          onConfirm={handleConfirmKyc}
          onCancel={() => setShowKycModal(false)}
          isLoading={isLoadingAction && currentActionId === selectedVendor?.user?.id}
        />
      )}
      </Suspense>
    </div>
  );
}