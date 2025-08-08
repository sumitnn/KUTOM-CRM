import React, { useState } from 'react';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaThumbsUp,
  FaIdCard,
  FaDotCircle 
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
  isLoadingAction,
  currentActionId,
  setShowKycModal,
  setSelectedVendor
}) {
  const [localLoading, setLocalLoading] = useState({
    approve: false,
    reject: false,
    status: false
  });

  const formattedDate = vendor.created_at 
    ? format(new Date(vendor.created_at), 'MMM dd, yyyy HH:mm') 
    : 'N/A';

  const fullName = vendor.profile?.full_name || vendor?.full_name;
  const phone = vendor.profile?.phone || vendor?.phone;
  const created_at = vendor.profile?.created_at || 'N/A';
  const state = vendor.address?.state_name || 'N/A';
  const postalCode = vendor.address?.postal_code || 'N/A';
  const city = vendor.address?.city || 'N/A';
  const userId = vendor.user?.id; // Get user ID from vendor object
  const FullKycApproved=vendor.profile?.kyc_verified

  const handleAction = async (action, actionFn) => {
    if (action === 'kyc') {
      setSelectedVendor(vendor);
      setShowKycModal(true);
      return;
    }
    
    setLocalLoading(prev => ({...prev, [action]: true}));
    try {
      await actionFn(userId); // Pass user ID to action function
    } finally {
      setLocalLoading(prev => ({...prev, [action]: false}));
    }
  };

  const getButtonState = (actionType) => {
    const isLoading = isLoadingAction && currentActionId === userId;
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
  onClick={() => {
    if (action === 'approve') onApprove(vendor.id);
    else if (action === 'reject') onReject(vendor.id);
    else if (action === 'kyc') onMarkKycCompleted(vendor.id);
  }}
  disabled={disabled || isLoadingAction && currentActionId === action}
>
  {isLoadingAction && currentActionId === action ? (
    <span className="loading loading-spinner loading-xs"></span>
  ) : (
    <>
      {icon} {text}
    </>
  )}
</button>
    );
  };

  const rowContent = (() => {
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
                {renderActionButton('kyc', <FaIdCard />, 'Full KYC Approved')}
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
            <td className="px-2 py-3 font-bold">{vendor.vendor_id || 'N/A'}</td>
            <td className="px-2 py-3">{created_at}</td>
            <td className="px-2 py-3">
  {fullName}
  <div className={FullKycApproved ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
    {FullKycApproved ? "KYC: Approved" : "KYC: Pending"}
  </div>
</td>

            <td className="px-2 py-3 font-bold">{vendor.email}</td>
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
                  activeTab === 'active' ? <FaDotCircle /> : <FaThumbsUp />,
                  activeTab === 'active' ? 'In-Active' : 'Activate',
                  activeTab === 'active' ? 'warning' : 'success'
                )}
              </div>
            </td>
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <tr className="hover:bg-gray-50 cursor-pointer transition-colors">
      {rowContent}
    </tr>
  );
}