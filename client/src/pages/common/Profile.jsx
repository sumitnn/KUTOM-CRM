import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { useGetStatesQuery, useGetDistrictsQuery } from '../../features/location/locationApi';
import {
  FaEdit, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, 
  FaUser, FaVenusMars, FaWhatsapp, FaFacebook, FaTwitter, 
  FaInstagram, FaYoutube, FaIdCard, FaPassport, FaBuilding,
   FaFileAlt, FaAddressCard, FaFacebookF, FaCopy,
  FaGlobe, FaHome, FaStore,  FaCreditCard,
  FaShieldAlt, FaUserTie, FaIndustry, FaInfoCircle, FaCalendarAlt
} from 'react-icons/fa';
import { BsBank2, BsCreditCard, BsBuilding } from 'react-icons/bs';
import { MdBusinessCenter, MdEmail, MdLocationCity, MdPayment } from 'react-icons/md';
import {  GiReceiveMoney } from 'react-icons/gi';
import { toast } from 'react-toastify';
import { FaFileImage, FaFilePdf } from 'react-icons/fa';
import ModalPortal from '../../components/ModalPortal'; 
// Lazy imports
const Spinner = lazy(() => import('../../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../../components/common/ErrorMessage'));
const EditSectionModal = lazy(() => import('./EditSectionModal'));

const DocumentPreviewButton = ({ value, label }) => {
  if (!value) return <span className="text-gray-500">Not provided</span>;
  
  const fileExtension = value.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
  const isPDF = fileExtension === 'pdf';

  return (
    <a 
      href={value} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:text-amber-600 font-bold text-sm transition-colors"
    >
      {isPDF ? <FaFilePdf className="text-red-500" /> : <FaFileImage className="text-blue-500" />}
      View {label} ({isPDF ? 'PDF' : 'Image'})
    </a>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

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
    <div className="flex items-start gap-3 py-3 px-4 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="text-purple-600 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 font-semibold mb-1">{label}</p>
        <div className="flex justify-between items-center">
          <p className="font-bold text-gray-900 truncate">{value || '__'}</p>
          {copyable && value && (
            <button 
              onClick={() => handleCopy(value)}
              className="btn btn-ghost btn-xs ml-2 flex-shrink-0 hover:bg-gray-200 transition-colors"
              aria-label={`Copy ${label}`}
            >
              <FaCopy className="text-primary opacity-70 hover:opacity-100" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDocumentField = (icon, label, value, docUrl, copyable = false) => (
    <div className="flex items-start gap-3 py-3 px-4 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 font-semibold mb-1">{label}</p>
        <div className="flex justify-between items-center mb-2">
          <p className="font-bold text-gray-900 truncate">{value || 'Not Provided'}</p>
          {copyable && value && (
            <button 
              onClick={() => handleCopy(value)}
              className="btn btn-ghost btn-xs ml-2 flex-shrink-0 hover:bg-gray-200 transition-colors"
              aria-label={`Copy ${label}`}
            >
              <FaCopy className="text-primary opacity-70 hover:opacity-100" size={14} />
            </button>
          )}
        </div>
        {docUrl && (
          <DocumentPreviewButton value={docUrl} label={label.split(' ')[0]} />
        )}
      </div>
    </div>
  );

  if (isLoading) return (
    <Suspense fallback={<LoadingFallback />}>
      <Spinner fullScreen={false} />
    </Suspense>
  );
  
  if (isError) return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorMessage message="Failed to load profile data" />
    </Suspense>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-white">
              <img 
                src={profile.profile_picture || 'https://i.pravatar.cc/150?img=5'} 
                alt={profile.full_name || profile.username}
                className="object-cover w-full h-full rounded-full"
                onError={(e) => {
                  e.target.src = 'https://i.pravatar.cc/150?img=5';
                }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
              {profile.full_name || profile.username || 'No name provided'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-gray-600 font-semibold text-sm">@{profile.username || 'user'}</p>
              {profile.role && (
                <span className="badge badge-primary capitalize font-semibold text-xs">{profile.role}</span>
              )}
              {profile.kyc_verified ? (
                <span className="badge badge-success font-semibold text-xs">KYC Verified</span>
              ) : (
                <span className="badge badge-warning font-semibold text-xs">KYC Pending</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-40 bg-gray-200 rounded-full h-2.5 flex-1">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${profile.completion_percentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 font-semibold whitespace-nowrap">
                {profile.completion_percentage || 0}% Complete
              </span>
            </div>
          </div>
        </div>
        
        {profile.role === "vendor" && profile.vendor_id && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <FaStore className="text-primary text-lg" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">Vendor ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{profile.vendor_id}</p>
                  <button 
                    onClick={() => handleCopy(profile.vendor_id)}
                    className="btn btn-ghost btn-xs hover:bg-primary/10 transition-colors"
                    aria-label="Copy Vendor ID"
                  >
                    <FaCopy className="text-primary" size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {profile.role === "stockist" && profile.stockist_id && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <FaStore className="text-primary text-lg" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">Stockist ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{profile.stockist_id}</p>
                  <button 
                    onClick={() => handleCopy(profile.stockist_id)}
                    className="btn btn-ghost btn-xs hover:bg-primary/10 transition-colors"
                    aria-label="Copy Stockist ID"
                  >
                    <FaCopy className="text-primary" size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {profile.role === "reseller" && profile.reseller_id && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <FaStore className="text-primary text-lg" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">Reseller ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{profile.reseller_id}</p>
                  <button 
                    onClick={() => handleCopy(profile.reseller_id)}
                    className="btn btn-ghost btn-xs hover:bg-primary/10 transition-colors"
                    aria-label="Copy Reseller ID"
                  >
                    <FaCopy className="text-primary" size={12} />
                  </button>
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
          <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="card-body p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="card-title text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FaUser className="text-primary text-lg" />
                  </div>
                  Profile Summary
                </h2>
                <button 
                  onClick={() => setActiveEditSection('personal')}
                  className="btn btn-primary btn-sm gap-2 hover:scale-105 transition-transform"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {renderField(<FaUser className="text-lg" />, "Full Name", profile.full_name)}
                  {renderField(<FaVenusMars className="text-lg" />, "Gender", profile.gender)}
                  {renderField(<FaBirthdayCake className="text-lg" />, "Date of Birth", formatDate(profile.date_of_birth))}
                  {renderField(<FaInfoCircle className="text-lg" />, "Bio", profile.bio)}
                </div>
                
                <div className="space-y-3">
                  {renderField(<FaPhone className="text-lg" />, "Phone", profile.phone, true)}
                  {renderField(<FaWhatsapp className="text-lg" />, "WhatsApp", profile.whatsapp_number, true)}
                  {renderField(<FaEnvelope className="text-lg" />, "Email", profile.email, true)}
                </div>
              </div>
              
              {/* Social Media */}
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FaGlobe className="text-blue-600" />
                  </div>
                  Social Media
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
          <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="card-body p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="card-title text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <FaBuilding className="text-green-600 text-lg" />
                  </div>
                  Business Information
                </h2>
                <button 
                  onClick={() => setActiveEditSection('business')}
                  className="btn btn-primary btn-sm gap-2 hover:scale-105 transition-transform"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
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
                
                <div className="space-y-3">
                  {renderField(<MdEmail className="text-lg" />, "Company Email", profile.company.company_email, true)}
                  {renderField(<FaPhone className="text-lg" />, "Company Phone", profile.company.company_phone, true)}
                  {renderField(<FaIdCard className="text-lg" />, "GST Number", profile.company.gst_number, true)}
                  {renderField(<FaPassport className="text-lg" />, "PAN Number", profile.company.pan_number, true)}
                  {renderField(<FaFileAlt className="text-lg" />, "Business Registration", profile.company.business_registration_number, true)}
                  {renderField(<FaCalendarAlt className="text-lg" />, "Food License", profile.company.food_license_number, true)}
                </div>
              </div>
              
              {/* Business Documents */}
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <FaFileAlt className="text-orange-600" />
                  </div>
                  Business Documents
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
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <FaMapMarkerAlt className="text-purple-600" />
                  </div>
                  Business Addresses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                      <FaHome className="text-gray-600" /> Registered Address
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{profile.company.registered_address || '__'}</p>
                    {profile.company.pincode && (
                      <p className="text-sm mt-2 font-semibold text-gray-600">Pincode: {profile.company.pincode}</p>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                      <FaStore className="text-gray-600" /> Operational Address
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{profile.company.operational_address || '__'}</p>
                    {profile.company.pincode && (
                      <p className="text-sm mt-2 font-semibold text-gray-600">Pincode: {profile.company.pincode}</p>
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
          <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="card-body p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="card-title text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FaMapMarkerAlt className="text-blue-600 text-lg" />
                  </div>
                  Personal Address
                </h2>
                <button 
                  onClick={() => setActiveEditSection('address')}
                  className="btn btn-primary btn-sm gap-2 hover:scale-105 transition-transform"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="space-y-3">
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
              
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  <p className="font-bold text-gray-900">Full Address:</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {formatAddress(profile.address)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="card-body p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="card-title text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <MdPayment className="text-green-600 text-lg" />
                  </div>
                  Payment Details
                </h2>
                <button 
                  onClick={() => setActiveEditSection('payment')}
                  className="btn btn-primary btn-sm gap-2 hover:scale-105 transition-transform"
                  disabled={isUpdating}
                >
                  <FaEdit /> Edit
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 p-4 rounded-xl border border-primary/20">
                  <h3 className="mb-3 flex items-center font-bold text-gray-900 gap-2">
                    <GiReceiveMoney className="text-primary" /> UPI Details
                  </h3>
                  {renderField(<MdPayment className="text-lg" />, "UPI ID", profile.upi_id, true)}
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                    <BsBank2 className="text-gray-600" /> Bank Details
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
          <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="card-body p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <FaShieldAlt className="text-red-600 text-lg" />
                  </div>
                  KYC Details
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                    <FaIdCard className="text-gray-600" /> Identity Documents
                  </h3>
                  {renderDocumentField(<FaIdCard className="text-lg" />, "Aadhaar Card Number", 
                    profile.adhaar_card_number, profile.adhaar_card_pic, true)}
                  
                  {renderDocumentField(<FaPassport className="text-lg" />, "PAN Card Number", 
                    profile.pancard_number, profile.pancard_pic, true)}
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                    <FaShieldAlt className="text-gray-600" /> KYC Status
                  </h3>
                  <div className="flex items-center justify-between py-2">
                    <p className="font-semibold text-gray-700">Status:</p>
                    <span className={`badge font-semibold ${
                      profile.kyc_status === 'APPROVED' ? 'badge-success' :
                      profile.kyc_status === 'REJECTED' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {profile.kyc_status?.toLowerCase() || 'pending'}
                    </span>
                  </div>
                  
                  {profile.kyc_verified_at && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-200">
                      <p className="font-semibold text-gray-700">Verified At:</p>
                      <p className="text-sm text-gray-600">{formatDate(profile.kyc_verified_at)}</p>
                    </div>
                  )}
                  
                  {profile.kyc_rejected_reason && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="font-semibold text-gray-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-gray-600 bg-red-50 p-2 rounded">{profile.kyc_rejected_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Section Modals with Suspense */}
      <Suspense fallback={null}>
        <ModalPortal>
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
        /></ModalPortal>
        <ModalPortal>
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
        /></ModalPortal>
        <ModalPortal>
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
        /></ModalPortal>
        <ModalPortal>
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
        /></ModalPortal>
      </Suspense>
    </div>
  );
}