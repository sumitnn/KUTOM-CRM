import React, { useState, useEffect } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { useGetStatesQuery, useGetDistrictsQuery } from '../../features/location/locationApi';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  FaEdit, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, 
  FaUser, FaVenusMars, FaWhatsapp, FaFacebook, FaTwitter, 
  FaInstagram, FaYoutube, FaIdCard, FaPassport, FaBuilding,
  FaPercentage, FaFileAlt, FaAddressCard, FaFacebookF, FaCopy,
  FaGlobe, FaHome, FaStore, FaMoneyBillWave, FaCreditCard,
  FaShieldAlt, FaUserTie, FaIndustry, FaInfoCircle, FaCalendarAlt
} from 'react-icons/fa';
import { BsBank2, BsCreditCard, BsBuilding } from 'react-icons/bs';
import { MdBusinessCenter, MdEmail, MdLocationCity, MdPayment } from 'react-icons/md';
import { GiCommercialAirplane, GiReceiveMoney } from 'react-icons/gi';
import { RiContactsBookLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import EditSectionModal from './EditSectionModal';
import { FaFileImage } from 'react-icons/fa';

export default function Profile() {
  const [activeEditSection, setActiveEditSection] = useState(null);
  const { data: profileData, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  // Fetch states and districts
  const { data: states = [] } = useGetStatesQuery();
  const { data: addressDistricts = [], refetch: refetchAddressDistricts } = useGetDistrictsQuery(profileData?.address?.state, {
    skip: !profileData?.address?.state,
  });
  const { data: companyDistricts = [], refetch: refetchCompanyDistricts } = useGetDistrictsQuery(profileData?.company?.state, {
    skip: !profileData?.company?.state,
  });

  const defaultProfile = {
    id: '',
    username: '',
    email: '',
    full_name: '',
    role: "",
    reseller_id: "",
    stockist_id: "",
    vendor_id: "",
    date_of_birth: null,
    phone: '',
    profile_picture: null,
    gender: '',
    bio: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    whatsapp_number: '',
    bank_upi: '',
    upi_id: '',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    adhaar_card_number: '',
    pancard_number: '',
    kyc_status: 'PENDING',
    kyc_verified: false,
    kyc_verified_at: null,
    kyc_rejected_reason: null,
    completion_percentage: 0,
    address: {
      street_address: '',
      city: '',
      state: '',
      district: '',
      postal_code: '',
      country: 'India',
      is_primary: false
    },
    company: {
      company_name: '',
      company_email: '',
      company_phone: '',
      designation: '',
      business_type: 'other',
      business_category: 'other',
      business_description: '',
      gst_number: '',
      pan_number: '',
      business_registration_number: '',
      food_license_number: '',
      registered_address: '',
      operational_address: '',
      pincode: '',
      gst_certificate: null,
      pan_card: null,
      business_registration_doc: null,
      food_license_doc: null
    }
  };

  const profile = profileData ? { 
    ...defaultProfile, 
    ...profileData,
    ...profileData.profile, 
    address: profileData.address || defaultProfile.address,
    company: profileData.company || defaultProfile.company
  } : defaultProfile;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSave = async (section, updatedData) => {
    try {
      const formData = new FormData();
      if (section === 'personal') {
        formData.append('profile', 'true');
      }
      if (section === 'business') {
        formData.append('business', 'true');
      }
      if (section === 'address') {
        formData.append('address', 'true');
      }
      if (section === 'payment') {
        formData.append('payment', 'true');
      }
      
      // Append fields based on section
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] !== undefined && updatedData[key] !== null) {
          if (updatedData[key] instanceof File) {
            formData.append(key, updatedData[key]);
          } else {
            formData.append(key, updatedData[key]);
          }
        }
      });

      await updateProfile(formData).unwrap();
      refetch();
      setActiveEditSection(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.data?.message || 'Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '__';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') return '__';
    
    try {
      const parts = [
        address.street_address,
        address.city,
        address.district ? (addressDistricts.find(d => d.id === address.district)?.name || address.district) : '',
        address.state ? (states.find(s => s.id === address.state)?.name || address.state) : '',
        address.postal_code,
        address.country
      ].filter(Boolean);
      
      return parts.join(', ') || '__';
    } catch (error) {
      console.error('Error formatting address:', error);
      return '__';
    }
  };

  const formatBusinessType = (type) => {
    if (!type) return '__';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderField = (icon, label, value, copyable = false) => (
    <div className="flex items-start gap-3 py-2">
      <div className="text-purple-600 mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-extrabold">{label}</p>
        <div className="flex justify-between items-center">
          <p className="font-bold">{value || '__'}</p>
          {copyable && value && (
            <button 
              onClick={() => handleCopy(value)}
              className="btn btn-ghost btn-xs"
              aria-label={`Copy ${label}`}
            >
              <FaCopy className="text-primary opacity-70 hover:opacity-100" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDocumentField = (icon, label, value, docUrl, copyable = false) => (
    <div className="flex items-start gap-3 py-2">
      <div className="text-gray-500 mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-extrabold">{label}</p>
        <div className="flex justify-between items-center">
          <p className="font-bold">{value || 'Not Provided'}</p>
          {copyable && value && (
            <button 
              onClick={() => handleCopy(value)}
              className="btn btn-ghost btn-xs"
              aria-label={`Copy ${label}`}
            >
              <FaCopy className="text-primary opacity-70 hover:opacity-100" />
            </button>
          )}
        </div>
        {docUrl && (
          <a 
            href={docUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary text-xs mt-1  font-bold inline-block hover:text-amber-600 hover:cursor-pointer"
          >
            View Document
          </a>
        )}
      </div>
    </div>
  );

  if (isLoading) return <Spinner fullScreen={false} />;
  if (isError) return <ErrorMessage message="Failed to load profile data" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img 
                src={profile.profile_picture || 'https://i.pravatar.cc/150?img=5'} 
                alt={profile.profile_picture}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.src = 'https://i.pravatar.cc/150?img=5';
                }}
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {profile.full_name || profile.username || 'No name provided'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-gray-600 font-bold">@{profile.username || 'user'}</p>
              {profile.role && (
                <span className="badge badge-primary capitalize font-bold">{profile.role}</span>
              )}
              {profile.kyc_verified ? (
                <span className="badge badge-success font-bold">KYC Verified</span>
              ) : (
                <span className="badge badge-warning font-bold">KYC Pending</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-52 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full animate-pulse" 
                  style={{ width: `${profile.completion_percentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 font-bold animate-pulse">{profile.completion_percentage || 0}% Profile Complete</span>
            </div>
          </div>
        </div>
        
        {profile.role === "vendor" && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FaStore className="text-primary" />
              <div>
                <p className="text-sm text-gray-600 font-extrabold">Vendor ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{profile.vendor_id || "Kyc Is Pending"}</p>
                  {profile.vendor_id && (
                    <button 
                      onClick={() => handleCopy(profile.vendor_id)}
                      className="btn btn-ghost btn-xs"
                      aria-label="Copy Vendor ID"
                    >
                      <FaCopy className="text-primary" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {profile.role === "stockist" && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FaStore className="text-primary" />
              <div>
                <p className="text-sm text-gray-600 font-extrabold">Stockist ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{profile.stockist_id || "Kyc Not Verified"}</p>
                  {profile.stockist_id && (
                    <button 
                      onClick={() => handleCopy(profile.stockist_id)}
                      className="btn btn-ghost btn-xs"
                      aria-label="Copy Stockist ID"
                    >
                      <FaCopy className="text-primary" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {profile.role === "reseller" && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FaStore className="text-primary" />
              <div>
                <p className="text-sm text-gray-600 font-extrabold">Reseller ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{profile.reseller_id || "Kyc Not Verified"}</p>
                  {profile.reseller_id && (
                    <button 
                      onClick={() => handleCopy(profile.reseller_id)}
                      className="btn btn-ghost btn-xs"
                      aria-label="Copy Reseller ID"
                    >
                      <FaCopy className="text-primary" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Summary Section */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl font-extrabold flex items-center gap-2">
                  <FaUser /> Profile Summary
                </h2>
                <button 
                  onClick={() => setActiveEditSection('personal')}
                  className="btn btn-sm btn-primary gap-2"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {renderField(<FaUser className="text-lg" />, "Full Name", profile.full_name)}
                  {renderField(<FaVenusMars className="text-lg" />, "Gender", profile.gender)}
                  {renderField(<FaBirthdayCake className="text-lg" />, "Date of Birth", formatDate(profile.date_of_birth))}
                  {renderField(<FaInfoCircle className="text-lg" />, "Bio", profile.bio)}
                </div>
                
                <div className="space-y-2">
                  {renderField(<FaPhone className="text-lg" />, "Phone", profile.phone, true)}
                  {renderField(<FaWhatsapp className="text-lg" />, "WhatsApp", profile.whatsapp_number, true)}
                  {renderField(<FaEnvelope className="text-lg" />, "Email", profile.email, true)}
                </div>
              </div>
              
              {/* Social Media */}
              <div className="mt-6">
                <h3 className="font-extrabold mb-3 flex items-center gap-2">
                  <FaGlobe /> Social Media
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderField(<FaFacebookF className="text-lg" />, "Facebook", profile.facebook)}
                  {renderField(<FaTwitter className="text-lg" />, "Twitter", profile.twitter)}
                  {renderField(<FaInstagram className="text-lg" />, "Instagram", profile.instagram)}
                  {renderField(<FaYoutube className="text-lg" />, "YouTube", profile.youtube)}
                </div>
              </div>
            </div>
          </div>

          {/* Business Section */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl font-extrabold flex items-center gap-2">
                  <FaBuilding /> Business Information
                </h2>
                <button 
                  onClick={() => setActiveEditSection('business')}
                  className="btn btn-sm btn-primary gap-2"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {renderField(<BsBuilding className="text-lg" />, "Company Name", profile.company.company_name)}
                  {renderField(<FaIndustry className="text-lg" />, "Business Type", formatBusinessType(profile.company.business_type))}
                  {renderField(<MdBusinessCenter className="text-lg" />, "Business Category", formatBusinessType(profile.company.business_category))}
                  {renderField(<FaUserTie className="text-lg" />, "Designation", profile.company.designation)}
                  {renderField(<FaInfoCircle className="text-lg" />, "Business Description", profile.company.business_description)}
                  {renderField(<FaGlobe className="text-lg" />, "State", 
                    profile.company.state ? 
                      states.find(s => s.id === profile.company.state)?.name || profile.company.state 
                      : '__')}
                  {renderField(<FaMapMarkerAlt className="text-lg" />, "District", 
                    profile.company.district ? 
                      companyDistricts.find(d => d.id === profile.company.district)?.name || profile.company.district 
                      : '__')}
                </div>
                
                <div className="space-y-2">
                  {renderField(<MdEmail className="text-lg" />, "Company Email", profile.company.company_email, true)}
                  {renderField(<FaPhone className="text-lg" />, "Company Phone", profile.company.company_phone, true)}
                  {renderField(<FaIdCard className="text-lg" />, "GST Number", profile.company.gst_number, true)}
                  {renderField(<FaPassport className="text-lg" />, "PAN Number", profile.company.pan_number, true)}
                  {renderField(<FaFileAlt className="text-lg" />, "Business Registration", profile.company.business_registration_number, true)}
                  {renderField(<FaCalendarAlt className="text-lg" />, "Food License", profile.company.food_license_number, true)}
                </div>
              </div>
              
              {/* Business Documents */}
              <div className="mt-6">
                <h3 className="font-extrabold mb-3 flex items-center gap-2">
                  <FaFileAlt /> Business Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderDocumentField(<FaIdCard className="text-lg" />, "GST Certificate", 
                    profile.company.gst_number, 
                    profile.company.gst_certificate)}
                  
                  {renderDocumentField(<FaPassport className="text-lg" />, "PAN Card", 
                    profile.company.pan_number, 
                    profile.company.pan_card)}
                  
                  {renderDocumentField(<FaFileAlt className="text-lg" />, "Business Registration Doc", 
                    profile.company.business_registration_number, 
                    profile.company.business_registration_doc)}
                  
                  {renderDocumentField(<FaCalendarAlt className="text-lg" />, "Food License Doc", 
                    profile.company.food_license_number, 
                    profile.company.food_license_doc)}
                </div>
              </div>
              
              {/* Business Addresses */}
              <div className="mt-6">
                <h3 className="font-extrabold mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt /> Business Addresses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="font-extrabold mb-2 flex items-center gap-2">
                      <FaHome /> Registered Address
                    </h4>
                    <p className="text-sm">{profile.company.registered_address || '__'}</p>
                    {profile.company.pincode && (
                      <p className="text-sm mt-1">Pincode: {profile.company.pincode}</p>
                    )}
                  </div>
                  
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="font-extrabold mb-2 flex items-center gap-2">
                      <FaStore /> Operational Address
                    </h4>
                    <p className="text-sm">{profile.company.operational_address || '__'}</p>
                    {profile.company.pincode && (
                      <p className="text-sm mt-1">Pincode: {profile.company.pincode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Address Section */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl font-extrabold flex items-center gap-2">
                  <FaMapMarkerAlt /> Personal Address
                </h2>
                <button 
                  onClick={() => setActiveEditSection('address')}
                  className="btn btn-sm btn-primary gap-2"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="space-y-2">
                {renderField(<FaHome className="text-lg" />, "Street Address", profile.address.street_address)}
                {renderField(<MdLocationCity className="text-lg" />, "City", profile.address.city)}
                {renderField(<FaGlobe className="text-lg" />, "State", 
                  profile.address.state ? 
                    states.find(s => s.id === profile.address.state)?.name || profile.address.state 
                    : '__')}
                {renderField(<FaMapMarkerAlt className="text-lg" />, "District", 
                  profile.address.district ? 
                    addressDistricts.find(d => d.id === profile.address.district)?.name || profile.address.district 
                    : '__')}
                {renderField(<FaAddressCard className="text-lg" />, "Postal Code", profile.address.postal_code)}
                {renderField(<FaGlobe className="text-lg" />, "Country", profile.address.country)}
              </div>
              
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-500" />
                  <p className="font-bold">Full Address:</p>
                </div>
                <p className="text-sm mt-1 bg-base-200 p-3 font-bold rounded-lg">
                  {formatAddress(profile.address)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl font-extrabold flex items-center gap-2">
                  <MdPayment /> Payment Details
                </h2>
                <button 
                  onClick={() => setActiveEditSection('payment')}
                  className="btn btn-sm btn-primary gap-2"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="mb-3 flex items-center font-extrabold gap-2">
                    <GiReceiveMoney /> UPI Details
                  </h3>
                  {renderField(<MdPayment className="text-lg" />, "UPI ID", profile.upi_id, true)}
                </div>
                
                <div className="bg-base-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <BsBank2 /> Bank Details
                  </h3>
                  {renderField(<FaUser className="text-lg" />, "Account Holder", profile.account_holder_name)}
                  {renderField(<BsBank2 className="text-lg" />, "Bank Name", profile.bank_name)}
                  {renderField(<BsCreditCard className="text-lg" />, "Account Number", profile.account_number, true)}
                  {renderField(<FaCreditCard className="text-lg" />, "IFSC Code", profile.ifsc_code, true)}
                  {renderDocumentField(<FaFileImage className="text-lg" />, "Passbook Image", 
                    profile.passbook_pic ? "Uploaded" : null, 
                    profile.passbook_pic)}
                </div>
              </div>
            </div>
          </div>

          {/* KYC Details Section */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl font-extrabold flex items-center gap-2">
                  <FaShieldAlt /> KYC Details
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-base-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <FaIdCard /> Identity Documents
                  </h3>
                  {renderDocumentField(<FaIdCard className="text-lg" />, "Aadhaar Card Number", 
                    profile.adhaar_card_number, profile.adhaar_card_pic, true)}
                  
                  {renderDocumentField(<FaPassport className="text-lg" />, "PAN Card Number", 
                    profile.pancard_number, profile.pancard_pic, true)}
                </div>
                
                <div className="bg-base-200 p-4 rounded-lg">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <FaShieldAlt /> KYC Status
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Status:</p>
                    <span className={`badge font-bold ${
                      profile.kyc_status === 'APPROVED' ? 'badge-success' :
                      profile.kyc_status === 'REJECTED' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {profile.kyc_status.toLowerCase()}
                    </span>
                  </div>
                  
                  {profile.kyc_verified_at && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-medium">Verified At:</p>
                      <p className="text-sm">{formatDate(profile.kyc_verified_at)}</p>
                    </div>
                  )}
                  
                  {profile.kyc_rejected_reason && (
                    <div className="mt-2">
                      <p className="font-medium">Rejection Reason:</p>
                      <p className="text-sm">{profile.kyc_rejected_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Section Modals */}
      <EditSectionModal
        isOpen={activeEditSection === 'personal'}
        onClose={() => setActiveEditSection(null)}
        title="Edit Personal Information"
        fields={[
          { 
            name: 'full_name', 
            label: 'Full Name', 
            type: 'text', 
            icon: <FaUser />, 
            disabled: true
          },
          { 
            name: 'gender', 
            label: 'Gender', 
            type: 'select', 
            options: ['male', 'female', 'other'], 
            icon: <FaVenusMars />,
            required: true
          },
          { 
            name: 'date_of_birth', 
            label: 'Date of Birth', 
            type: 'date', 
            icon: <FaBirthdayCake />,
            required: true
          },
          { 
            name: 'phone', 
            label: 'Phone', 
            type: 'tel', 
            icon: <FaPhone />,
            required: true,
            pattern: "[0-9]{10}",
            title: "10 digit phone number",
            disabled: true
          },
          { 
            name: 'whatsapp_number', 
            label: 'WhatsApp', 
            type: 'tel', 
            icon: <FaWhatsapp />,
            required: true,
            pattern: "[0-9]{10}",
            title: "10 digit phone number"
          },
          { 
            name: 'bio', 
            label: 'Bio', 
            type: 'textarea', 
            icon: <FaInfoCircle /> 
          },
          {
            name: 'adhaar_card_number',
            label: 'Aadhaar Number',
            type: 'text',
            icon: <FaIdCard />,
            pattern: '[0-9]{12}',
            title: '12 digit Aadhaar number',
            required: true
          },
          {
            name: 'pancard_number',
            label: 'PAN Number',
            type: 'text',
            icon: <FaIdCard />,
            pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
            title: 'Valid PAN format (e.g., ABCDE1234F)',
            required: true
          },
          {
            name: 'adhaar_card_pic',
            label: 'Aadhaar Card Picture',
            type: 'file',
            accept: 'image/*,application/pdf',
            icon: <FaIdCard />,
            required: true
          },
          {
            name: 'pancard_pic',
            label: 'PAN Card Picture',
            type: 'file',
            accept: 'image/*,application/pdf',
            icon: <FaPassport />,
            required: true
          },
          { 
            name: 'facebook', 
            label: 'Facebook', 
            type: 'url', 
            icon: <FaFacebook /> 
          },
          { 
            name: 'twitter', 
            label: 'Twitter', 
            type: 'url', 
            icon: <FaTwitter /> 
          },
          { 
            name: 'instagram', 
            label: 'Instagram', 
            type: 'url', 
            icon: <FaInstagram /> 
          },
          { 
            name: 'youtube', 
            label: 'YouTube', 
            type: 'url', 
            icon: <FaYoutube /> 
          },
          { 
            name: 'profile_picture', 
            label: 'Profile Picture', 
            type: 'file', 
            accept: 'image/*', 
            icon: <FaUser /> 
          }
        ]}
        initialData={{
          full_name: profile.full_name,
          gender: profile.gender,
          date_of_birth: profile.date_of_birth,
          phone: profile.phone,
          whatsapp_number: profile.whatsapp_number,
          bio: profile.bio,
          facebook: profile.facebook,
          twitter: profile.twitter,
          instagram: profile.instagram,
          youtube: profile.youtube,
          adhaar_card_number: profile.adhaar_card_number,
          pancard_number: profile.pancard_number,
          profile_picture: profile.profile_picture,
          pancard_pic: profile.pancard_pic,
          adhaar_card_pic: profile.adhaar_card_pic,
        }}
        onSave={(data) => handleSave('personal', data)}
        isLoading={isUpdating}
      />

      <EditSectionModal
        isOpen={activeEditSection === 'address'}
        onClose={() => setActiveEditSection(null)}
        title="Edit Address"
        fields={[
          { 
            name: 'street_address', 
            label: 'Street Address', 
            type: 'text', 
            icon: <FaHome />,
            required: true
          },
          { 
            name: 'postal_code', 
            label: 'Postal Code', 
            type: 'text', 
            icon: <FaAddressCard />,
            required: true,
            pattern: "[0-9]{6}",
            title: "6 digit postal code"
          },
          { 
            name: 'city', 
            label: 'City', 
            type: 'text', 
            icon: <MdLocationCity />,
            required: true
          },
          { 
            name: 'state', 
            label: 'State', 
            type: 'state', 
            icon: <FaGlobe />,
            required: true
          },
          { 
            name: 'district', 
            label: 'District', 
            type: 'district', 
            icon: <FaMapMarkerAlt />,
            required: true
          },
          { 
            name: 'country', 
            label: 'Country', 
            type: 'text', 
            icon: <FaGlobe />,
            required: true,
            disabled: true
          }
        ]}
        initialData={profile.address}
        onSave={(data) => handleSave('address', data)}
        isLoading={isUpdating}
      />

      <EditSectionModal
        isOpen={activeEditSection === 'business'}
        onClose={() => setActiveEditSection(null)}
        title="Edit Business Information"
        fields={[
          { 
            name: 'company_name', 
            label: 'Company Name', 
            type: 'text', 
            icon: <BsBuilding />,
            required: true
          },
          { 
            name: 'company_email', 
            label: 'Company Email', 
            type: 'email', 
            icon: <MdEmail />,
            required: true
          },
          { 
            name: 'company_phone', 
            label: 'Company Phone', 
            type: 'tel', 
            icon: <FaPhone />,
            required: true,
            pattern: "[0-9]{10}",
            title: "10 digit phone number"
          },
          { 
            name: 'designation', 
            label: 'Designation', 
            type: 'text', 
            icon: <FaUserTie />,
            required: true
          },
          { 
            name: 'business_type', 
            label: 'Business Type', 
            type: 'select', 
            options: ['business','individual','proprietorship', 'public_limited', 'private_limited', 'partnership', 'llp', 'other'], 
            icon: <FaIndustry />,
            required: true
          },
          { 
            name: 'business_category', 
            label: 'Business Category', 
            type: 'select', 
            options: ['service_provider','production','trading','restaurant','manufacturer', 'wholesaler', 'other'], 
            icon: <MdBusinessCenter />,
            required: true
          },
          { 
            name: 'business_description', 
            label: 'Business Description', 
            type: 'textarea', 
            icon: <FaInfoCircle />,
            required: true
          },
          { 
            name: 'gst_number', 
            label: 'GST Number', 
            type: 'text', 
            icon: <FaIdCard />,
            pattern: "[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}",
            title: "22ABCDE1234F1Z5 format",
            required: true
          },
          { 
            name: 'pan_number', 
            label: 'Company PAN Number', 
            type: 'text', 
            icon: <FaPassport />,
            pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}",
            title: "ABCDE1234F format",
            required: false
          },
          { 
            name: 'business_registration_number', 
            label: 'Business Registration', 
            type: 'text', 
            icon: <FaFileAlt />,
            required: true
          },
          { 
            name: 'food_license_number', 
            label: 'Food License', 
            type: 'text', 
            icon: <FaCalendarAlt /> 
          },
          { 
            name: 'registered_address', 
            label: 'Registered Street Address', 
            type: 'textarea', 
            icon: <FaHome />,
            required: true
          },
          { 
            name: 'operational_address', 
            label: 'Company Registered Street Address', 
            type: 'textarea', 
            icon: <FaHome />,
            required: true
          },
          { 
            name: 'pincode', 
            label: 'Pincode', 
            type: 'text', 
            icon: <FaAddressCard />,
            required: true,
            pattern: "[0-9]{6}",
            title: "6 digit pincode",
          },
          { 
            name: 'state', 
            label: 'State', 
            type: 'state', 
            icon: <FaGlobe />,
            required: true
          },
          { 
            name: 'district', 
            label: 'District', 
            type: 'district', 
            icon: <FaMapMarkerAlt />,
            required: true
          },
          { 
            name: 'gst_certificate', 
            label: 'GST Certificate', 
            type: 'file', 
            accept: 'image/*,.pdf', 
            icon: <FaIdCard />,
            required: true
          },
          { 
            name: 'pan_card', 
            label: 'Company PANCard', 
            type: 'file', 
            accept: 'image/*,.pdf', 
            icon: <FaPassport />,

          },
          { 
            name: 'business_registration_doc', 
            label: 'Business Registration Doc', 
            type: 'file', 
            accept: 'image/*,.pdf', 
            icon: <FaFileAlt />,
            required: true
          },
          { 
            name: 'food_license_doc', 
            label: 'Food License Doc', 
            type: 'file', 
            accept: 'image/*,.pdf', 
            icon: <FaCalendarAlt /> 
          }
        ]}
        initialData={profile.company}
        onSave={(data) => handleSave('business', data)}
        isLoading={isUpdating}
      />

      <EditSectionModal
        isOpen={activeEditSection === 'payment'}
        onClose={() => setActiveEditSection(null)}
        title="Edit Payment Details"
        fields={[
          { 
            name: 'upi_id', 
            label: 'UPI ID', 
            type: 'text', 
            icon: <MdPayment />,
            required: true
          },
          { 
            name: 'account_holder_name', 
            label: 'Account Holder Name', 
            type: 'text', 
            icon: <FaUser />,
            required: true
          },
          { 
            name: 'bank_name', 
            label: 'Bank Name', 
            type: 'text', 
            icon: <BsBank2 />,
            required: true
          },
          { 
            name: 'account_number', 
            label: 'Account Number', 
            type: 'text', 
            icon: <BsCreditCard />,
            required: true
          },
          { 
            name: 'ifsc_code', 
            label: 'IFSC Code', 
            type: 'text', 
            icon: <FaCreditCard />,
            required: true
          },
          { 
            name: 'passbook_pic', 
            label: 'Bank Passbook (Image/Pdf)', 
            type: 'file', 
            accept: 'image/*,.pdf',
            icon: <FaFileImage />,
            required: true
          }
        ]}
        initialData={{
          upi_id: profile.upi_id,
          account_holder_name: profile.account_holder_name,
          bank_name: profile.bank_name,
          account_number: profile.account_number,
          ifsc_code: profile.ifsc_code
        }}
        onSave={(data) => handleSave('payment', data)}
        isLoading={isUpdating}
      />
    </div>
  );
}