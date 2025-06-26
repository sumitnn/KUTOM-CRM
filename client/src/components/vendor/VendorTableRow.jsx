import React, { useState } from 'react';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaThumbsUp,
  FaThumbsDown,
  FaIdCard
} from 'react-icons/fa';
import { format } from 'date-fns';
import ProgressBar from '../ProgressBar';

export default function VendorTableRow({ 
  vendor, 
  index, 
  activeTab,
  onView, 
  onReview,
  onApprove,
  onReject,
  onMarkKycCompleted // Add this new prop
}) {
  const [showKycConfirm, setShowKycConfirm] = useState(false);
  const formattedDate = vendor.created_at 
    ? format(new Date(vendor.created_at), 'MMM dd, yyyy HH:mm') 
    : 'N/A';

  // Access profile data safely
  const fullName = vendor.profile?.full_name || vendor?.full_name;
  const phone = vendor.profile?.phone || vendor?.phone;
  const created_at = vendor.profile?.created_at || 'N/A';
  
  // Access address data safely
  const state = vendor.address?.state_name || 'N/A';
  const postalCode = vendor.address?.postal_code || 'N/A';
  const city = vendor.address?.city || 'N/A';

  const handleConfirmKyc = () => {
    setShowKycConfirm(false);
    onMarkKycCompleted(vendor.id);
  };

  const getRowContent = () => {
    switch (activeTab) {
      case 'new':
        return (
          <>
            <td>{index + 1}</td>
            <td>{formattedDate}</td>
            <td>{fullName}</td>
            <td>{vendor.email}</td>
            <td>{phone}</td>
            <td>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-success"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}
                >
                  <FaCheck /> Approve
                </button>
                <button 
                  className="btn btn-sm btn-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </td>
          </>
        );
      case 'pending':
        return (
          <>
            <td>{index + 1}</td>
            <td>{formattedDate}</td>
            <td>{fullName}</td>
            <td>{vendor.email}</td>
            <td>{phone}</td>
            <td>
              <ProgressBar percentage={vendor?.user?.profile?.completion_percentage || 0} />
            </td>
            <td>
              <div className="flex flex-wrap gap-2">
                <button 
                  className="btn btn-sm btn-ghost font-bold border-1 border-indigo-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview();
                  }}
                >
                  <FaEye /> Review Profile
                </button>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowKycConfirm(true);
                  }}
                >
                  <FaIdCard /> Mark KYC Completed
                </button>
                <button 
                  className="btn btn-sm btn-error font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </td>
          </>
        );
      case 'rejected':
        return (
          <>
            <td>{index + 1}</td>
            <td>{formattedDate}</td>
            <td>{vendor.email}</td>
            <td>{fullName}</td>
            <td>{phone}</td>
            <td>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-success font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}
                >
                  <FaThumbsUp /> Re-Activate 
                </button>
              </div>
            </td>
          </>
        );
      case 'active':
      case 'suspended':
        return (
          <>
            <td>{vendor.vendor_id || 'N/A'}</td>
            <td>{created_at}</td>
            <td>{fullName}</td>
            <td>{vendor.email}</td>
            <td>{phone}</td>
            <td>
              <div className="flex flex-col">
                <span>{vendor.business_name || 'N/A'}</span>
                <span className="text-sm text-gray-500">{vendor.business_type || 'N/A'}</span>
              </div>
            </td>
            <td>
              {city}, {state}, {postalCode}
            </td>
            <td>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-ghost font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  <FaEye /> View
                </button>
                <button 
                  className={`btn btn-sm font-bold ${activeTab === 'active' ? 'btn-warning' : 'btn-success'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                >
                  {activeTab === 'active' ? (
                    <><FaThumbsDown /> Deactivate</>
                  ) : (
                    <><FaThumbsUp /> Activate</>
                  )}
                </button>
              </div>
            </td>
          </>
        );
      default:
        return null;
    }
  };
 
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer transition-colors">
        {getRowContent()}
      </tr>
      
      {/* KYC Confirmation Modal */}
      {showKycConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm KYC Completion</h3>
            <p className="mb-6">Are you sure you want to mark this vendor's KYC as completed?</p>
            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowKycConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmKyc}
              >
                Yes, Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}