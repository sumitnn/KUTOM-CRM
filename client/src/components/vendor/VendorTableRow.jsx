// components/vendor/VendorTableRow.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaThumbsUp,
  FaIdCard,
  FaDotCircle,
  FaInfoCircle,
  FaStar,
  FaRegStar,
  FaUserCheck
} from 'react-icons/fa';
import { format } from 'date-fns';
import ProgressBar from '../ProgressBar';
import { useGetStockistAssignmentQuery } from "../../features/stockist/stockistApi";

export default function VendorTableRow({ 
  vendor, 
  index, 
  activeTab,
  onView, 
  onReview,
  onApprove,
  onReject,
  onMarkDefaultStockist,
  onMarkKycCompleted,
  onToggleStatus,
  onAssignStockist,
  isLoadingAction,
  currentActionId,
  setShowKycModal,
  setSelectedVendor,
  role
}) {
  const [localLoading, setLocalLoading] = useState({
    approve: false,
    reject: false,
    status: false,
    default: false
  });

  // Fetch stockist assignment data for resellers
  const { 
    data: assignmentData, 
    isLoading: isLoadingAssignment,
    refetch: refetchAssignment
  } = useGetStockistAssignmentQuery(vendor.id, {
    skip: !['active', 'suspended'].includes(activeTab) || role !== 'reseller'
  });

  useEffect(() => {
    if (['active', 'suspended'].includes(activeTab) && role === 'reseller') {
      refetchAssignment();
    }
  }, [vendor.id, activeTab, role, refetchAssignment]);

  const formattedDate = vendor.created_at 
    ? format(new Date(vendor.created_at), 'MMM dd, yyyy HH:mm') 
    : 'N/A';

  const fullName = vendor.profile?.full_name || vendor?.username;
  const phone = vendor.profile?.phone || vendor?.phone;
  const created_at = vendor.profile?.created_at || 'N/A';
  const state = vendor.address?.state || 'N/A';
  const postalCode = vendor.address?.postal_code || 'N/A';
  const city = vendor.address?.city || 'N/A';
  const userId = vendor.user?.id || vendor.id;
  const FullKycApproved = vendor.profile?.kyc_verified;
  const completionPercentage = vendor?.completion_percentage || 0;
  const isKycButtonEnabled = completionPercentage >= 80;
  const isDefaultStockist = vendor.is_default_user || false;
  const assignedStockist = assignmentData?.stockist;

  const handleAction = async (action, actionFn, ...args) => {
    if (action === 'kyc') {
      setSelectedVendor(vendor);
      setShowKycModal(true);
      return;
    }
    
    setLocalLoading(prev => ({...prev, [action]: true}));
    try {
      await actionFn(...args);
    } finally {
      setLocalLoading(prev => ({...prev, [action]: false}));
    }
  };

  const getButtonState = (actionType, id = null) => {
    const isLoading = isLoadingAction && (
      currentActionId === actionType || 
      currentActionId === `default-${id}` ||
      currentActionId === userId
    );
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
        disabled={disabled || (isLoadingAction && currentActionId === action)}
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

  const renderStatusButton = () => {
    const { loading, disabled } = getButtonState('status');
    const isActiveTab = activeTab === 'active';
    
    return (
      <button 
        className={`btn btn-sm btn-${isActiveTab ? 'warning' : 'success'} font-bold`}
        onClick={() => handleAction('status', onToggleStatus, userId)}
        disabled={disabled}
      >
        {loading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <>
            {isActiveTab ? <FaDotCircle /> : <FaThumbsUp />}
            {isActiveTab ? 'In-Active' : 'Activate'}
          </>
        )}
      </button>
    );
  };

  const renderDefaultStockistButton = () => {
    const { loading, disabled } = getButtonState('default', userId);
    
    return (
      <button 
        className={`btn btn-sm ${isDefaultStockist ? 'btn-warning' : 'btn-outline'} font-bold`}
        onClick={() => handleAction('default', onMarkDefaultStockist, userId, !isDefaultStockist)}
        disabled={disabled}
        title={isDefaultStockist ? 'Remove as default stockist' : 'Set as default stockist'}
      >
        {loading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <>
            {isDefaultStockist ? <FaStar className="text-yellow-500" /> : <FaRegStar />}
            {isDefaultStockist ? 'Remove Default' : 'Mark Default'}
          </>
        )}
      </button>
    );
  };

  const renderKycButton = () => {
    const { loading, disabled } = getButtonState('kyc');
    const isDisabled = disabled || !isKycButtonEnabled;
    
    return (
      <div className="relative group">
        <button 
          className={`btn btn-sm ${isKycButtonEnabled ? 'btn-primary' : 'btn-disabled'} font-bold`}
          onClick={() => {
            if (isKycButtonEnabled) {
              setSelectedVendor(vendor);
              setShowKycModal(true);
            }
          }}
          disabled={isDisabled}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <>
              <FaIdCard /> Full KYC Approved
            </>
          )}
        </button>
        
        {!isKycButtonEnabled && (
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
            <div className="flex items-center">
              <FaInfoCircle className="mr-1" />
              Profile completion must be at least 80% to enable this button.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStockistAssignmentSection = () => {
    if (role !== 'reseller' || !['active', 'suspended'].includes(activeTab)) {
      return null;
    }
    
    const stockistName = assignedStockist 
      ? `${assignedStockist.username} (${assignedStockist.email})`
      : 'Not Assigned';

    return (
      <>
        <td className="px-2 py-3">
          <div className="flex flex-col">
            <span className={assignedStockist ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {stockistName}
            </span>
            {assignedStockist && (
              <span className="text-xs text-gray-500">
                Assigned: {format(new Date(assignedStockist.assigned_at), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-3">
          <button 
            className="btn btn-sm btn-outline btn-primary font-bold"
            onClick={() => onAssignStockist(vendor, assignedStockist)}
            disabled={isLoadingAction || isLoadingAssignment}
          >
            {isLoadingAssignment ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <>
                <FaUserCheck /> {assignedStockist ? 'Change' : 'Assign'}
              </>
            )}
          </button>
        </td>
      </>
    );
  };

  const rowContent = (() => {
    switch (activeTab) {
      case 'new':
        return (
          <>
            <td className="px-2 py-3 font-bold"># {index + 1}</td>
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
            <td className="px-2 py-3 font-bold"># {index + 1}</td>
            <td className="px-2 py-3">{formattedDate}</td>
            <td className="px-2 py-3">{fullName}</td>
            <td className="px-2 py-3">{vendor.email}</td>
            <td className="px-2 py-3">{phone}</td>
            <td className="px-2 py-3">
              <ProgressBar percentage={completionPercentage} />
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
                {renderKycButton()}
                {renderActionButton('reject', <FaTimes />, 'Reject', 'error')}
              </div>
            </td>
          </>
        );
      case 'rejected':
        return (
          <>
            <td className="px-2 py-3 font-bold"># {index + 1}</td>
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
            
            {/* Stockist Assignment Columns - Only for reseller role */}
            {role === 'reseller' && renderStockistAssignmentSection()}
            
            {/* Default Stockist Column - Only for stockist role */}
            {role === 'stockist' && (
              <td className="px-2 py-3 text-center">
                {isDefaultStockist ? (
                  <span className="badge badge-success badge-lg">True</span>
                ) : (
                  <span className="badge badge-secondary badge-lg">False</span>
                )}
              </td>
            )}
            
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
                {renderStatusButton()}
                {/* Default Stockist Button - Only for stockist role */}
                {role === 'stockist' && renderDefaultStockistButton()}
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