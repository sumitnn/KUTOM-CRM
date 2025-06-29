import React, { useState, useEffect } from 'react';
import {
  useUpdateProfileApprovalStatusMutation,
  useGetProfileApprovalStatusQuery
} from '../features/newapplication/newAccountApplicationApi';

const TAB_KEYS = ['userDetails', 'documents', 'companyDetails', 'companyDocuments', 'paymentDetails'];

export default function ProfileReviewModal({ vendor, onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);
  const [imagePreview, setImagePreview] = useState(null);
  
  const defaultApprovalStatus = {
    userDetails: 'pending',
    userDetailsReason: "",
    documents: 'pending',
    documentsReason: "",
    companyDetails: 'pending',
    companyDetailsReason: "",
    companyDocuments: 'pending',
    companyDocumentsReason: "",
    paymentDetails: 'pending',
    paymentDetailsReason: ""
  };

  const [approvalStatus, setApprovalStatus] = useState(defaultApprovalStatus);
  
  const [updateApprovalStatus] = useUpdateProfileApprovalStatusMutation();
  const { data: existingStatus, isLoading, isError } = useGetProfileApprovalStatusQuery(vendor?.user?.id);

  useEffect(() => {
    if (existingStatus) {
      const transformedStatus = { ...defaultApprovalStatus };
      
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

  const renderDocumentPreview = (value, label) => {
    if (!value) return 'Not provided';
    
    return (
      <button 
        className="btn btn-sm btn-outline font-bold cursor-pointer"
        onClick={() => setImagePreview({ url: value, title: label })}
      >
        View {label}
      </button>
    );
  };

  const renderTabContent = (tab) => {
    const tabContentMap = {
      userDetails: {
        title: "User & Contact Information",
        fields: [
          { label: "Full Name", value: vendor.user.profile.full_name },
          { label: "Email", value: vendor.email },
          { label: "Phone", value: vendor.phone },
          { label: "WhatsApp", value: vendor.user.profile.whatsapp_number },
          { label: "Date of Birth", value: vendor.user.profile.date_of_birth || 'Not provided' },
          { label: "Gender", value: vendor.user.profile.gender || 'Not provided' },
          { label: "KYC Status", value: vendor.user.profile.kyc_status },
          { 
            label: "Address", 
            value: vendor.user.address ? 
              `${vendor.user.address.street_address}, ${vendor.user.address.city}, ${vendor.user.address.district_name}, ${vendor.user.address.state_name}, ${vendor.user.address.country} - ${vendor.user.address.postal_code}` : 
              'Not provided'
          },
          { 
            label: "Social Media", 
            value: (
              <div className="flex space-x-2">
                {vendor.user.profile.facebook && <a href={vendor.user.profile.facebook} target="_blank" rel="noopener noreferrer" className="link link-primary">Facebook</a>}
                {vendor.user.profile.instagram && <a href={vendor.user.profile.instagram} target="_blank" rel="noopener noreferrer" className="link link-primary">Instagram</a>}
                {!vendor.user.profile.facebook && !vendor.user.profile.instagram && 'Not provided'}
              </div>
            )
          }
        ]
      },
      documents: {
        title: "User Documents",
        fields: [
          { 
            label: "Aadhaar Card", 
            value: renderDocumentPreview(vendor.user.profile.adhaar_card_pic, 'Aadhaar Card')
          },
          { 
            label: "PAN Card", 
            value: renderDocumentPreview(vendor.user.profile.pancard_pic, 'PAN Card')
          },
          { 
            label: "Profile Picture", 
            value: renderDocumentPreview(vendor.user.profile.profile_picture, 'Profile Picture')
          },
          { 
            label: "Other Documents", 
            value: renderDocumentPreview(vendor.user.profile.kyc_other_document, 'Other Document')
          }
        ]
      },
      companyDetails: {
        title: "Company Information",
        fields: [
          { label: "Company Name", value: vendor.user.company?.company_name || 'Not provided' },
          { label: "Business Type", value: vendor.user.company?.business_type || 'Not provided' },
          { label: "Business Category", value: vendor.user.company?.business_category || 'Not provided' },
          { label: "Company Email", value: vendor.user.company?.company_email || 'Not provided' },
          { label: "Company Phone", value: vendor.user.company?.company_phone || 'Not provided' },
          { label: "GST Number", value: vendor.user.company?.gst_number || 'Not provided' },
          { label: "PAN Number", value: vendor.user.company?.pan_number || 'Not provided' },
          { label: "Business Description", value: vendor.user.company?.business_description || 'Not provided' },
          { 
            label: "Address", 
            value: vendor.user.company?.registered_address || 'Not provided'
          },
          { 
            label: "Operational Address", 
            value: vendor.user.company?.operational_address || 'Not provided'
          }
        ]
      },
      companyDocuments: {
        title: "Company Documents",
        fields: [
          { 
            label: "GST Certificate", 
            value: renderDocumentPreview(vendor.user.company?.gst_certificate, 'GST Certificate')
          },
          { 
            label: "PAN Card", 
            value: renderDocumentPreview(vendor.user.company?.pan_card, 'Company PAN Card')
          },
          { 
            label: "Business Registration", 
            value: renderDocumentPreview(vendor.user.company?.business_registration_doc, 'Business Registration')
          },
          { 
            label: "Food License", 
            value: renderDocumentPreview(vendor.user.company?.food_license_doc, 'Food License')
          }
        ]
      },
      paymentDetails: {
        title: "Payment Information",
        fields: [
          { label: "Bank Name", value: vendor.user.profile.bank_name || 'Not provided' },
          { label: "Account Holder", value: vendor.user.profile.account_holder_name || 'Not provided' },
          { label: "Account Number", value: vendor.user.profile.account_number || 'Not provided' },
          { label: "IFSC Code", value: vendor.user.profile.ifsc_code || 'Not provided' },
          { label: "UPI ID", value: vendor.user.profile.upi_id || 'Not provided' },
          { 
            label: "Passbook/Cheque", 
            value: renderDocumentPreview(vendor.user.profile.passbook_pic, 'Passbook/Cheque')
          }
        ]
      }
    };

    const currentTab = tabContentMap[tab];
    const status = approvalStatus[tab];
    const reason = approvalStatus[`${tab}Reason`];

    return (
      <div className="space-y-6">
        <h4 className="text-xl font-bold text-primary">{currentTab.title}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentTab.fields.map((field, index) => (
            <div key={index} className="bg-base-100 p-4 rounded-lg shadow-sm">
              <p className="font-bold text-gray-700 mb-1">{field.label}</p>
              <div className="text-gray-800">
                {field.value}
              </div>
            </div>
          ))}
        </div>
        
        <div className="divider"></div>
        
        <div className="flex flex-col space-y-2 bg-base-200 p-4 rounded-lg">
          <label className="label">
            <span className="label-text font-bold">
              {status === 'approved' ? 'Approval Note' : 'Rejection Reason'}
            </span>
          </label>
          <textarea 
            className="textarea textarea-bordered h-24 focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder={
              status === 'approved' ? 'Approval notes (optional)...' : 'Enter reason for rejection...'
            }
            value={reason}
            onChange={(e) => handleReasonChange(tab, e.target.value)}
            required={status === 'rejected'}
          />
        </div>
        
        <div className="flex justify-center space-x-6 mt-6">
          <button 
            className={`btn ${status === 'rejected' ? 'btn-error' : 'btn-outline btn-error'} font-bold`}
            onClick={() => handleReject(tab)}
          >
            {status === 'rejected' ? 'Rejected' : 'Reject'}
          </button>
          <button 
            className={`btn ${status === 'approved' ? 'btn-success' : 'btn-outline btn-success'} font-bold`}
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
        <div className="modal-box flex flex-col items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 font-bold">Loading approval status...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">Failed to load approval status. Please try again.</span>
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-2xl text-primary">Vendor Profile Review</h3>
            <button 
              className="btn btn-sm btn-circle btn-ghost hover:bg-error hover:text-white" 
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="tabs tabs-boxed bg-base-200 mb-6 overflow-x-auto">
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
          <div className="flex-grow overflow-y-auto p-4">
            {renderTabContent(activeTab)}
          </div>
          
          {/* Navigation and Submit */}
          <div className="modal-action mt-6">
            <div className="flex justify-between w-full">
              {activeTab !== TAB_KEYS[0] && (
                <button 
                  className="btn btn-outline font-bold"
                  onClick={() => {
                    const currentIndex = TAB_KEYS.indexOf(activeTab);
                    setActiveTab(TAB_KEYS[currentIndex - 1]);
                  }}
                >
                  ← Previous
                </button>
              )}
              
              {activeTab !== TAB_KEYS[TAB_KEYS.length - 1] ? (
                <button 
                  className="btn btn-primary font-bold ml-auto"
                  onClick={() => {
                    const currentIndex = TAB_KEYS.indexOf(activeTab);
                    setActiveTab(TAB_KEYS[currentIndex + 1]);
                  }}
                >
                  Next →
                </button>
              ) : (
                <button 
                  className={`btn btn-success font-bold ml-auto ${!isSubmitEnabled() ? 'btn-disabled' : ''}`}
                  onClick={handleSubmit}
                  disabled={!isSubmitEnabled()}
                >
                  Submit Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">{imagePreview.title}</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost hover:bg-error hover:text-white" 
                onClick={() => setImagePreview(null)}
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center">
              <img 
                src={imagePreview.url} 
                alt={imagePreview.title} 
                className="max-h-[80vh] object-contain"
              />
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                onClick={() => setImagePreview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}