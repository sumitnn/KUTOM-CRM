import React, { useState } from 'react';
import VendorTableRow from './VendorTableRow';
import ViewVendorModal from './ViewVendorModal';
import ProfileReviewModal from '../ProfileReviewModal';
import ProgressBar from '../ProgressBar';

const statusTabs = [
  { id: 'new', label: 'New Request' },
  { id: 'pending', label: 'Request Processing' },
  { id: 'rejected', label: 'Rejected Request' },
  { id: 'active', label: 'Active Users' },
  { id: 'suspended', label: 'Deactive Users' },
];

export default function VendorTable({ 
  data,
  activeTab,
  setActiveTab,
  onApprove, 
  onReject,
  onSearch,
  isLoading 
}) {
  const [viewVendor, setViewVendor] = useState(null);
  const [reviewVendor, setReviewVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('email');

  const handleSearch = () => {
    onSearch(searchTerm, searchType);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('', searchType);
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'new':
        return ['Sr.No', 'Created Date', 'Full Name', 'Email', 'Phone Number', 'Actions'];
      case 'pending':
        return ['Sr.No', 'Created Date', 'Name', 'Email', 'Phone', 'Profile %', 'Actions'];
      case 'rejected':
        return ['Sr.No', 'Created Date', 'Email', 'Full Name', 'Phone', 'Actions'];
      case 'active':
      case 'suspended':
        return ['Vendor ID', 'Created Date', 'Name', 'Email', 'Phone', 'Business', 'Location', 'Actions'];
      default:
        return [];
    }
  };

  const calculateProfilePercentage = (vendor) => {
    const requiredFields = [
      'full_name', 'email', 'phone', 'business_name', 
      'business_type', 'address', 'state', 'pincode'
    ];
    const filledFields = requiredFields.filter(field => vendor[field]).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab flex-1 min-w-fit ${activeTab === tab.id ? 'tab-active bg-white shadow-sm' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm(''); // Reset search when changing tabs
            }}
          >
            <strong>{tab.label}</strong>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="join w-full md:w-auto gap-2">
          <select 
            className="join-item select select-bordered"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          <input
            type="text"
            className="join-item input input-bordered w-full"
            placeholder={`Search by ${searchType}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            className="join-item btn btn-primary"
            onClick={handleSearch}
          >
            Search
          </button>
          <button 
            className="join-item btn btn-ghost"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="table table-zebra">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {getTableHeaders().map(header => (
                  <th key={header}>{header}</th>
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
                    profilePercentage={calculateProfilePercentage(item)}
                    onView={() => setViewVendor(item)}
                    onReview={() => setReviewVendor(item)}
                    onApprove={() => onApprove(item.id)}
                    onReject={() => onReject(item.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={getTableHeaders().length} className="text-center py-8 text-gray-500">
                    No {activeTab === 'new' ? 'applications' : 'vendors'} found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {viewVendor && (
        <ViewVendorModal 
          user={viewVendor} 
          onClose={() => setViewVendor(null)} 
        />
      )}

      {reviewVendor && (
        <ProfileReviewModal
          vendor={reviewVendor}
          onClose={() => setReviewVendor(null)}
          onApprove={() => {
            onApprove(reviewVendor.id);
            setReviewVendor(null);
          }}
          onReject={() => {
            onReject(reviewVendor.id);
            setReviewVendor(null);
          }}
        />
      )}
    </div>
  );
}