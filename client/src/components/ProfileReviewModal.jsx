// ProfileReviewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  useUpdateProfileApprovalStatusMutation,
  useGetProfileApprovalStatusQuery
} from '../features/newapplication/newAccountApplicationApi';

const TAB_KEYS = ['userDetails', 'bankDetails', 'businessDetails', 'documents', 'address', 'contact'];

export default function ProfileReviewModal({ vendor, onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);
  
  // Initialize with default pending status
  const defaultApprovalStatus = {
    userDetails: 'pending',
    userDetailsReason: "",
    bankDetails: 'pending',
    bankDetailsReason: "",
    businessDetails: 'pending',
    businessDetailsReason: "",
    documents: 'pending',
    documentsReason: "",
    address: 'pending',
    addressReason: "",
    contact: 'pending',
    contactReason: ""
  };

  const [approvalStatus, setApprovalStatus] = useState(defaultApprovalStatus);
  
  // RTK Query hooks
  const [updateApprovalStatus] = useUpdateProfileApprovalStatusMutation();
  const { data: existingStatus, isLoading, isError } = useGetProfileApprovalStatusQuery(vendor?.user?.id);

  // Load existing status when modal opens or when data changes
  useEffect(() => {
    if (existingStatus) {
      // Transform the incoming data to match our structure
      const transformedStatus = { ...defaultApprovalStatus };
      
      // Map the incoming data to our structure
      Object.keys(existingStatus).forEach(key => {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (TAB_KEYS.includes(camelCaseKey)) {
          transformedStatus[camelCaseKey] = existingStatus[key];
          transformedStatus[`${camelCaseKey}Reason`] = existingStatus[`${key}_reason`] || "";
        }
      });
      
      setApprovalStatus(transformedStatus);
    }
  }, [existingStatus]);

  const isSubmitEnabled = () => {
    return TAB_KEYS.some(key => approvalStatus[key] !== 'pending');
  };

  const handleDecision = (section, decision, reason = "") => {
    setApprovalStatus(prev => ({
      ...prev,
      [section]: decision,
      [`${section}Reason`]: reason
    }));
  };

  const handleReject = (section) => {
    const reason = approvalStatus[`${section}Reason`];
    if (!reason && approvalStatus[section] !== 'rejected') {
      alert('Please provide a rejection reason');
      return;
    }
    handleDecision(section, 'rejected', reason);
  };

  const handleApprove = (section) => {
    handleDecision(section, 'approved', "");
  };

  const handleReasonChange = (section, value) => {
    setApprovalStatus(prev => ({
      ...prev,
      [`${section}Reason`]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Prepare the data for API
      const submissionData = {};
      TAB_KEYS.forEach(key => {
        if (approvalStatus[key] !== 'pending') {
          submissionData[key] = {
            status: approvalStatus[key],
            reason: approvalStatus[`${key}Reason`] || ""
          };
        }
      });

      await updateApprovalStatus({
        userId: vendor?.user?.id,
        data: submissionData
      }).unwrap();

      onClose();
    } catch (error) {
      console.error("Failed to update approval status:", error);
      alert("Failed to submit approval. Please try again.");
    }
  };

  const renderTabContent = (tab) => {
    const tabContentMap = {
      userDetails: {
        title: "User Information",
        fields: [
          { label: "Full Name", value: vendor.user.profile.full_name },
          { label: "Email", value: vendor.email },
          { label: "Date of Birth", value: vendor.user.profile.date_of_birth },
          { label: "Gender", value: vendor.user.profile.gender },
          { label: "Phone", value: vendor.phone },
          { label: "WhatsApp", value: vendor.user.profile.whatsapp_number },
          { label: "KYC Status", value: vendor.user.profile.kyc_status }
        ]
      },
      bankDetails: {
        title: "Bank Information",
        fields: [
          { label: "Bank Name", value: vendor.user.profile.bank_name },
          { label: "Account Holder", value: vendor.user.profile.account_holder_name },
          { label: "Account Number", value: vendor.user.profile.account_number },
          { label: "IFSC Code", value: vendor.user.profile.ifsc_code },
          { label: "UPI ID", value: vendor.user.profile.upi_id },
          { 
            label: "Passbook", 
            value: vendor.user.profile.passbook_pic,
            isLink: true
          }
        ]
      },
      businessDetails: {
        title: "Business Information",
        fields: [
          { label: "Company Name", value: vendor.user.company?.name },
          { label: "Business Type", value: vendor.user.company?.type },
          { label: "GST Number", value: vendor.user.company?.gst_number },
          { label: "PAN Number", value: vendor.user.profile.pancard_number },
          { label: "Registration Date", value: vendor.user.company?.registration_date }
        ]
      },
      documents: {
        title: "Documents",
        fields: [
          { 
            label: "PAN Card", 
            value: vendor.user.profile.pancard_pic,
            isLink: true
          },
          { 
            label: "Aadhaar Card", 
            value: vendor.user.profile.adhaar_card_pic,
            isLink: true
          },
          { 
            label: "Other Documents", 
            value: vendor.user.profile.kyc_other_document,
            isLink: true
          }
        ]
      },
      address: {
        title: "Address Information",
        fields: [
          { label: "Address", value: vendor.user.address },
          { label: "City", value: vendor.user.company?.city },
          { label: "State", value: vendor.user.company?.state },
          { label: "Country", value: vendor.user.company?.country },
          { label: "PIN Code", value: vendor.user.company?.pincode }
        ]
      },
      contact: {
        title: "Contact Information",
        fields: [
          { label: "Primary Phone", value: vendor.phone },
          { label: "Secondary Phone", value: vendor.user.company?.phone },
          { label: "Business Email", value: vendor.user.company?.email },
          { 
            label: "Facebook", 
            value: vendor.user.profile.facebook,
            isLink: true
          },
          { 
            label: "Instagram", 
            value: vendor.user.profile.instagram,
            isLink: true
          }
        ]
      }
    };

    const currentTab = tabContentMap[tab];
    const status = approvalStatus[tab];
    const reason = approvalStatus[`${tab}Reason`];

    return (
      <div className="space-y-4">
        <h4 className="text-xl font-semibold">{currentTab.title}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTab.fields.map((field, index) => (
            <div key={index}>
              <p>
                <strong>{field.label}:</strong> 
                {field.isLink && field.value ? (
                  <a href={field.value} target="_blank" rel="noopener noreferrer" className="link link-primary ml-2">
                    View
                  </a>
                ) : field.value || ' Not provided'}
              </p>
            </div>
          ))}
        </div>
        
        <div className="divider"></div>
        
        {/* Reason Field - Always visible but only required for rejections */}
        <div className="flex flex-col space-y-2">
          <label className="label">
            <span className="label-text">
              {status === 'approved' ? 'Approval Note' : 'Rejection Reason'}
            </span>
          </label>
          <textarea 
            className="textarea textarea-bordered h-24" 
            placeholder={
              status === 'approved' ? 'Approval notes (optional)...' : 'Enter reason for rejection...'
            }
            value={reason}
            onChange={(e) => handleReasonChange(tab, e.target.value)}
            
          />
        </div>
        
        <div className="flex justify-center space-x-4 mt-6">
          <button 
            className={`btn ${status === 'rejected' ? 'btn-error' : 'btn-outline btn-error'}`}
            onClick={() => handleReject(tab)}
          >
            {status === 'rejected' ? 'Rejected' : 'Reject'}
          </button>
          <button 
            className={`btn ${status === 'approved' ? 'btn-success' : 'btn-outline btn-success'}`}
            onClick={() => handleApprove(tab)}
          >
            {status === 'approved' ? 'Approved' : 'Approve'}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <span className="loading loading-spinner loading-lg"></span>
          <p>Loading approval status...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="alert alert-error">
            Failed to load approval status. Please try again.
          </div>
          <div className="modal-action">
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-2xl">Vendor Profile Review</h3>
          <button className="btn btn-sm btn-circle" onClick={onClose}>✕</button>
        </div>
        
        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-200 mb-4 overflow-x-auto">
          {TAB_KEYS.map((tab) => {
            const status = approvalStatus[tab];
            return (
              <button 
                key={tab}
                className={`tab font-bold ${activeTab === tab ? 'tab-active' : ''} ${
                  status === 'approved' ? '!bg-green-100 !text-green-800 border-green-300' : 
                  status === 'rejected' ? '!bg-red-100 !text-red-800 border-red-300' : ''
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                {status !== 'pending' && (
                  <span className="ml-1">
                    {status === 'approved' ? '✓' : '✗'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-grow overflow-y-auto p-2">
          {renderTabContent(activeTab)}
        </div>
        
        {/* Navigation and Submit */}
        <div className="modal-action mt-4">
          {activeTab !== TAB_KEYS[0] && (
            <button 
              className="btn btn-outline"
              onClick={() => {
                const currentIndex = TAB_KEYS.indexOf(activeTab);
                setActiveTab(TAB_KEYS[currentIndex - 1]);
              }}
            >
              Previous
            </button>
          )}
          
          {activeTab !== TAB_KEYS[TAB_KEYS.length - 1] ? (
            <button 
              className="btn btn-primary"
              onClick={() => {
                const currentIndex = TAB_KEYS.indexOf(activeTab);
                setActiveTab(TAB_KEYS[currentIndex + 1]);
              }}
            >
              Next
            </button>
          ) : (
            <button 
              className={`btn btn-success ${!isSubmitEnabled() ? 'btn-disabled' : ''}`}
              onClick={handleSubmit}
              disabled={!isSubmitEnabled()}
            >
              Submit Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}