import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  useUpdateProfileApprovalStatusMutation,
  useGetProfileApprovalStatusQuery
} from '../features/newapplication/newAccountApplicationApi';
import { toast } from 'react-toastify';
// Lazy loaded components
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));
const Spinner = lazy(() => import('../components/common/Spinner'));

const TAB_KEYS = ['userDetails', 'documents', 'companyDetails', 'companyDocuments', 'paymentDetails'];

const FilePreviewButton = ({ value, label, onPreview }) => {
  if (!value) return <span className="text-gray-500">Not provided</span>;
  
  const fileExtension = value.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
  const isPDF = fileExtension === 'pdf';

  return (
    <button 
      className="btn btn-xs sm:btn-sm btn-outline font-bold cursor-pointer"
      onClick={() => onPreview({ url: value, title: label, type: isImage ? 'image' : 'file' })}
    >
      View {label} ({isImage ? 'Image' : isPDF ? 'PDF' : 'File'})
    </button>
  );
};

export default function ProfileReviewModal({ vendor, onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);
  const [previewItem, setPreviewItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  const { data: existingStatus, isLoading, isError, refetch } = useGetProfileApprovalStatusQuery(vendor?.user?.id);

  useEffect(() => {
    if (existingStatus) {
      setApprovalStatus({
        userDetails: existingStatus.user_details || 'pending',
        userDetailsReason: existingStatus.user_details_reason || "",
        documents: existingStatus.documents || 'pending',
        documentsReason: existingStatus.documents_reason || "",
        companyDetails: existingStatus.business_details || 'pending',
        companyDetailsReason: existingStatus.business_details_reason || "",
        companyDocuments: existingStatus.company_documents || 'pending',
        companyDocumentsReason: existingStatus.company_documents_reason || "",
        paymentDetails: existingStatus.bank_details || 'pending',
        paymentDetailsReason: existingStatus.bank_details_reason || ""
      });
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
      toast.error('Please provide a rejection reason');
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
      setIsSubmitting(true);
      
      const submissionData = {
        user_details: approvalStatus.userDetails,
        user_details_reason: approvalStatus.userDetailsReason,
        documents: approvalStatus.documents,
        documents_reason: approvalStatus.documentsReason,
        business_details: approvalStatus.companyDetails,
        business_details_reason: approvalStatus.companyDetailsReason,
        company_documents: approvalStatus.companyDocuments,
        company_documents_reason: approvalStatus.companyDocumentsReason,
        bank_details: approvalStatus.paymentDetails,
        bank_details_reason: approvalStatus.paymentDetailsReason
      };

      await updateApprovalStatus({
        userId: vendor?.user?.id,
        data: submissionData
      }).unwrap();

      onClose();
      toast.success("Profile Status Updated");
    } catch (error) {
      console.error("Failed to update approval status:", error);
      toast.error("Failed to submit approval. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            value: (
              vendor.user.address &&
              vendor.user.address.street_address &&
              vendor.user.address.city &&
              vendor.user.address.district_name &&
              vendor.user.address.state_name &&
              vendor.user.address.country &&
              vendor.user.address.postal_code
            ) ? `${vendor.user.address.street_address}, ${vendor.user.address.city}, ${vendor.user.address.district_name}, ${vendor.user.address.state_name}, ${vendor.user.address.country} - ${vendor.user.address.postal_code}` : 'Not provided'
          },
          { 
            label: "Social Media", 
            value: (
              <div className="flex flex-wrap gap-2">
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
            value: <FilePreviewButton 
                     value={vendor.user.profile.adhaar_card_pic} 
                     label="Aadhaar Card" 
                     onPreview={setPreviewItem} 
                   />
          },
          { 
            label: "PAN Card", 
            value: <FilePreviewButton 
                     value={vendor.user.profile.pancard_pic} 
                     label="PAN Card" 
                     onPreview={setPreviewItem} 
                   />
          },
          { 
            label: "Profile Picture", 
            value: <FilePreviewButton 
                     value={vendor.user.profile.profile_picture} 
                     label="Profile Picture" 
                     onPreview={setPreviewItem} 
                   />
          },
          { 
            label: "Other Documents", 
            value: <FilePreviewButton 
                     value={vendor.user.profile.kyc_other_document} 
                     label="Other Document" 
                     onPreview={setPreviewItem} 
                   />
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
            value: <FilePreviewButton 
                     value={vendor.user.company?.gst_certificate} 
                     label="GST Certificate" 
                     onPreview={setPreviewItem} 
                   />
          },
          { 
            label: "PAN Card", 
            value: <FilePreviewButton 
                     value={vendor.user.company?.pan_card} 
                     label="Company PAN Card" 
                     onPreview={setPreviewItem} 
                   />
          },
          { 
            label: "Business Registration", 
            value: <FilePreviewButton 
                     value={vendor.user.company?.business_registration_doc} 
                     label="Business Registration" 
                     onPreview={setPreviewItem} 
                   />
          },
          { 
            label: "Food License", 
            value: <FilePreviewButton 
                     value={vendor.user.company?.food_license_doc} 
                     label="Food License" 
                     onPreview={setPreviewItem} 
                   />
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
            value: <FilePreviewButton 
                     value={vendor.user.profile.passbook_pic} 
                     label="Passbook/Cheque" 
                     onPreview={setPreviewItem} 
                   />
          }
        ]
      }
    };

    const currentTab = tabContentMap[tab];
    const status = approvalStatus[tab];
    const reason = approvalStatus[`${tab}Reason`];

    return (
      <div className="space-y-4 md:space-y-6">
        <h4 className="text-lg md:text-xl font-bold text-primary">{currentTab.title}</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
          {currentTab.fields.map((field, index) => (
            <div key={index} className="bg-base-100 p-2 md:p-4 rounded-lg shadow-sm">
              <p className="font-bold text-sm md:text-base text-gray-700 mb-1">{field.label}</p>
              <div className="text-sm md:text-base text-gray-800">
                {field.value}
              </div>
            </div>
          ))}
        </div>
        
        <div className="divider"></div>
        
        <div className="flex flex-col space-y-2 bg-base-200 p-3 md:p-4 rounded-lg">
          <label className="label p-0">
            <span className="label-text font-bold text-sm md:text-base">
              {status === 'approved' ? 'Approval Note' : 'Rejection Reason'}
            </span>
          </label>
          <textarea 
            className="textarea textarea-bordered h-20 md:h-24 focus:border-primary focus:ring-1 focus:ring-primary text-sm md:text-base" 
            placeholder={
              status === 'approved' ? 'Approval notes (optional)...' : 'Enter reason for rejection...'
            }
            value={reason}
            onChange={(e) => handleReasonChange(tab, e.target.value)}
            required={status === 'rejected'}
          />
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-4 md:mt-6">
          <button 
            className={`btn btn-sm md:btn-md ${status === 'rejected' ? 'btn-error' : 'btn-outline btn-error'} font-bold`}
            onClick={() => handleReject(tab)}
            disabled={isSubmitting}
          >
            {status === 'rejected' ? 'Rejected' : 'Reject'}
          </button>
          <button 
            className={`btn btn-sm md:btn-md ${status === 'approved' ? 'btn-success' : 'btn-outline btn-success'} font-bold`}
            onClick={() => handleApprove(tab)}
            disabled={isSubmitting}
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
          <Suspense fallback={<div>Loading...</div>}>
            <Spinner fullScreen={false} />
          </Suspense>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <Suspense fallback={<div>Loading error component...</div>}>
            <ErrorMessage 
              message="Failed to load approval status. Please try again."
              onRetry={refetch}
            />
          </Suspense>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] flex flex-col p-2 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="font-bold text-lg md:text-2xl text-primary">Vendor Profile</h3>
            <button 
              className="btn btn-sm btn-circle btn-ghost hover:bg-error hover:text-white" 
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
        <div className="flex flex-nowrap overflow-x-auto pb-2 mb-4 md:mb-6">
  <div
    className="tabs tabs-boxed bg-base-200 flex-nowrap whitespace-nowrap"
    style={{ minHeight: '5rem' }} // ⬅️ fixed tab height (~48px)
  >
    {TAB_KEYS.map((tab) => {
      const status = approvalStatus[tab];
      return (
        <button 
          key={tab}
          className={`tab text-xs md:text-sm font-semibold h-10 px-4 flex-shrink-0 ${
            activeTab === tab ? 'tab-active' : ''
          } ${
            status === 'approved'
              ? '!bg-green-100 !text-green-800 border-green-300'
              : status === 'rejected'
              ? '!bg-red-100 !text-red-800 border-red-300'
              : ''
          }`}
          onClick={() => setActiveTab(tab)}
          disabled={isSubmitting}
        >
          {tab.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
          {status !== 'pending' && (
            <span className="ml-1">
              {status === 'approved' ? '✓' : '✗'}
            </span>
          )}
        </button>
      );
    })}
  </div>
</div>
          
          {/* Tab Content */}
          <div className="flex-grow overflow-y-auto p-1 md:p-4">
            {renderTabContent(activeTab)}
          </div>
          
          {/* Navigation and Submit */}
          <div className="modal-action mt-4 md:mt-6">
            <div className="flex justify-between w-full">
              {activeTab !== TAB_KEYS[0] && (
                <button 
                  className="btn btn-sm md:btn-md btn-outline font-bold"
                  onClick={() => {
                    const currentIndex = TAB_KEYS.indexOf(activeTab);
                    setActiveTab(TAB_KEYS[currentIndex - 1]);
                  }}
                  disabled={isSubmitting}
                >
                  ← Previous
                </button>
              )}
              
              {activeTab !== TAB_KEYS[TAB_KEYS.length - 1] ? (
                <button 
                  className="btn btn-sm md:btn-md btn-primary font-bold ml-auto"
                  onClick={() => {
                    const currentIndex = TAB_KEYS.indexOf(activeTab);
                    setActiveTab(TAB_KEYS[currentIndex + 1]);
                  }}
                  disabled={isSubmitting}
                >
                  Next →
                </button>
              ) : (
                <button 
                  className={`btn btn-sm md:btn-md btn-success font-bold ml-auto ${
                    !isSubmitEnabled() || isSubmitting ? 'btn-disabled' : ''
                  }`}
                  onClick={handleSubmit}
                  disabled={!isSubmitEnabled() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewItem && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl max-h-screen">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg md:text-xl">{previewItem.title}</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost hover:bg-error hover:text-white" 
                onClick={() => setPreviewItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center items-center h-full min-h-[50vh]">
              {previewItem.type === 'image' ? (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.title} 
                  className="max-h-[70vh] md:max-h-[80vh] object-contain"
                />
              ) : (
                <div className="w-full h-full">
                  <iframe 
                    src={previewItem.url} 
                    title={previewItem.title}
                    className="w-full h-[70vh] md:h-[80vh] border rounded-lg"
                  />
                  <div className="mt-4 text-center">
                    <a 
                      href={previewItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-sm md:btn-md btn-primary"
                onClick={() => setPreviewItem(null)}
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