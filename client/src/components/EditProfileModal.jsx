import React, { useState, useEffect } from 'react';
import { useGetStatesQuery, useGetDistrictsQuery } from '../features/location/locationApi';

export const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...profile,
    address: profile.address || {
      street_address: '',
      city: '',
      state: '',
      district: '',
      postal_code: '',
      country: 'India',
      is_primary: true
    }
  });

  const [avatarPreview, setAvatarPreview] = useState(profile.profile_picture);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch states data
  const { data: states = [] } = useGetStatesQuery();
  // Fetch districts when state is selected
  const { data: districts = [] } = useGetDistrictsQuery(formData.address.state, {
    skip: !formData.address.state
  });

  useEffect(() => {
    setAvatarPreview(profile.profile_picture || '');
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
        setFormData(prev => ({ ...prev, profile_picture: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formDataToSend = new FormData();
      
      // Append all profile fields
      Object.keys(formData).forEach(key => {
        if (key !== 'user' && key !== 'address' && key !== 'profile_picture') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append user fields
      if (formData.user) {
        formDataToSend.append('username', formData.user.username);
      }
      
      // Append address fields
      if (formData.address) {
        Object.keys(formData.address).forEach(key => {
          formDataToSend.append(`address[${key}]`, formData.address[key]);
        });
      }
      
      // Append profile picture if changed
      if (formData.profile_picture instanceof File) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      await onSave(formDataToSend);
      setIsSaving(false);
      onClose();
    } catch (error) {
      setIsSaving(false);
      alert('Error saving profile: ' + (error.message || 'Please check your inputs'));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-base-100 rounded-box shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 btn btn-ghost btn-sm btn-circle"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
        
        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200 mb-6">
          <button 
            className={`tab ${activeTab === 'basic' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={`tab ${activeTab === 'address' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('address')}
          >
            Address
          </button>
          <button 
            className={`tab ${activeTab === 'social' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social & Bio
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column - Avatar and Basic Info */}
              <div className="w-full md:w-1/3 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="avatar">
                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img src={avatarPreview || 'https://i.pravatar.cc/150?img=5'} alt="Profile" />
                    </div>
                  </div>
                  <label className="btn btn-primary btn-sm">
                    Change Photo
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <div className="text-xs text-gray-500">
                    JPG, PNG (Max 5MB)
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Username</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.user.username}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      user: {
                        ...prev.user,
                        username: e.target.value
                      }
                    }))}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.user.email}
                    className="input input-bordered w-full"
                    disabled
                  />
                </div>
              </div>

              {/* Right Column - Detailed Info */}
              <div className="w-full md:w-2/3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Phone</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">WhatsApp Number</span>
                    </label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Gender</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="space-y-4 mt-6">
                  <h3 className="font-semibold">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bank UPI ID</span>
                      </label>
                      <input
                        type="text"
                        name="bank_upi"
                        value={formData.bank_upi || ''}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="yourname@upi"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Account Holder Name</span>
                      </label>
                      <input
                        type="text"
                        name="account_holder_name"
                        value={formData.account_holder_name || ''}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bank Name</span>
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name || ''}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Account Number</span>
                      </label>
                      <input
                        type="text"
                        name="account_number"
                        value={formData.account_number || ''}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">IFSC Code</span>
                      </label>
                      <input
                        type="text"
                        name="ifsc_code"
                        value={formData.ifsc_code || ''}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Street Address</span>
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    value={formData.address.street_address}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.address.city}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">State</span>
                  </label>
                  <select
                    name="state"
                    value={formData.address.state}
                    onChange={handleAddressChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">District</span>
                  </label>
                  <select
                    name="district"
                    value={formData.address.district}
                    onChange={handleAddressChange}
                    className="select select-bordered w-full"
                    disabled={!formData.address.state}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Postal Code</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.address.postal_code}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.address.country}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Social & Bio Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Bio</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full h-32"
                  placeholder="Tell us about yourself..."
                  maxLength="250"
                />
                <label className="label">
                  <span className="label-text-alt">{formData.bio?.length || 0}/250 characters</span>
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Facebook</span>
                    </label>
                    <input
                      type="url"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Twitter</span>
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Instagram</span>
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">YouTube</span>
                    </label>
                    <input
                      type="url"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://youtube.com/channel"
                    />
                  </div>
                </div>
              </div>

              {/* KYC Documents Section */}
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold">KYC Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Aadhaar Card Number</span>
                    </label>
                    <input
                      type="text"
                      name="adhaar_card_number"
                      value={formData.adhaar_card_number || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">PAN Card Number</span>
                    </label>
                    <input
                      type="text"
                      name="pancard_number"
                      value={formData.pancard_number || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation and Submit Buttons */}
          <div className="flex justify-between items-center sticky bottom-0 bg-base-100 pt-4 pb-2 mt-10 -mb-6 -mx-6 px-6 border-t">
            <div className="flex gap-2">
              <button 
                type="button" 
                className={`btn ${activeTab === 'basic' ? 'btn-disabled' : 'btn-ghost'}`}
                onClick={() => setActiveTab(prev => {
                  if (prev === 'address') return 'basic';
                  if (prev === 'social') return 'address';
                  return prev;
                })}
                disabled={activeTab === 'basic'}
              >
                Previous
              </button>
              <button 
                type="button" 
                className={`btn ${activeTab === 'social' ? 'btn-disabled' : 'btn-ghost'}`}
                onClick={() => setActiveTab(prev => {
                  if (prev === 'basic') return 'address';
                  if (prev === 'address') return 'social';
                  return prev;
                })}
                disabled={activeTab === 'social'}
              >
                Next
              </button>
            </div>
            
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};