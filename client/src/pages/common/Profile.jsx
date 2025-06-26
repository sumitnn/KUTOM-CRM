import React, { useState } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { EditProfileModal } from "../../components/EditProfileModal";
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  FaEdit, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, 
  FaUser, FaVenusMars, FaWhatsapp, FaFacebook, FaTwitter, 
  FaInstagram, FaYoutube, FaIdCard, FaPassport, FaBuilding,
  FaPercentage, FaFileAlt, FaAddressCard, FaFacebookF, FaCopy
} from 'react-icons/fa';
import { BsBank2, BsCreditCard } from 'react-icons/bs';
import { MdBusinessCenter, MdEmail, MdLocationCity } from 'react-icons/md';
import { GiCommercialAirplane } from 'react-icons/gi';
import { toast } from 'react-toastify';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { data: profileData, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();

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
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    adhaar_card_number: '',
    pancard_number: '',
    kyc_status: 'PENDING',
    address: {
      street_address: '',
      city: '',
      state_name: '',
      district_name: '',
      postal_code: '',
      country: 'India'
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
      state: null,
      district: null,
      pincode: ''
    }
  };

  const profile = profileData ? { 
    ...defaultProfile, 
    ...profileData.profile, 
    address: profileData.address,
    company: profileData.company,
    username: profileData.username,
    email: profileData.email,
    id: profileData.id,
    role: profileData.role,
    stockist_id:profileData.stockist_id,
    vendor_id:profileData.vendor_id,
    reseller_id:profileData.reseller_id,
  } : defaultProfile;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSave = async (updatedData) => {
    try {
      const formData = new FormData();
      
      // Append profile fields
      Object.keys(updatedData).forEach(key => {
        if (key !== 'user' && key !== 'address' && key !== 'company' && key !== 'profile_picture') {
          if (updatedData[key] !== undefined && updatedData[key] !== null) {
            formData.append(key, updatedData[key]);
          }
        }
      });

      // Append address fields
      if (updatedData.address) {
        Object.keys(updatedData.address).forEach(key => {
          formData.append(`address[${key}]`, updatedData.address[key]);
        });
      }

      // Append company fields
      if (updatedData.company) {
        Object.keys(updatedData.company).forEach(key => {
          if (key !== 'state' && key !== 'district') {
            formData.append(`company[${key}]`, updatedData.company[key]);
          }
        });
      }

      // Append user fields
      if (updatedData.user?.username) {
        formData.append('username', updatedData.user.username);
      }

      // Append files
      if (updatedData.profile_picture instanceof File) {
        formData.append('profile_picture', updatedData.profile_picture);
      }

      await updateProfile(formData).unwrap();
      refetch();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    const parts = [
      address.street_address,
      address.city,
      address.district_name,
      address.state_name,
      address.postal_code,
      address.country
    ].filter(Boolean);
    return parts.join(', ') || 'No address provided';
  };

  const formatBusinessType = (type) => {
    if (!type) return 'Not specified';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const hasSocialLinks = profile.facebook || profile.twitter || profile.instagram || profile.youtube;
  const hasBankDetails = profile.bank_upi || profile.account_number;
  const hasKycDetails = profile.adhaar_card_number || profile.pancard_number;
  const hasCompanyDetails = profile.company?.company_name || profile.company?.business_type !== 'other';
  const completionPercentage = profile.completion_percentage || 0;

  const renderRoleId = () => {
    switch (profile.role?.toLowerCase()) {
      case 'vendor':
        return profile.vendor_id ? (
          <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <FaIdCard className="text-primary" />
              <div>
                <p className="text-sm text-gray-500 font-extrabold">Vendor ID</p>
                <p className="font-bold">{profile.vendor_id}</p>
              </div>
            </div>
            <button 
              onClick={() => handleCopy(profile.vendor_id)}
              className="btn btn-ghost btn-sm"
              aria-label="Copy Vendor ID"
            >
              <FaCopy className="text-primary" />
            </button>
          </div>
        ) : null;
      case 'stockist':
        return profile.stockist_id ? (
          <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <FaIdCard className="text-primary" />
              <div>
                <p className="text-sm text-gray-500 font-extrabold">Stockist ID</p>
                <p className="font-bold">{profile.stockist_id}</p>
              </div>
            </div>
            <button 
              onClick={() => handleCopy(profile.stockist_id)}
              className="btn btn-ghost btn-sm"
              aria-label="Copy Stockist ID"
            >
              <FaCopy className="text-primary" />
            </button>
          </div>
        ) : null;
      case 'reseller':
        return profile.reseller_id ? (
          <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <FaIdCard className="text-primary" />
              <div>
                <p className="text-sm text-gray-500 font-extrabold">Reseller ID</p>
                <p className="font-bold">{profile.reseller_id}</p>
              </div>
            </div>
            <button 
              onClick={() => handleCopy(profile.reseller_id)}
              className="btn btn-ghost btn-sm"
              aria-label="Copy Reseller ID"
            >
              <FaCopy className="text-primary" />
            </button>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  if (isLoading) return <Spinner fullScreen={false} />;
  if (isError) return <ErrorMessage message="Failed to load profile data" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img 
                src={profile.profile_picture || 'https://i.pravatar.cc/150?img=5'} 
                alt="Profile" 
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-gray-600 font-bold">@{profile.username || 'user'}</p>
              {profile.role && (
                <span className="badge badge-primary capitalize">{profile.role}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {profile.kyc_verified && (
                <span className="badge badge-success">KYC Verified</span>
              )}
              <div className="flex items-center gap-1 text-sm">
                <FaPercentage className="text-primary" />
                <span>Profile Completed: {completionPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)} 
          className="btn btn-primary gap-2 animate-bounce hover:animate-none"
        >
          <FaEdit /> Edit Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role ID Section */}
          {renderRoleId()}

          {/* Personal Info Card */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <h2 className="card-title text-xl font-bold mb-4 flex items-center gap-2">
                <FaUser /> Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaUser className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">Full Name</p>
                      <p className="font-bold">{profile.full_name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaVenusMars className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">Gender</p>
                      <p className="font-bold">
                        {profile.gender ? 
                          profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 
                          '---'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaBirthdayCake className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">Date of Birth</p>
                      <p className="font-bold">{formatDate(profile.date_of_birth)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">Phone</p>
                      <p className="font-bold">{profile.phone || '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaWhatsapp className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">WhatsApp Number</p>
                      <p className="font-bold">{profile.whatsapp_number || '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">Email</p>
                      <p className="font-bold">{profile.email || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bio Section */}
              {profile.bio && (
                <div className="mt-6">
                  <h3 className="font-extrabold mb-2">About</h3>
                  <p className="text-gray-700 whitespace-pre-line font-bold">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Card - Only show if there's company data */}
          {hasCompanyDetails && (
            <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4 flex items-center gap-2">
                  <FaBuilding /> Business Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {profile.company?.company_name && (
                      <div className="flex items-center gap-3">
                        <FaBuilding className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Company Name</p>
                          <p className="font-bold">{profile.company.company_name}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <GiCommercialAirplane className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500 font-extrabold">Business Type</p>
                        <p className="font-bold">
                          {formatBusinessType(profile.company?.business_type)}
                        </p>
                      </div>
                    </div>
                    
                    {profile.company?.business_category && (
                      <div className="flex items-center gap-3">
                        <MdBusinessCenter className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Business Category</p>
                          <p className="font-bold">
                            {formatBusinessType(profile.company.business_category)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {profile.company?.designation && (
                      <div className="flex items-center gap-3">
                        <MdBusinessCenter className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Designation</p>
                          <p className="font-bold">{profile.company.designation}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.company?.gst_number && (
                      <div className="flex items-center gap-3">
                        <FaIdCard className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">GST Number</p>
                          <p className="font-bold">{profile.company.gst_number}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.company?.pan_number && (
                      <div className="flex items-center gap-3">
                        <FaPassport className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">PAN Number</p>
                          <p className="font-bold">{profile.company.pan_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Business Description */}
                {profile.company?.business_description && (
                  <div className="mt-6">
                    <h3 className="font-extrabold mb-2">Business Description</h3>
                    <p className="text-gray-700 whitespace-pre-line font-bold">
                      {profile.company.business_description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Card */}
          <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <h2 className="card-title text-xl font-extrabold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt /> Address
              </h2>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-gray-500 mt-1" />
                <p className="font-bold">
                  {formatAddress(profile.address)}
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Card */}
          {hasSocialLinks && (
            <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4 flex items-center gap-2">
                  <FaFacebook /> Social Media
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.facebook && (
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline">
                      <FaFacebookF className="text-lg" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-400 hover:underline">
                      <FaTwitter className="text-lg" />
                      <span>Twitter</span>
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-pink-600 hover:underline">
                      <FaInstagram className="text-lg" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {profile.youtube && (
                    <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-red-600 hover:underline">
                      <FaYoutube className="text-lg" />
                      <span>YouTube</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Payment Details Card */}
          {hasBankDetails && (
            <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4 flex items-center gap-2">
                  {profile.bank_upi ? <BsCreditCard /> : <BsBank2 />}
                  {profile.bank_upi ? 'UPI Details' : 'Bank Details'}
                </h2>
                <div className="space-y-4">
                  {profile.bank_upi ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-extrabold">UPI ID</p>
                        <p className="font-bold">{profile.bank_upi}</p>
                      </div>
                      <button 
                        onClick={() => handleCopy(profile.bank_upi)}
                        className="btn btn-ghost btn-sm"
                        aria-label="Copy UPI ID"
                      >
                        <FaCopy className="text-primary" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {profile.bank_name && (
                        <div className="flex items-center gap-3">
                          <BsBank2 className="text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500 font-extrabold">Bank Name</p>
                            <p className="font-bold">{profile.bank_name}</p>
                          </div>
                        </div>
                      )}
                      {profile.account_holder_name && (
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Account Holder</p>
                          <p className="font-bold">{profile.account_holder_name}</p>
                        </div>
                      )}
                      {profile.account_number && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BsCreditCard className="text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500 font-extrabold">Account Number</p>
                              <p className="font-bold">{profile.account_number}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCopy(profile.account_number)}
                            className="btn btn-ghost btn-sm"
                            aria-label="Copy Account Number"
                          >
                            <FaCopy className="text-primary" />
                          </button>
                        </div>
                      )}
                      {profile.ifsc_code && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 font-extrabold">IFSC Code</p>
                            <p className="font-bold">{profile.ifsc_code}</p>
                          </div>
                          <button 
                            onClick={() => handleCopy(profile.ifsc_code)}
                            className="btn btn-ghost btn-sm"
                            aria-label="Copy IFSC Code"
                          >
                            <FaCopy className="text-primary" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* KYC Details Card */}
          {hasKycDetails && (
            <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-extrabold mb-4 flex items-center gap-2">
                  <FaIdCard /> KYC Details
                </h2>
                <div className="space-y-4">
                  {profile.adhaar_card_number && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaIdCard className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Aadhaar Card Number</p>
                          <p className="font-bold">{profile.adhaar_card_number}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(profile.adhaar_card_number)}
                        className="btn btn-ghost btn-sm"
                        aria-label="Copy Aadhaar Number"
                      >
                        <FaCopy className="text-primary" />
                      </button>
                    </div>
                  )}
                  {profile.pancard_number && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaPassport className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">PAN Card Number</p>
                          <p className="font-bold">{profile.pancard_number}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(profile.pancard_number)}
                        className="btn btn-ghost btn-sm"
                        aria-label="Copy PAN Number"
                      >
                        <FaCopy className="text-primary" />
                      </button>
                    </div>
                  )}
                  {profile.kyc_status && (
                    <div>
                      <p className="text-sm text-gray-500 font-extrabold">KYC Status</p>
                      <p className="font-bold capitalize">
                        <span className={`badge ${
                          profile.kyc_status === 'APPROVED' ? 'badge-success' :
                          profile.kyc_status === 'REJECTED' ? 'badge-error' : 'badge-warning'
                        }`}>
                          {profile.kyc_status.toLowerCase()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Company Contact Card */}
          {profile.company?.company_phone || profile.company?.company_email ? (
            <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-extrabold mb-4 flex items-center gap-2">
                  <MdEmail /> Company Contact
                </h2>
                <div className="space-y-4">
                  {profile.company?.company_email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MdEmail className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Company Email</p>
                          <p className="font-bold">{profile.company.company_email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(profile.company.company_email)}
                        className="btn btn-ghost btn-sm"
                        aria-label="Copy Company Email"
                      >
                        <FaCopy className="text-primary" />
                      </button>
                    </div>
                  )}
                  {profile.company?.company_phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-extrabold">Company Phone Number</p>
                          <p className="font-bold">{profile.company.company_phone}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(profile.company.company_phone)}
                        className="btn btn-ghost btn-sm"
                        aria-label="Copy Company Phone"
                      >
                        <FaCopy className="text-primary" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditProfileModal 
          profile={profileData} 
          onClose={() => setIsEditing(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}