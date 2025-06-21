import React, { useEffect, useState } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { EditProfileModal } from "../../components/EditProfileModal";
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  FaEdit, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, 
  FaUser, FaVenusMars, FaWhatsapp, FaFacebook, FaTwitter, 
  FaInstagram, FaYoutube, FaIdCard, FaPassport
} from 'react-icons/fa';
import { BsBank2, BsCreditCard } from 'react-icons/bs';


export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { data: profileData, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();

  const defaultProfile = {
    id: '',
    user: { username: '', email: '' },
    full_name: '',
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
      state: '',
      district: '',
      postal_code: '',
      country: 'India'
    }
  };

  const profile = profileData ? { ...defaultProfile, ...profileData } : defaultProfile;

  const handleSave = async (updatedData) => {
    try {
      const formData = new FormData();
      
      // Append only changed fields
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] !== undefined && updatedData[key] !== null) {
          if (key === 'address') {
            Object.keys(updatedData.address).forEach(addrKey => {
              formData.append(`address[${addrKey}]`, updatedData.address[addrKey]);
            });
          } else if (key === 'user') {
            formData.append('username', updatedData.user.username);
          } else if (key !== 'profile_picture') {
            formData.append(key, updatedData[key]);
          }
        }
      });
      
      if (updatedData.profile_picture instanceof File) {
        formData.append('profile_picture', updatedData.profile_picture);
      }

      await updateProfile(formData).unwrap();
      refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
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
      address.district.name,
      address.state.name,
      address.postal_code,
      address.country
    ].filter(Boolean);
    return parts.join(', ') || 'No address provided';
  };

  const hasSocialLinks = profile.facebook || profile.twitter || profile.instagram || profile.youtube;
  const hasBankDetails = profile.bank_upi || profile.account_number;
  const hasKycDetails = profile.adhaar_card_number || profile.pancard_number;

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
              {profile.full_name || profile.user.username || 'No name provided'}
            </h1>
            <p className="text-gray-600">@{profile.user.username || 'user'}</p>
            {profile.kyc_status === 'APPROVED' && (
              <span className="badge badge-success mt-1">KYC Verified</span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)} 
          className="btn btn-primary gap-2"
        >
          <FaEdit /> Edit Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-xl font-bold mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaUser className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{profile.full_name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaVenusMars className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">
                        {profile.gender ? 
                          profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 
                          '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaBirthdayCake className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(profile.date_of_birth)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaWhatsapp className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <p className="font-medium">{profile.whatsapp_number || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile.user.email || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bio Section */}
              {profile.bio && (
                <div className="mt-6">
                  <h3 className="font-bold mb-2">About</h3>
                  <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address Card */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-xl font-bold mb-4">Address</h2>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-gray-500 mt-1" />
                <p className="font-medium">
                  {formatAddress(profile.address)}
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Card */}
          {hasSocialLinks && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4">Social Media</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.facebook && (
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline">
                      <SiFacebook className="text-lg" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-400 hover:underline">
                      <SiTwitter className="text-lg" />
                      <span>Twitter</span>
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-pink-600 hover:underline">
                      <SiInstagram className="text-lg" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {profile.youtube && (
                    <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-red-600 hover:underline">
                      <SiYoutube className="text-lg" />
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
          {(profile.bank_upi || profile.account_number) && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4">
                  {profile.bank_upi ? 'UPI Details' : 'Bank Details'}
                </h2>
                <div className="space-y-4">
                  {profile.bank_upi ? (
                    <div>
                      <p className="text-sm text-gray-500">UPI ID</p>
                      <p className="font-medium">{profile.bank_upi}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <BsBank2 className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Bank Name</p>
                          <p className="font-medium">{profile.bank_name || '-'}</p>
                        </div>
                      </div>
                      {profile.account_holder_name && (
                        <div>
                          <p className="text-sm text-gray-500">Account Holder</p>
                          <p className="font-medium">{profile.account_holder_name}</p>
                        </div>
                      )}
                      {profile.account_number && (
                        <div className="flex items-center gap-3">
                          <BsCreditCard className="text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Account Number</p>
                            <p className="font-medium">{profile.account_number}</p>
                          </div>
                        </div>
                      )}
                      {profile.ifsc_code && (
                        <div>
                          <p className="text-sm text-gray-500">IFSC Code</p>
                          <p className="font-medium">{profile.ifsc_code}</p>
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
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4">KYC Details</h2>
                <div className="space-y-4">
                  {profile.adhaar_card_number && (
                    <div className="flex items-center gap-3">
                      <FaIdCard className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Aadhaar Card Number</p>
                        <p className="font-medium">{profile.adhaar_card_number}</p>
                      </div>
                    </div>
                  )}
                  {profile.pancard_number && (
                    <div className="flex items-center gap-3">
                      <FaPassport className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">PAN Card Number</p>
                        <p className="font-medium">{profile.pancard_number}</p>
                      </div>
                    </div>
                  )}
                  {profile.kyc_status && (
                    <div>
                      <p className="text-sm text-gray-500">KYC Status</p>
                      <p className="font-medium capitalize">
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
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditing(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}