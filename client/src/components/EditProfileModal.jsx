import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt, 
  FaVenusMars, FaWhatsapp, FaFacebook, FaTwitter, FaInstagram, 
  FaYoutube, FaIdCard, FaPassport, FaTimes, FaBuilding, 
  FaFileAlt, FaAddressCard, FaPercentage
} from 'react-icons/fa';
import { BsBank2, BsCreditCard, BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import { GiCommercialAirplane } from 'react-icons/gi';
import { MdBusinessCenter, MdEmail, MdLocationCity } from 'react-icons/md';
import { useGetStatesQuery, useGetDistrictsQuery } from '../features/location/locationApi';

export const EditProfileModal = ({ profile, onClose, onSave }) => {
  // Correct formData initialization
  const [formData, setFormData] = useState({
    // Spread all top-level profile fields
    ...profile,
    
    // Initialize address (use profile.address if exists)
    address: profile.address || {
      street_address: '',
      city: '',
      state: '',
      district: '',
      postal_code: '',
      country: 'India'
    },
    
    // Initialize company (use profile.company if exists)
    company: profile.company || {
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
  });

  const [avatarPreview, setAvatarPreview] = useState(profile?.profile_picture || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [paymentMethod, setPaymentMethod] = useState(
    formData.bank_upi ? 'upi' : formData.account_number ? 'bank' : null
  );

  const { data: states = [] } = useGetStatesQuery();
  const { data: districts = [] } = useGetDistrictsQuery(formData.address?.state, {
    skip: !formData.address?.state
  });

  const { data: companyStates = [] } = useGetStatesQuery();
  const { data: companyDistricts = [] } = useGetDistrictsQuery(formData.company?.state, {
    skip: !formData.company?.state
  });

  useEffect(() => {
    setAvatarPreview(profile?.profile_picture || '');
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

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      company: {
        ...prev.company,
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

  const handleCompanyFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [name]: file
        }
      }));
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'upi') {
      setFormData(prev => ({
        ...prev,
        account_number: '',
        bank_name: '',
        ifsc_code: '',
        account_holder_name: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bank_upi: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedData = { ...formData };
      
      if (paymentMethod === 'upi') {
        updatedData.account_number = '';
        updatedData.bank_name = '';
        updatedData.ifsc_code = '';
        updatedData.account_holder_name = '';
      } else if (paymentMethod === 'bank') {
        updatedData.bank_upi = '';
      }

      await onSave(updatedData);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Business types and categories
  const businessTypes = [
    'individual',
    'partnership',
    'private_limited',
    'llp',
    'other'
  ];

  const businessCategories = [
    'manufacturing',
    'service',
    'retail',
    'wholesale',
    'restaurant',
    'ecommerce',
    'other'
  ];

 

  const completionPercentage = profile?.completion_percentage || 0;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-7xl max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="btn btn-md btn-circle absolute right-2 top-2"
        >
          <FaTimes />
        </button>
        
        <div className="flex justify-between items-center mb-6 mt-4 mr-5">
          <h2 className="text-2xl font-extrabold">Edit Profile</h2>
          <div className="flex items-center gap-2">
            <FaPercentage className="text-primary" />
            <span className="font-bold">Profile Completion: </span>
            <div className="w-20 bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  completionPercentage < 30 ? 'bg-red-500' :
                  completionPercentage < 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`} 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-300 mb-6 font-extrabold">
          <button 
            className={`tab ${activeTab === 'personal' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <FaUser className="mr-2" /> Personal
          </button>
          <button 
            className={`tab ${activeTab === 'business' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <MdBusinessCenter className="mr-2" /> Business
          </button>
          <button 
            className={`tab ${activeTab === 'documents' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FaFileAlt className="mr-2" /> Documents
          </button>
          <button 
            className={`tab ${activeTab === 'contact' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <FaAddressCard className="mr-2" /> Contact
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details Tab */}
          {activeTab === 'personal' && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column - Avatar and Basic Info */}
              <div className="w-full md:w-1/3 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="avatar">
                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img src={avatarPreview || 'https://i.pravatar.cc/150?img=5'} alt="Profile" />
                    </div>
                  </div>
                  <label className="btn btn-primary btn-sm gap-2">
                    <input 
                      id="file"
                      name="file"
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    Change Photo
                  </label>
                  <div className="text-xs text-gray-500">
                    JPG, PNG (Max 5MB)
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <FaUser /> Full Name
                    </span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <FaUser /> Username
                    </span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <FaEnvelope /> Email
                    </span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ''}
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
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaPhone /> Phone
                      </span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaWhatsapp /> WhatsApp Number
                      </span>
                    </label>
                    <input
                      type="tel"
                      id="whatsapp_number"
                      name="whatsapp_number"
                      value={formData.whatsapp_number || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaVenusMars /> Gender
                      </span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleChange}
                      className="select select-bordered w-full font-bold"
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
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaBirthdayCake /> Date of Birth
                      </span>
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                {/* Bio Section */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Bio</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full h-24 font-bold"
                    placeholder="Tell us about yourself..."
                    maxLength="250"
                  />
                  <label className="label">
                    <span className="label-text-alt">{formData.bio?.length || 0}/250 characters</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <FaBuilding /> Company Name
                    </span>
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company?.company_name || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <MdEmail /> Company Email
                    </span>
                  </label>
                  <input
                    type="email"
                    id="company_email"
                    name="company_email"
                    value={formData.company?.company_email || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <FaPhone /> Company Phone
                    </span>
                  </label>
                  <input
                    type="tel"
                    id="company_phone"
                    name="company_phone"
                    value={formData.company?.company_phone || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <MdBusinessCenter /> Designation
                    </span>
                  </label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.company?.designation || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <GiCommercialAirplane /> Business Type
                    </span>
                  </label>
                  <select
                    name="business_type"
                    value={formData.company?.business_type || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="select select-bordered w-full font-bold"
                  >
                    <option value="">Select Business Type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>
                        {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-bold">
                      <MdBusinessCenter /> Business Category
                    </span>
                  </label>
                  <select
                    name="business_category"
                    value={formData.company?.business_category || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="select select-bordered w-full font-bold"
                  >
                    <option value="">Select Business Category</option>
                    {businessCategories.map(category => (
                      <option key={category} value={category}>
                        {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-extrabold">Business Description</span>
                </label>
                <textarea
                  name="business_description"
                  value={formData.company?.business_description || ''}
                  onChange={(e) => handleCompanyChange(e)}
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="Describe your business..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaIdCard /> GST Number
                    </span>
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.company?.gst_number || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="input input-bordered w-full"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaPassport /> PAN Number
                    </span>
                  </label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.company?.pan_number || ''}
                    onChange={(e) => handleCompanyChange(e)}
                    className="input input-bordered w-full"
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className=" flex items-center gap-2 font-extrabold">
                  <MdLocationCity /> Business Addresses
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card bg-base-200 p-4">
                    <h4 className=" mb-3 font-extrabold">Registered Address</h4>
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-extrabold">Address</span>
                        </label>
                        <textarea
                          name="registered_address"
                          value={formData.company?.registered_address || ''}
                          onChange={(e) => handleCompanyChange(e)}
                          className="textarea textarea-bordered w-full h-20"
                          placeholder="Registered business address..."
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-extrabold">State</span>
                        </label>
                        <select
                          name="state"
                          value={formData.company?.state || ''}
                          onChange={(e) => handleCompanyChange(e)}
                          className="select select-bordered w-full"
                        >
                          <option value="">Select State</option>
                          {companyStates.map(state => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-extrabold">District</span>
                        </label>
                        <select
                          name="district"
                          value={formData.company?.district || ''}
                          onChange={(e) => handleCompanyChange(e)}
                          className="select select-bordered w-full"
                          disabled={!formData.company?.state}
                        >
                          <option value="">Select District</option>
                          {companyDistricts.map(district => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-extrabold">Pincode</span>
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.company?.pincode || ''}
                          onChange={(e) => handleCompanyChange(e)}
                          className="input input-bordered w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200 p-4">
                    <h4 className="font-extrabold mb-3">Operational Address</h4>
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-extrabold">Address</span>
                        </label>
                        <textarea
                          name="operational_address"
                          value={formData.company?.operational_address || ''}
                          onChange={(e) => handleCompanyChange(e)}
                          className="textarea textarea-bordered w-full h-20"
                          placeholder="Operational business address..."
                        />
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GST Certificate */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-extrabold">GST Certificate</span>
                  </label>
                  <input
                    type="file"
                    name="gst_certificate"
                    onChange={(e) => handleCompanyFileChange(e)}
                    className="file-input file-input-bordered w-full"
                  />
                  {formData.company?.gst_certificate && (
                    <div className="mt-2 text-sm text-gray-500">
                      {typeof formData.company.gst_certificate === 'string' ? (
                        <a 
                          href={formData.company.gst_certificate} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          View Current File
                        </a>
                      ) : (
                        <span>Selected: {formData.company.gst_certificate.name}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* PAN Card */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-extrabold">PAN Card</span>
                  </label>
                  <input
                    type="file"
                    name="pan_card"
                    onChange={(e) => handleCompanyFileChange(e)}
                    className="file-input file-input-bordered w-full"
                  />
                  {formData.company?.pan_card && (
                    <div className="mt-2 text-sm text-gray-500">
                      {typeof formData.company.pan_card === 'string' ? (
                        <a 
                          href={formData.company.pan_card} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          View Current File
                        </a>
                      ) : (
                        <span>Selected: {formData.company.pan_card.name}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Business Registration */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-extrabold">Business Registration Document</span>
                  </label>
                  <input
                    type="file"
                    name="business_registration_doc"
                    onChange={(e) => handleCompanyFileChange(e)}
                    className="file-input file-input-bordered w-full"
                  />
                  {formData.company?.business_registration_doc && (
                    <div className="mt-2 text-sm text-gray-500">
                      {typeof formData.company.business_registration_doc === 'string' ? (
                        <a 
                          href={formData.company.business_registration_doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          View Current File
                        </a>
                      ) : (
                        <span>Selected: {formData.company.business_registration_doc.name}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Food License */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-extrabold">Food License Document</span>
                  </label>
                  <input
                    type="file"
                    name="food_license_doc"
                    onChange={(e) => handleCompanyFileChange(e)}
                    className="file-input file-input-bordered w-full"
                  />
                  {formData.company?.food_license_doc && (
                    <div className="mt-2 text-sm text-gray-500">
                      {typeof formData.company.food_license_doc === 'string' ? (
                        <a 
                          href={formData.company.food_license_doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          View Current File
                        </a>
                      ) : (
                        <span>Selected: {formData.company.food_license_doc.name}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KYC Documents */}
              <div className="space-y-4 mt-6">
                <h3 className="font-extrabold flex items-center gap-2">
                  <FaIdCard /> KYC Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-extrabold">Aadhaar Card Number</span>
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
                      <span className="label-text font-extrabold">PAN Card Number</span>
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

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaMapMarkerAlt /> Street Address
                    </span>
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    value={formData.address?.street_address || ''}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaMapMarkerAlt /> City
                    </span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.address?.city || ''}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaMapMarkerAlt /> State
                    </span>
                  </label>
                  <select
                    name="state"
                    value={formData.address?.state || ''}
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
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaMapMarkerAlt /> District
                    </span>
                  </label>
                  <select
                    name="district"
                    value={formData.address?.district || ''}
                    onChange={handleAddressChange}
                    className="select select-bordered w-full"
                    disabled={!formData.address?.state}
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
                    <span className="label-text flex items-center gap-2 font-extrabold">
                      <FaMapMarkerAlt /> Postal Code
                    </span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.address?.postal_code || ''}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                    maxLength={6} 
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaMapMarkerAlt /> Country
                    </span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.address?.country || ''}
                    onChange={handleAddressChange}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4 mt-6">
                <h3 className="font-extrabold">Payment Method</h3>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handlePaymentMethodChange('upi')}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'bank' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handlePaymentMethodChange('bank')}
                  >
                    Bank Transfer
                  </button>
                </div>

                {paymentMethod === 'upi' ? (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-extrabold">UPI ID</span>
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-extrabold">Account Holder Name</span>
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
                        <span className="label-text font-extrabold">Bank Name</span>
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
                        <span className="label-text font-extrabold">Account Number</span>
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
                        <span className="label-text font-extrabold">IFSC Code</span>
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
                )}
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 mt-6">
                <h3 className="font-extrabold ">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaFacebook /> Facebook
                      </span>
                    </label>
                    <input
                      type="url"
                      name="facebook"
                      value={formData.facebook || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaTwitter /> Twitter
                      </span>
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaInstagram /> Instagram
                      </span>
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 font-bold">
                        <FaYoutube /> YouTube
                      </span>
                    </label>
                    <input
                      type="url"
                      name="youtube"
                      value={formData.youtube || ''}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="https://youtube.com/channel"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation and Submit Buttons */}
          <div className="flex justify-between items-center sticky bottom-0 bg-base-100 pt-4 pb-2 -mx-6 px-6 border-t">
            <div className="flex gap-2">
              <button 
                type="button" 
                className={`btn ${activeTab === 'personal' ? 'btn-disabled' : 'btn-ghost'}`}
                onClick={() => setActiveTab(prev => {
                  if (prev === 'business') return 'personal';
                  if (prev === 'documents') return 'business';
                  if (prev === 'contact') return 'documents';
                  return prev;
                })}
                disabled={activeTab === 'personal'}
              >
                <BsArrowLeft /> Previous
              </button>
              <button 
                type="button" 
                className={`btn ${activeTab === 'contact' ? 'btn-disabled' : 'btn-ghost'}`}
                onClick={() => setActiveTab(prev => {
                  if (prev === 'personal') return 'business';
                  if (prev === 'business') return 'documents';
                  if (prev === 'documents') return 'contact';
                  return prev;
                })}
                disabled={activeTab === 'contact'}
              >
                Next <BsArrowRight />
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