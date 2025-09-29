import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'userDetails':
        return (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-6">
                <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg">
                  <h4 className="text-xl font-semibold text-primary mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Username</p>
                        <p className="font-medium text-base-content">{user.username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Full Name</p>
                        <p className="font-medium text-base-content">{user.profile?.full_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Date of Birth</p>
                        <p className="font-medium text-base-content">{user.profile?.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Gender</p>
                        <p className="font-medium text-base-content">{user.profile?.gender || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg">
                  <h4 className="text-xl font-semibold text-primary mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Street</p>
                        <p className="font-medium text-base-content">{user.address?.street_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">City</p>
                        <p className="font-medium text-base-content">{user.address?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">State</p>
                        <p className="font-medium text-base-content">{user.address?.state || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">District</p>
                        <p className="font-medium text-base-content">{user.address?.district || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Postal Code</p>
                        <p className="font-medium text-base-content">{user.address?.postal_code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/70 mb-1">Country</p>
                        <p className="font-medium text-base-content">{user.address?.country || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center lg:items-start gap-6">
                <div className="avatar">
                  <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                    <img
                      src={user.profile?.profile_picture || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
                      alt={user.username || 'Vendor'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-base-content">{user.profile?.full_name || 'N/A'}</h3>
                  <p className="text-base-content/70 mt-1">@{user.username || 'vendor'}</p>
                  <div className="mt-3">
                    <span className={`badge badge-lg ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                      {user.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      case 'contactInfo':
        return (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg"
          >
            <h4 className="text-xl font-semibold text-primary mb-6">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Email</p>
                  <p className="font-medium text-base-content">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Phone</p>
                  <p className="font-medium text-base-content">{user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">WhatsApp</p>
                  <p className="font-medium text-base-content">{user.profile?.whatsapp_number || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Facebook</p>
                  <p className="font-medium text-base-content">
                    {user.profile?.facebook ? (
                      <a href={user.profile.facebook} target="_blank" rel="noopener noreferrer" className="link link-primary truncate block">
                        {user.profile.facebook}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Instagram</p>
                  <p className="font-medium text-base-content">
                    {user.profile?.instagram ? (
                      <a href={user.profile.instagram} target="_blank" rel="noopener noreferrer" className="link link-secondary truncate block">
                        {user.profile.instagram}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Twitter</p>
                  <p className="font-medium text-base-content">
                    {user.profile?.twitter ? (
                      <a href={user.profile.twitter} target="_blank" rel="noopener noreferrer" className="link link-accent truncate block">
                        {user.profile.twitter}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      case 'paymentInfo':
        return (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg">
              <h4 className="text-xl font-semibold text-primary mb-6">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Bank UPI</p>
                    <p className="font-medium text-base-content">{user.profile?.bank_upi || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">UPI ID</p>
                    <p className="font-medium text-base-content">{user.profile?.upi_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Account Holder</p>
                    <p className="font-medium text-base-content">{user.profile?.account_holder_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Bank Name</p>
                    <p className="font-medium text-base-content">{user.profile?.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Account Number</p>
                    <p className="font-medium text-base-content">{user.profile?.account_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">IFSC Code</p>
                    <p className="font-medium text-base-content">{user.profile?.ifsc_code || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg">
              <h4 className="text-xl font-semibold text-primary mb-4">KYC Status</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className={`badge badge-lg ${user.profile?.kyc_status === 'VERIFIED' ? 'badge-success' : 
                               user.profile?.kyc_status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                  {user.profile?.kyc_status || 'N/A'}
                </span>
                
                {user.profile?.kyc_rejected_reason && (
                  <div className="flex-1">
                    <p className="text-sm text-base-content/70 mb-1">Rejection Reason</p>
                    <p className="font-medium text-base-content">{user.profile.kyc_rejected_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      
      case 'businessDetails':
        return (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg">
              <h4 className="text-xl font-semibold text-primary mb-6">Business Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Company Name</p>
                    <p className="font-medium text-base-content">{user.company?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Business Type</p>
                    <p className="font-medium text-base-content">{user.company?.business_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Business Category</p>
                    <p className="font-medium text-base-content">{user.company?.business_category || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Description</p>
                    <p className="font-medium text-base-content">{user.company?.business_description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Joining Date</p>
                    <p className="font-medium text-base-content">{user.company?.joining_date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg">
              <h4 className="text-xl font-semibold text-primary mb-6">Legal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">GST Number</p>
                    <p className="font-medium text-base-content">{user.company?.gst_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">PAN Number</p>
                    <p className="font-medium text-base-content">{user.company?.pan_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Business Reg. No</p>
                    <p className="font-medium text-base-content">{user.company?.business_registration_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70 mb-1">Food License No</p>
                    <p className="font-medium text-base-content">{user.company?.food_license_number || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      case 'businessContact':
        return (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-base-100 p-6 rounded-xl shadow-md border border-base-300 transition-all hover:shadow-lg"
          >
            <h4 className="text-xl font-semibold text-primary mb-6">Business Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Company Email</p>
                  <p className="font-medium text-base-content">
                    {user.company?.company_email ? (
                      <a href={`mailto:${user.company.company_email}`} className="link link-primary truncate block">
                        {user.company.company_email}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Company Phone</p>
                  <p className="font-medium text-base-content">
                    {user.company?.company_phone ? (
                      <a href={`tel:${user.company.company_phone}`} className="link truncate block">
                        {user.company.company_phone}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Designation</p>
                  <p className="font-medium text-base-content">{user.company?.designation || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Registered Address</p>
                  <p className="font-medium text-base-content">{user.company?.registered_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Operational Address</p>
                  <p className="font-medium text-base-content">{user.company?.operational_address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.dialog 
        open 
        className="modal modal-bottom sm:modal-middle"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div 
          className="modal-box max-w-5xl w-full max-h-screen p-0 overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex justify-between items-center p-6 border-b border-base-300 bg-base-200">
            <h3 className="text-2xl font-bold text-primary">Vendor Details</h3>
            <motion.button 
              onClick={onClose} 
              className="btn btn-circle btn-sm btn-ghost"
              aria-label="Close modal"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <div className="px-6 pt-4 bg-base-200">
            <div className="tabs tabs-boxed bg-base-200 p-1 overflow-x-auto">
              <div className="flex space-x-1">
                {tabs.map(tab => (
                  <motion.button
                    key={tab.id}
                    className={`tab flex-1 whitespace-nowrap ${activeTab === tab.id ? 'tab-active bg-base-100 text-primary' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            <AnimatePresence mode="wait">
              {renderTabContent()}
            </AnimatePresence>
          </div>

          <div className="modal-action mt-2 p-6 border-t border-base-300">
            <motion.button 
              className="btn btn-outline" 
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </motion.dialog>
    </AnimatePresence>
  );
}