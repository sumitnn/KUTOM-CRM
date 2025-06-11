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
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-secondary shadow-xl rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 text-white">
        <div className="avatar">
          <div className="w-28 h-28 rounded-full ring-4 ring-white ring-opacity-50">
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
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">
            {profile.full_name || profile.user.username || 'No name provided'}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{profile.user.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{profile.phone || profile.whatsapp_number || 'No phone provided'}</span>
            </div>
          </div>
          <div className="badge badge-accent badge-lg mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {profile.user.username ? `@${profile.user.username}` : 'User'}
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)} 
          className="btn btn-accent btn-sm sm:btn-md text-white hover:bg-opacity-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Profile
        </button>
      </div>

      {/* Stats Cards - Removed since not in API response */}
      
      {/* Personal Details */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-xl md:text-2xl">Personal Information</h2>
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn btn-ghost btn-sm text-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Full Name</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.full_name || 'No name provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Username</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.user.username || 'No username provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.user.email || 'No email provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Gender</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.gender || 'Not specified'}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Phone</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.phone || 'No phone provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">WhatsApp</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.whatsapp_number || 'Not provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Date of Birth</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.date_of_birth || 'Not specified'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Address</span>
                </label>
                <div className="textarea textarea-bordered flex items-center min-h-12 py-3">
                  {formatAddress(profile.address)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bio Section */}
          <div className="mt-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Bio</span>
              </label>
              <div className="textarea textarea-bordered flex items-center min-h-20 py-3">
                {profile.bio || 'No bio provided'}
              </div>
            </div>
          </div>
          
          {/* Social Media Links */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Facebook</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.facebook || 'Not provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Twitter</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.twitter || 'Not provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Instagram</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.instagram || 'Not provided'}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">YouTube</span>
                </label>
                <div className="input input-bordered flex items-center h-12">
                  {profile.youtube || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
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