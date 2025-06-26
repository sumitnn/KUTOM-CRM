import React, { useState } from 'react';

export default function ViewVendorModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('userDetails');
  
  if (!user) return null;

  const tabs = [
    { id: 'userDetails', label: 'User Details' },
    { id: 'contactInfo', label: 'Contact Info' },
    { id: 'paymentInfo', label: 'Payment Info' },
    { id: 'businessDetails', label: 'Business Details' },
    { id: 'businessContact', label: 'Business Contact' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'userDetails':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
                <h4 className="text-lg font-semibold text-accent mb-3">Personal Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Username:</span> {user.username || 'N/A'}</p>
                  <p><span className="font-medium">Full Name:</span> {user.profile?.full_name || 'N/A'}</p>
                  <p><span className="font-medium">Date of Birth:</span> {user.profile?.date_of_birth || 'N/A'}</p>
                  <p><span className="font-medium">Gender:</span> {user.profile?.gender || 'N/A'}</p>
                </div>
              </div>
              
              <div className="avatar flex justify-center sm:block">
                <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={user.profile?.profile_picture || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
                    alt={user.username || 'Vendor'}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
              <h4 className="text-lg font-semibold text-accent mb-3">Address Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">Street:</span> {user.address?.street_address || 'N/A'}</p>
                  <p><span className="font-medium">City:</span> {user.address?.city || 'N/A'}</p>
                  <p><span className="font-medium">State:</span> {user.address?.state_name || 'N/A'}</p>
                </div>
                <div>
                  <p><span className="font-medium">District:</span> {user.address?.district_name || 'N/A'}</p>
                  <p><span className="font-medium">Postal Code:</span> {user.address?.postal_code || 'N/A'}</p>
                  <p><span className="font-medium">Country:</span> {user.address?.country || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'contactInfo':
        return (
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <h4 className="text-lg font-semibold text-accent mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {user.profile?.phone || 'N/A'}</p>
                <p><span className="font-medium">WhatsApp:</span> {user.profile?.whatsapp_number || 'N/A'}</p>
              </div>
              <div>
                <p><span className="font-medium">Facebook:</span> {user.profile?.facebook || 'N/A'}</p>
                <p><span className="font-medium">Instagram:</span> {user.profile?.instagram || 'N/A'}</p>
                <p><span className="font-medium">Twitter:</span> {user.profile?.twitter || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      
      case 'paymentInfo':
        return (
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <h4 className="text-lg font-semibold text-accent mb-3">Payment Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Bank UPI:</span> {user.profile?.bank_upi || 'N/A'}</p>
                <p><span className="font-medium">UPI ID:</span> {user.profile?.upi_id || 'N/A'}</p>
                <p><span className="font-medium">Account Holder:</span> {user.profile?.account_holder_name || 'N/A'}</p>
              </div>
              <div>
                <p><span className="font-medium">Bank Name:</span> {user.profile?.bank_name || 'N/A'}</p>
                <p><span className="font-medium">Account Number:</span> {user.profile?.account_number || 'N/A'}</p>
                <p><span className="font-medium">IFSC Code:</span> {user.profile?.ifsc_code || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4">
              <h5 className="font-medium mb-2">KYC Status: 
                <span className={`badge ml-2 ${user.profile?.kyc_status === 'VERIFIED' ? 'badge-success' : 
                                 user.profile?.kyc_status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                  {user.profile?.kyc_status || 'N/A'}
                </span>
              </h5>
              {user.profile?.kyc_rejected_reason && (
                <p><span className="font-medium">Rejection Reason:</span> {user.profile.kyc_rejected_reason}</p>
              )}
            </div>
          </div>
        );
      
      case 'businessDetails':
        return (
          <div className="space-y-4">
            <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
              <h4 className="text-lg font-semibold text-accent mb-3">Business Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">Company Name:</span> {user.company?.company_name || 'N/A'}</p>
                  <p><span className="font-medium">Business Type:</span> {user.company?.business_type || 'N/A'}</p>
                  <p><span className="font-medium">Business Category:</span> {user.company?.business_category || 'N/A'}</p>
                </div>
                <div>
                  <p><span className="font-medium">Description:</span> {user.company?.business_description || 'N/A'}</p>
                  <p><span className="font-medium">Joining Date:</span> {user.company?.joining_date || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
              <h4 className="text-lg font-semibold text-accent mb-3">Legal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">GST Number:</span> {user.company?.gst_number || 'N/A'}</p>
                  <p><span className="font-medium">PAN Number:</span> {user.company?.pan_number || 'N/A'}</p>
                </div>
                <div>
                  <p><span className="font-medium">Business Reg. No:</span> {user.company?.business_registration_number || 'N/A'}</p>
                  <p><span className="font-medium">Food License No:</span> {user.company?.food_license_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'businessContact':
        return (
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <h4 className="text-lg font-semibold text-accent mb-3">Business Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Company Email:</span> {user.company?.company_email || 'N/A'}</p>
                <p><span className="font-medium">Company Phone:</span> {user.company?.company_phone || 'N/A'}</p>
                <p><span className="font-medium">Designation:</span> {user.company?.designation || 'N/A'}</p>
              </div>
              <div>
                <h5 className="font-medium">Registered Address:</h5>
                <p>{user.company?.registered_address || 'N/A'}</p>
                <h5 className="font-medium mt-2">Operational Address:</h5>
                <p>{user.company?.operational_address || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-2xl text-primary">Vendor Details</h3>
          <button onClick={onClose} className="btn btn-circle btn-sm">
            ✕
          </button>
        </div>

        <div className="tabs tabs-boxed bg-base-200 p-1 rounded-lg mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'tab-active bg-base-100 text-primary' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {renderTabContent()}
        </div>

        <div className="modal-action mt-4">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </dialog>
  );
}