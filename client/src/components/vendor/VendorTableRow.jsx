import React from 'react';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaThumbsUp,
  FaThumbsDown,
} from 'react-icons/fa';
import { format } from 'date-fns';
import ProgressBar from '../ProgressBar';

export default function VendorTableRow({ 
  vendor, 
  index, 
  activeTab,
  profilePercentage,
  onView, 
  onReview,
  onApprove,
  onReject
}) {
  const formattedDate = vendor.created_at 
    ? format(new Date(vendor.created_at), 'MMM dd, yyyy HH:mm') 
    : 'N/A';

  // Access profile data safely
  const fullName = vendor.profile?.full_name || "No Name";
  const phone = vendor.profile?.phone || 'N/A';
  const created_at = vendor.profile?.created_at || 'N/A';
  
  // Access address data safely
  const state = vendor.address?.state_name || 'N/A';
  const postalCode = vendor.address?.postal_code || 'N/A';
  const city = vendor.address?.city || 'N/A';

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
              <ProgressBar percentage={profilePercentage} />
            </td>
            <td>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview();
                  }}
                >
                  <FaEye /> Review
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
                  className="btn btn-sm btn-success"
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
            <td>{vendor.id || 'N/A'}</td>
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
                  className="btn btn-sm btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  <FaEye /> View
                </button>
                <button 
                  className={`btn btn-sm ${activeTab === 'active' ? 'btn-warning' : 'btn-success'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                >
                  {activeTab === 'active' ? (
                    <><FaThumbsDown /> Deactivate Account</>
                  ) : (
                    <><FaThumbsUp /> Activate Account</>
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
    <tr 
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {getRowContent()}
    </tr>
  );
}