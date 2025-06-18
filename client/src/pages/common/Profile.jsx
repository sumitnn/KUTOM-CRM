import React, { useEffect } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { EditProfileModal } from "../../components/EditProfileModal";
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function Profile() {
  const [isEditing, setIsEditing] = React.useState(false);
  const { data: profileData, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();

  // Default profile data structure based on API response
  const defaultProfile = {
    id: '',
    user: {
      username: '',
      email: ''
    },
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
    address: {
      street_address: '',
      city: '',
      state: '',
      district: '',
      postal_code: '',
      country: '',
      is_primary: false
    }
  };

  // Merge API data with defaults to ensure all fields exist
  const profile = profileData ? { ...defaultProfile, ...profileData } : defaultProfile;

  const handleSave = async (updatedData) => {
    try {
      await updateProfile(updatedData).unwrap();
      refetch(); // Refresh the data after successful update
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (isLoading) return <Spinner fullScreen={false} />;
  if (isError) return <ErrorMessage message="Failed to load profile data" />;

  // Format date of birth
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format address string
  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    const parts = [
      address.street_address,
      address.city,
      address.district,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean);
    return parts.join(', ') || 'No address provided';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white rounded-lg shadow p-6">
        <div className="avatar">
          <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img 
              src={profile.profile_picture || 'https://i.pravatar.cc/150?img=5'} 
              alt="Profile" 
              className="object-cover" 
              onError={(e) => {
                e.target.src = 'https://i.pravatar.cc/150?img=5';
              }}
            />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold">
            {profile.full_name || profile.user.username || 'No name provided'}
          </h1>
          <p className="text-gray-600 mb-2">@{profile.user.username || 'user'}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
            {profile.user.email && (
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {profile.user.email}
              </div>
            )}
            
            {(profile.phone || profile.whatsapp_number) && (
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {profile.phone || profile.whatsapp_number}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => setIsEditing(true)} 
          className="btn btn-primary btn-sm md:btn-md"
        >
          Edit Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Personal Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-primary text-sm font-medium"
            >
              Edit
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500">Full Name</label>
                <p className="font-medium">{profile.full_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">Gender</label>
                <p className="font-medium">{profile.gender || '-'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">Date of Birth</label>
                <p className="font-medium">{formatDate(profile.date_of_birth)}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500">Phone</label>
                <p className="font-medium">{profile.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">WhatsApp</label>
                <p className="font-medium">{profile.whatsapp_number || '-'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">Address</label>
                <p className="font-medium">{formatAddress(profile.address)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Card */}
        {profile.bio && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}

        {/* Bank Details Card */}
        {(profile.bank_upi || profile.account_number) && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Bank Details</h2>
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-primary text-sm font-medium"
              >
                Edit
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {profile.bank_upi && (
                  <div>
                    <label className="block text-sm text-gray-500">UPI ID</label>
                    <p className="font-medium">{profile.bank_upi}</p>
                  </div>
                )}
                {profile.account_holder_name && (
                  <div>
                    <label className="block text-sm text-gray-500">Account Holder</label>
                    <p className="font-medium">{profile.account_holder_name}</p>
                  </div>
                )}
                {profile.bank_name && (
                  <div>
                    <label className="block text-sm text-gray-500">Bank Name</label>
                    <p className="font-medium">{profile.bank_name}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {profile.account_number && (
                  <div>
                    <label className="block text-sm text-gray-500">Account Number</label>
                    <p className="font-medium">{profile.account_number}</p>
                  </div>
                )}
                {profile.ifsc_code && (
                  <div>
                    <label className="block text-sm text-gray-500">IFSC Code</label>
                    <p className="font-medium">{profile.ifsc_code}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Social Media Card */}
        {(profile.facebook || profile.twitter || profile.instagram || profile.youtube) && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Social Media</h2>
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-primary text-sm font-medium"
              >
                Edit
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.facebook && (
                <div>
                  <label className="block text-sm text-gray-500">Facebook</label>
                  <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {profile.facebook}
                  </a>
                </div>
              )}
              {profile.twitter && (
                <div>
                  <label className="block text-sm text-gray-500">Twitter</label>
                  <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {profile.twitter}
                  </a>
                </div>
              )}
              {profile.instagram && (
                <div>
                  <label className="block text-sm text-gray-500">Instagram</label>
                  <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {profile.instagram}
                  </a>
                </div>
              )}
              {profile.youtube && (
                <div>
                  <label className="block text-sm text-gray-500">YouTube</label>
                  <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {profile.youtube}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
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