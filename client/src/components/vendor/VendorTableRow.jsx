import React, { useState } from 'react';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaThumbsUp,
  FaThumbsDown,
  FaIdCard,
  FaSync
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
  onMarkKycCompleted,
  onRefresh,
  isLoadingAction,
  currentActionId
}) {
  const [showKycConfirm, setShowKycConfirm] = useState(false);
  const [localLoading, setLocalLoading] = useState({
    approve: false,
    reject: false,
    kyc: false,
    status: false
  });

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

  const handleConfirmKyc = async () => {
    setShowKycConfirm(false);
    setLocalLoading(prev => ({...prev, kyc: true}));
    await onMarkKycCompleted(vendor.id);
    setLocalLoading(prev => ({...prev, kyc: false}));
  };

  const handleAction = async (action, actionFn) => {
    setLocalLoading(prev => ({...prev, [action]: true}));
    try {
      await actionFn(vendor.id);
    } finally {
      setLocalLoading(prev => ({...prev, [action]: false}));
    }
  };

  const getButtonState = (actionType) => {
    const isLoading = isLoadingAction && currentActionId === vendor.id && currentActionId === actionType;
    const isLocallyLoading = localLoading[actionType];
    return {
      loading: isLoading || isLocallyLoading,
      disabled: isLoading || isLocallyLoading
    };
  };

  const renderActionButton = (action, icon, text, variant = 'primary') => {
    const { loading, disabled } = getButtonState(action);
    return (
      <button 
        className={`btn btn-sm btn-${variant} font-bold`}
        onClick={() => handleAction(action, action === 'approve' ? onApprove : 
                                         action === 'reject' ? onReject : 
                                         action === 'kyc' ? onMarkKycCompleted : null)}
        disabled={disabled}
      >
        {loading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <>
            {icon} {text}
          </>
        )}
      </button>
    );
  };

  const getRowContent = () => {
    switch (activeTab) {
      case 'new':
        return (
          <>
            <td className="px-2 py-3">{index + 1}</td>
            <td className="px-2 py-3">{formattedDate}</td>
            <td className="px-2 py-3">{fullName}</td>
            <td className="px-2 py-3">{vendor.email}</td>
            <td className="px-2 py-3">{phone}</td>
            <td className="px-2 py-3">
              <div className="flex flex-wrap gap-2">
                {renderActionButton('approve', <FaCheck />, 'Approve', 'success')}
                {renderActionButton('reject', <FaTimes />, 'Reject', 'error')}
              </div>
            </td>
          </>
        );
      case 'pending':
        return (
          <>
            <td className="px-2 py-3">{index + 1}</td>
            <td className="px-2 py-3">{formattedDate}</td>
            <td className="px-2 py-3">{fullName}</td>
            <td className="px-2 py-3">{vendor.email}</td>
            <td className="px-2 py-3">{phone}</td>
            <td className="px-2 py-3">
              <ProgressBar percentage={vendor?.user?.profile?.completion_percentage || 0} />
            </td>
            <td className="px-2 py-3">
              <div className="flex flex-wrap gap-2">
                <button 
                  className="btn btn-sm btn-ghost font-bold border-1 border-indigo-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview();
                  }}
                >
                  <FaEye /> Review
                </button>
                {renderActionButton('kyc', <FaIdCard />, 'Mark Full KYC Approved')}
                {renderActionButton('reject', <FaTimes />, 'Reject', 'error')}
              </div>
            </td>
          </>
        );
      case 'rejected':
        return (
          <>
            <td className="px-2 py-3">{index + 1}</td>
            <td className="px-2 py-3">{formattedDate}</td>
            <td className="px-2 py-3">{vendor.email}</td>
            <td className="px-2 py-3">{fullName}</td>
            <td className="px-2 py-3">{phone}</td>
            <td className="px-2 py-3">
              <div className="flex flex-wrap gap-2">
                {renderActionButton('approve', <FaThumbsUp />, 'Re-Activate', 'success')}
              </div>
            </td>
          </>
        );
      case 'active':
      case 'suspended':
        return (
          <>
            <td className="px-2 py-3">{vendor.vendor_id || 'N/A'}</td>
            <td className="px-2 py-3">{created_at}</td>
            <td className="px-2 py-3">{fullName}</td>
            <td className="px-2 py-3">{vendor.email}</td>
            <td className="px-2 py-3">{phone}</td>
            <td className="px-2 py-3">
              <div className="flex flex-col">
                <span>{vendor.business_name || 'N/A'}</span>
                <span className="text-sm text-gray-500">{vendor.business_type || 'N/A'}</span>
              </div>
            </td>
            <td className="px-2 py-3">
              {city}, {state}, {postalCode}
            </td>
            <td className="px-2 py-3">
              <div className="flex flex-wrap gap-2">
                <button 
                  className="btn btn-sm btn-ghost font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  <FaEye /> View
                </button>
                {renderActionButton(
                  'status', 
                  activeTab === 'active' ? <FaThumbsDown /> : <FaThumbsUp />,
                  activeTab === 'active' ? 'Deactivate' : 'Activate',
                  activeTab === 'active' ? 'warning' : 'success'
                )}
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
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm KYC Completion</h3>
            <p className="mb-6">Are you sure you want to mark this vendor's KYC as completed?</p>
            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowKycConfirm(false)}
                disabled={localLoading.kyc}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmKyc}
                disabled={localLoading.kyc}
              >
                {localLoading.kyc ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  'Yes, Mark as Completed'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}