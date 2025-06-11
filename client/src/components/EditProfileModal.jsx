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
      country: '',
      is_primary: true
    }
  });

  const [avatarPreview, setAvatarPreview] = useState(profile.profile_picture);
  const [isSaving, setIsSaving] = useState(false);

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
      if (file.size > 5 * 1024 * 1024) {  // 5MB max size
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
        setFormData(prev => ({ ...prev, profile_picture: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
      setIsSaving(false);
      onClose();
    } catch (error) {
      setIsSaving(false);
      alert('Error saving profile');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-base-100 rounded-box shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 btn btn-ghost btn-sm btn-circle"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Avatar and Basic Info */}
            <div className="w-full md:w-1/3 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="avatar">
                  <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={avatarPreview || 'https://i.pravatar.cc/150?img=5'} alt="Profile" />
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input file-input-bordered file-input-primary w-full"
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
                  <option value="">Select</option>
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

            {/* Right Column - Detailed Info */}
            <div className="w-full md:w-2/3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <h3 className="font-semibold">Social Media</h3>
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
            </div>
          </div>
          
          <div className="modal-action sticky bottom-0 bg-base-100 pt-4 pb-2 -mb-6 -mx-6 px-6">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};