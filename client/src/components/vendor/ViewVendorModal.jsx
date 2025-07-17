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
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
                  <h4 className="text-xl font-semibold text-primary mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-base-content/70">Username</p>
                        <p className="font-medium">{user.username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70">Full Name</p>
                        <p className="font-medium">{user.profile?.full_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-base-content/70">Date of Birth</p>
                        <p className="font-medium">{user.profile?.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70">Gender</p>
                        <p className="font-medium">{user.profile?.gender || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
                  <h4 className="text-xl font-semibold text-primary mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-base-content/70">Street</p>
                        <p className="font-medium">{user.address?.street_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70">City</p>
                        <p className="font-medium">{user.address?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70">State</p>
                        <p className="font-medium">{user.address?.state_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-base-content/70">District</p>
                        <p className="font-medium">{user.address?.district_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70">Postal Code</p>
                        <p className="font-medium">{user.address?.postal_code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70">Country</p>
                        <p className="font-medium">{user.address?.country || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="avatar">
                  <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                      src={user.profile?.profile_picture || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
                      alt={user.username || 'Vendor'}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-bold">{user.profile?.full_name || 'N/A'}</h3>
                  <p className="text-base-content/70">@{user.username || 'vendor'}</p>
                  <div className="mt-2">
                    <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                      {user.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'contactInfo':
        return (
          <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
            <h4 className="text-xl font-semibold text-primary mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70">Email</p>
                  <p className="font-medium">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Phone</p>
                  <p className="font-medium">{user.profile?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">WhatsApp</p>
                  <p className="font-medium">{user.profile?.whatsapp_number || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70">Facebook</p>
                  <p className="font-medium">
                    {user.profile?.facebook ? (
                      <a href={user.profile.facebook} target="_blank" rel="noopener noreferrer" className="link link-primary">
                        {user.profile.facebook}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Instagram</p>
                  <p className="font-medium">
                    {user.profile?.instagram ? (
                      <a href={user.profile.instagram} target="_blank" rel="noopener noreferrer" className="link link-secondary">
                        {user.profile.instagram}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Twitter</p>
                  <p className="font-medium">
                    {user.profile?.twitter ? (
                      <a href={user.profile.twitter} target="_blank" rel="noopener noreferrer" className="link link-accent">
                        {user.profile.twitter}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'paymentInfo':
        return (
          <div className="space-y-6">
            <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
              <h4 className="text-xl font-semibold text-primary mb-4">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-base-content/70">Bank UPI</p>
                    <p className="font-medium">{user.profile?.bank_upi || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">UPI ID</p>
                    <p className="font-medium">{user.profile?.upi_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Account Holder</p>
                    <p className="font-medium">{user.profile?.account_holder_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-base-content/70">Bank Name</p>
                    <p className="font-medium">{user.profile?.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Account Number</p>
                    <p className="font-medium">{user.profile?.account_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">IFSC Code</p>
                    <p className="font-medium">{user.profile?.ifsc_code || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
              <h4 className="text-xl font-semibold text-primary mb-4">KYC Status</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className={`badge ${user.profile?.kyc_status === 'VERIFIED' ? 'badge-success' : 
                               user.profile?.kyc_status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                  {user.profile?.kyc_status || 'N/A'}
                </span>
                
                {user.profile?.kyc_rejected_reason && (
                  <div className="flex-1">
                    <p className="text-sm text-base-content/70">Rejection Reason</p>
                    <p className="font-medium">{user.profile.kyc_rejected_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'businessDetails':
        return (
          <div className="space-y-6">
            <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
              <h4 className="text-xl font-semibold text-primary mb-4">Business Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-base-content/70">Company Name</p>
                    <p className="font-medium">{user.company?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Business Type</p>
                    <p className="font-medium">{user.company?.business_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Business Category</p>
                    <p className="font-medium">{user.company?.business_category || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-base-content/70">Description</p>
                    <p className="font-medium">{user.company?.business_description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Joining Date</p>
                    <p className="font-medium">{user.company?.joining_date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
              <h4 className="text-xl font-semibold text-primary mb-4">Legal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-base-content/70">GST Number</p>
                    <p className="font-medium">{user.company?.gst_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">PAN Number</p>
                    <p className="font-medium">{user.company?.pan_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-base-content/70">Business Reg. No</p>
                    <p className="font-medium">{user.company?.business_registration_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Food License No</p>
                    <p className="font-medium">{user.company?.food_license_number || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'businessContact':
        return (
          <div className="bg-base-100 p-6 rounded-box shadow-sm border border-base-300">
            <h4 className="text-xl font-semibold text-primary mb-4">Business Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70">Company Email</p>
                  <p className="font-medium">
                    {user.company?.company_email ? (
                      <a href={`mailto:${user.company.company_email}`} className="link link-primary">
                        {user.company.company_email}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Company Phone</p>
                  <p className="font-medium">
                    {user.company?.company_phone ? (
                      <a href={`tel:${user.company.company_phone}`} className="link">
                        {user.company.company_phone}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Designation</p>
                  <p className="font-medium">{user.company?.designation || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70">Registered Address</p>
                  <p className="font-medium">{user.company?.registered_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Operational Address</p>
                  <p className="font-medium">{user.company?.operational_address || 'N/A'}</p>
                </div>
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
      <div className="modal-box max-w-5xl w-full max-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-primary">Vendor Details</h3>
          <button 
            onClick={onClose} 
            className="btn btn-circle btn-sm btn-ghost"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="tabs tabs-boxed bg-base-200 p-1 mb-6 overflow-x-auto">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab flex-1 whitespace-nowrap ${activeTab === tab.id ? 'tab-active bg-base-100 text-primary' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {renderTabContent()}
        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}