import React, { useState, useEffect, useCallback } from 'react';
import {
    FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaMapMarkerAlt,
    FaVenusMars, FaWhatsapp, FaFacebook, FaTwitter, FaInstagram,
    FaYoutube, FaIdCard, FaPassport, FaTimes, FaBuilding,
    FaFileAlt, FaAddressCard, FaPercentage, FaExclamationCircle, FaCheckCircle
} from 'react-icons/fa';
import { BsBank2, BsCreditCard, BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import { GiCommercialAirplane } from 'react-icons/gi';
import { MdBusinessCenter, MdEmail, MdLocationCity } from 'react-icons/md';
import { useGetStatesQuery, useGetDistrictsQuery } from '../features/location/locationApi';

const businessTypes = [
    { label: 'Individual', value: 'individual' },
    { label: 'Partnership', value: 'partnership' },
    { label: 'Business', value: 'business' },
    { label: 'Private Limited Company', value: 'pvt_ltd' },
    { label: 'Proprietorship', value: 'proprietorship' },
    { label: 'Public Limited Company', value: 'public_ltd' },
    { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
    { label: 'Other', value: 'other' },
];

const businessCategories = [
    { label: 'Manufacturing', value: 'manufacturing' },
    { label: 'Production', value: 'production' },
    { label: 'Services', value: 'services' },
    { label: 'Wholesale', value: 'wholesale' },
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'E-Commerce', value: 'ecommerce' },
    { label: 'Trading', value: 'trading' },
    { label: 'Other', value: 'other' }
];

const requiredFields = {
    personal: ['full_name', 'phone', 'gender'],
    personalDocs: ['pancard_pic', 'adhaar_card_pic', 'pancard_number', 'adhaar_card_number'],
    address: ['street_address', 'city', 'state', 'district', 'postal_code'],
    business: ['company_name', 'company_email', 'company_phone', 'business_type', 'business_category'],
    businessDocs: ['pan_number', 'gst_number', 'pan_card'],
    payment: ['upi_id']
};

const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
};

const validateAadhaar = (aadhaar) => {
    const aadhaarRegex = /^[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/;
    return aadhaarRegex.test(aadhaar);
};

const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

export const EditProfileModal = ({ profile, onClose, onSave }) => {
    // Initialize form data with proper structure
    const [formData, setFormData] = useState(() => ({
        ...profile,
        profile: profile.profile || {},
        address: profile.address || {
            street_address: '',
            city: '',
            state: '',
            district: '',
            postal_code: '',
            country: 'India',
            is_primary: false
        },
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
            pincode: '',
            is_verified: false
        }
    }));

    const [errors, setErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(profile?.profile?.profile_picture || '');
    const [docPreviews, setDocPreviews] = useState({
        pancard_pic: profile?.profile?.pancard_pic || null,
        adhaar_card_pic: profile?.profile?.adhaar_card_pic || null,
        passbook_pic: profile?.profile?.passbook_pic || null,
        pan_card: profile?.company?.pan_card || null,
        gst_certificate: profile?.company?.gst_certificate || null
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [paymentMethod, setPaymentMethod] = useState(
        formData?.bank_upi ? 'upi' : formData?.account_number ? 'bank' : 'bank'
    );

    const user_role = profile?.role;
    const roleToIdMap = {
        vendor: profile?.vendor_id,
        stockist: profile?.stockist_id,
        reseller: profile?.reseller_id
    };

    const { data: states = [] } = useGetStatesQuery();
    const { data: districts = [] } = useGetDistrictsQuery(formData.address?.state, {
        skip: !formData.address?.state
    });

    const { data: companyStates = [] } = useGetStatesQuery();
    const { data: companyDistricts = [] } = useGetDistrictsQuery(formData.company?.state, {
        skip: !formData.company?.state
    });

    // Initialize previews when profile changes
    useEffect(() => {
        setAvatarPreview(profile?.profile?.profile_picture || '');
        setDocPreviews({
            pancard_pic: profile?.profile?.pancard_pic || null,
            adhaar_card_pic: profile?.profile?.adhaar_card_pic || null,
            passbook_pic: profile?.profile?.passbook_pic || null,
            pan_card: profile?.company?.pan_card || null,
            gst_certificate: profile?.company?.gst_certificate || null
        });
    }, [profile]);

    const validateTab = useCallback((tab) => {
        const newErrors = {};
        const fieldsToCheck = requiredFields[tab] || [];

        fieldsToCheck.forEach(field => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                if (!formData[parent]?.[child]) {
                    newErrors[field] = 'This field is required';
                }
            } else if (!formData[field] && !formData.profile?.[field]) {
                newErrors[field] = 'This field is required';
            }
        });

        // Special validations
        if (tab === 'personalDocs') {
            if (formData.profile?.pancard_number && !validatePAN(formData.profile.pancard_number)) {
                newErrors.pancard_number = 'Invalid PAN format';
            }
            if (formData.profile?.adhaar_card_number && !validateAadhaar(formData.profile.adhaar_card_number)) {
                newErrors.adhaar_card_number = 'Invalid Aadhaar format';
            }
        }

        if (tab === 'business') {
            if (formData.company?.company_phone && !validatePhone(formData.company.company_phone)) {
                newErrors['company.company_phone'] = 'Invalid phone number';
            }
        }

        if (tab === 'payment') {
            if (paymentMethod === 'upi' && !formData?.upi_id) {
                newErrors.upi_id = 'UPI ID is required';
            } else if (paymentMethod === 'bank') {
                if (formData?.account_number && formData.account_number.length < 9) {
                    newErrors.account_number = 'Invalid account number';
                }
                if (formData?.ifsc_code && formData.ifsc_code.length !== 11) {
                    newErrors.ifsc_code = 'IFSC code must be 11 characters';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, paymentMethod]);

    const handleTabChange = useCallback((newTab) => {
        if (validateTab(activeTab)) {
            setActiveTab(newTab);
        }
    }, [activeTab, validateTab]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        if (name === "date_of_birth") {
            if (formData.profile?.date_of_birth) return;

            const selectedDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - selectedDate.getFullYear();
            const m = today.getMonth() - selectedDate.getMonth();
            const d = today.getDate() - selectedDate.getDate();

            const is18OrOlder = age > 18 || (age === 18 && (m > 0 || (m === 0 && d >= 0)));
            if (!is18OrOlder) {
                setErrors(prev => ({ ...prev, date_of_birth: 'User must be at least 18 years old' }));
                return;
            }
        }

        if (name === "whatsapp_number" || name === "phone" || name === "company_phone") {
            const digitsOnly = value.replace(/\D/g, "");
            if (digitsOnly.length > 10) return;

            if (name === "company_phone") {
                setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, [name]: digitsOnly }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, [name]: digitsOnly }
                }));
            }

            if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
            return;
        }

        if (name === "pancard_number") {
            setFormData(prev => ({
                ...prev,
                profile: { ...prev.profile, [name]: value.toUpperCase() }
            }));
            return;
        }

        // Handle nested profile fields
        if (name in (formData.profile || {})) {
            setFormData(prev => ({
                ...prev,
                profile: { ...prev.profile, [name]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }, [formData.profile, errors]);

    const handleAddressChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
        if (errors[`address.${name}`]) setErrors(prev => ({ ...prev, [`address.${name}`]: null }));
    }, [errors]);

    const handleCompanyChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            company: { ...prev.company, [name]: value }
        }));
        if (errors[`company.${name}`]) setErrors(prev => ({ ...prev, [`company.${name}`]: null }));
    }, [errors]);

    const handleFileChange = useCallback((e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, [name]: 'File size exceeds 5MB' }));
            return;
        }
        if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
            setErrors(prev => ({ ...prev, [name]: 'Please upload an image or PDF file' }));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (name === 'profile_picture') {
                setAvatarPreview(event.target.result);
            } else {
                setDocPreviews(prev => ({ ...prev, [name]: event.target.result }));
            }

            if (name in (formData.profile || {})) {
                setFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, [name]: file }
                }));
            } else if (name in (formData.company || {})) {
                setFormData(prev => ({
                    ...prev,
                    company: { ...prev.company, [name]: file }
                }));
            } else {
                setFormData(prev => ({ ...prev, [name]: file }));
            }
        };
        reader.readAsDataURL(file);
    }, [formData.profile, formData.company]);

    const handlePaymentMethodChange = useCallback((method) => {
        setPaymentMethod(method);
        setFormData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                ...(method === 'upi' ? {
                    account_number: '',
                    bank_name: '',
                    ifsc_code: '',
                    account_holder_name: '',
                    passbook_pic: null
                } : {
                    bank_upi: '',
                    upi_id: ''
                })
            }
        }));
    }, []);

    const prepareFormData = useCallback(() => {
        const data = {
            profile: formData.profile || {},
            company: formData.company || {},
            address: formData.address || {}
        };

        // Include other top-level fields
        ['username', 'role', 'email', 'phone', 'upi_id', 'account_number',
            'bank_name', 'ifsc_code', 'account_holder_name', 'facebook',
            'twitter', 'instagram', 'youtube'].forEach(key => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data[key] = formData[key];
                }
            });

        return data;
    }, [formData]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateTab(activeTab)) {
            alert('Please fill all required fields correctly before submitting');
            return;
        }

        setIsSaving(true);
        try {
            const dataToSend = prepareFormData();
            console.log('Data to send:', dataToSend);
            await onSave(dataToSend);
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    }, [activeTab, validateTab, prepareFormData, onSave]);

    const renderError = useCallback((field) => {
        return errors[field] ? (
            <div className="flex items-center mt-1 text-sm text-red-500">
                <FaExclamationCircle className="mr-1" />
                {errors[field]}
            </div>
        ) : null;
    }, [errors]);

    const renderDocumentPreview = useCallback((name) => {
        if (!docPreviews[name]) return null;

        return (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <FaCheckCircle />
                <span>Document uploaded</span>
            </div>
        );
    }, [docPreviews]);

    const completionPercentage = profile?.profile?.completion_percentage || 0;

  
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-7xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="btn btn-md btn-circle absolute right-2 top-2">
                    <FaTimes />
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-4 mr-5 gap-2">
                    <h2 className="text-2xl font-extrabold">Edit Profile</h2>
                    <div className="flex items-center gap-2">
                        <FaPercentage className="text-primary" />
                        <span className="font-bold">Profile Completion: </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${completionPercentage < 30 ? 'bg-red-500' :
                                        completionPercentage < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                        <span className="font-medium">{completionPercentage}%</span>
                    </div>
                </div>

                <div className="tabs tabs-boxed bg-base-300 mb-6 font-extrabold overflow-x-auto">
                    <button
                        className={`tab ${activeTab === 'personal' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <FaUser className="mr-2" /> Personal
                    </button>
                    <button
                        className={`tab ${activeTab === 'personalDocs' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('personalDocs')}
                    >
                        <FaIdCard className="mr-2" /> Personal Docs
                    </button>
                    <button
                        className={`tab ${activeTab === 'address' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('address')}
                    >
                        <FaMapMarkerAlt className="mr-2" /> Address
                    </button>
                    <button
                        className={`tab ${activeTab === 'business' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('business')}
                    >
                        <MdBusinessCenter className="mr-2" /> Business
                    </button>
                    <button
                        className={`tab ${activeTab === 'businessDocs' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('businessDocs')}
                    >
                        <FaFileAlt className="mr-2" /> Business Docs
                    </button>
                    <button
                        className={`tab ${activeTab === 'payment' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('payment')}
                    >
                        <BsBank2 className="mr-2" /> Payment
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Details Tab */}
                    {activeTab === 'personal' && (
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/3 space-y-6">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="avatar">
                                        <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                            <img src={avatarPreview || 'https://i.pravatar.cc/150?img=5'} alt="Profile" />
                                        </div>
                                    </div>
                                    <label className="btn btn-primary btn-sm gap-2">
                                        <input
                                            type="file"
                                            name="profile_picture"
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
                                        name="full_name"
                                        value={formData.profile?.full_name || ''}
                                        onChange={handleChange}
                                        className={`input input-bordered w-full font-bold ${errors.full_name ? 'input-error' : ''}`}
                                        disabled
                                    />
                                    {renderError('full_name')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text flex items-center gap-2 font-bold">
                                            <FaUser />{`${user_role.toUpperCase()} ID`}
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={roleToIdMap[user_role] || ""}
                                        className="input input-bordered w-full font-extrabold"
                                        disabled
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
                                        name="email"
                                        value={formData.email || ''}
                                        className="input input-bordered w-full font-bold"
                                        disabled
                                    />
                                </div>
                            </div>

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
                                            name="phone"
                                            value={formData.profile?.phone || ''}
                                            onChange={handleChange}
                                            className={`input input-bordered w-full font-bold ${errors.phone ? 'input-error' : ''}`}
                                            disabled
                                        />
                                        {renderError('phone')}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text flex items-center gap-2 font-bold">
                                                <FaWhatsapp /> WhatsApp Number
                                            </span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="whatsapp_number"
                                            value={formData.profile?.whatsapp_number || ''}
                                            onChange={handleChange}
                                            maxLength={10}
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
                                            value={formData.profile?.gender || ''}
                                            onChange={handleChange}
                                            className={`select select-bordered w-full font-bold ${errors.gender ? 'select-error' : ''}`}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer-not-to-say">Prefer not to say</option>
                                        </select>
                                        {renderError('gender')}
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text flex items-center gap-2 font-bold">
                                                <FaBirthdayCake /> Date of Birth
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.profile?.date_of_birth || ''}
                                            onChange={handleChange}
                                            className={`input input-bordered w-full font-bold ${errors.date_of_birth ? 'input-error' : ''}`}
                                            disabled={!!formData.profile?.date_of_birth}
                                        />
                                        {renderError('date_of_birth')}
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-bold">Bio</span>
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={formData.profile?.bio || ''}
                                        onChange={handleChange}
                                        className="textarea textarea-bordered w-full h-24 font-bold"
                                        placeholder="Tell us about yourself..."
                                        maxLength={250}
                                    />
                                    <label className="label">
                                        <span className="label-text-alt">{(formData.profile?.bio?.length || 0)}/250 characters</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Documents Tab */}
                    {activeTab === 'personalDocs' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">PAN Card Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pancard_number"
                                        value={formData.profile?.pancard_number || ''}
                                        onChange={handleChange}
                                        className={`input input-bordered w-full ${errors.pancard_number ? 'input-error' : ''}`}
                                        placeholder="AAAAA0000A"
                                        maxLength={10}
                                    />
                                    {renderError('pancard_number')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">Aadhaar Card Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="adhaar_card_number"
                                        value={formData.profile?.adhaar_card_number || ''}
                                        onChange={handleChange}
                                        className={`input input-bordered w-full ${errors.adhaar_card_number ? 'input-error' : ''}`}
                                        placeholder="1234 5678 9012"
                                        maxLength={14}
                                    />
                                    {renderError('adhaar_card_number')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">PAN Card Image</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="pancard_pic"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className={`file-input file-input-bordered w-full ${errors.pancard_pic ? 'file-input-error' : ''}`}
                                    />
                                    {renderError('pancard_pic')}
                                    {renderDocumentPreview('pancard_pic')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">Aadhaar Card Image</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="adhaar_card_pic"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className={`file-input file-input-bordered w-full ${errors.adhaar_card_pic ? 'file-input-error' : ''}`}
                                    />
                                    {renderError('adhaar_card_pic')}
                                    {renderDocumentPreview('adhaar_card_pic')}
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
                                        <span className="label-text flex items-center gap-2 font-extrabold">
                                            <FaMapMarkerAlt /> Street Address
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="street_address"
                                        value={formData.address?.street_address || ''}
                                        onChange={handleAddressChange}
                                        className={`input input-bordered w-full ${errors['address.street_address'] ? 'input-error' : ''}`}
                                    />
                                    {renderError('address.street_address')}
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
                                        className={`input input-bordered w-full ${errors['address.city'] ? 'input-error' : ''}`}
                                    />
                                    {renderError('address.city')}
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
                                        className={`select select-bordered w-full ${errors['address.state'] ? 'select-error' : ''}`}
                                    >
                                        <option value="">Select State</option>
                                        {states.map(state => (
                                            <option key={state.id} value={state.id}>{state.name}</option>
                                        ))}
                                    </select>
                                    {renderError('address.state')}
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
                                        className={`select select-bordered w-full ${errors['address.district'] ? 'select-error' : ''}`}
                                        disabled={!formData.address?.state}
                                    >
                                        <option value="">Select District</option>
                                        {districts.map(district => (
                                            <option key={district.id} value={district.id}>{district.name}</option>
                                        ))}
                                    </select>
                                    {renderError('address.district')}
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
                                        className={`input input-bordered w-full ${errors['address.postal_code'] ? 'input-error' : ''}`}
                                        maxLength={6}
                                    />
                                    {renderError('address.postal_code')}
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
                                        value={formData.address?.country || 'India'}
                                        onChange={handleAddressChange}
                                        className="input input-bordered w-full"
                                        disabled
                                    />
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
                                        name="company_name"
                                        value={formData.company?.company_name || ''}
                                        onChange={handleCompanyChange}
                                        className={`input input-bordered w-full ${errors['company.company_name'] ? 'input-error' : ''}`}
                                    />
                                    {renderError('company.company_name')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text flex items-center gap-2 font-bold">
                                            <MdEmail /> Company Email
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        name="company_email"
                                        value={formData.company?.company_email || ''}
                                        onChange={handleCompanyChange}
                                        className={`input input-bordered w-full ${errors['company.company_email'] ? 'input-error' : ''}`}
                                    />
                                    {renderError('company.company_email')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text flex items-center gap-2 font-bold">
                                            <FaPhone /> Company Phone
                                        </span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="company_phone"
                                        value={formData.company?.company_phone || ''}
                                        onChange={handleCompanyChange}
                                        className={`input input-bordered w-full ${errors['company.company_phone'] ? 'input-error' : ''}`}
                                        maxLength={10}
                                    />
                                    {renderError('company.company_phone')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text flex items-center gap-2 font-bold">
                                            <MdBusinessCenter /> Designation
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="designation"
                                        value={formData.company?.designation || ''}
                                        onChange={handleCompanyChange}
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
                                        onChange={handleCompanyChange}
                                        className={`select select-bordered w-full font-bold ${errors['company.business_type'] ? 'select-error' : ''}`}
                                    >
                                        <option value="">Select Business Type</option>
                                        {businessTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                    {renderError('company.business_type')}
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
                                        onChange={handleCompanyChange}
                                        className={`select select-bordered w-full font-bold ${errors['company.business_category'] ? 'select-error' : ''}`}
                                    >
                                        <option value="">Select Business Category</option>
                                        {businessCategories.map(category => (
                                            <option key={category.value} value={category.value}>{category.label}</option>
                                        ))}
                                    </select>
                                    {renderError('company.business_category')}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-extrabold">Business Description</span>
                                </label>
                                <textarea
                                    name="business_description"
                                    value={formData.company?.business_description || ''}
                                    onChange={handleCompanyChange}
                                    className="textarea textarea-bordered w-full h-24"
                                    placeholder="Describe your business..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Business Documents Tab */}
                    {activeTab === 'businessDocs' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">GST Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={formData.company?.gst_number || ''}
                                        onChange={handleCompanyChange}
                                        className={`input input-bordered w-full ${errors['company.gst_number'] ? 'input-error' : ''}`}
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                    {renderError('company.gst_number')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">PAN Number (Company)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pan_number"
                                        value={formData.company?.pan_number || ''}
                                        onChange={handleCompanyChange}
                                        className={`input input-bordered w-full ${errors['company.pan_number'] ? 'input-error' : ''}`}
                                        placeholder="AAAAA0000A"
                                        maxLength={10}
                                    />
                                    {renderError('company.pan_number')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">GST Certificate</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="gst_certificate"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className={`file-input file-input-bordered w-full ${errors['company.gst_certificate'] ? 'file-input-error' : ''}`}
                                    />
                                    {renderError('company.gst_certificate')}
                                    {renderDocumentPreview('gst_certificate')}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">PAN Card (Company)</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="pan_card"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className={`file-input file-input-bordered w-full ${errors['company.pan_card'] ? 'file-input-error' : ''}`}
                                    />
                                    {renderError('company.pan_card')}
                                    {renderDocumentPreview('pan_card')}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">Business Registration Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="business_registration_number"
                                        value={formData.company?.business_registration_number || ''}
                                        onChange={handleCompanyChange}
                                        className="input input-bordered w-full"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-extrabold">Food License Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="food_license_number"
                                        value={formData.company?.food_license_number || ''}
                                        onChange={handleCompanyChange}
                                        className="input input-bordered w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                <h3 className="flex items-center gap-2 font-extrabold">
                                    <MdLocationCity /> Business Addresses
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="card bg-base-200 p-4">
                                        <h4 className="mb-3 font-extrabold">Registered Address</h4>
                                        <div className="space-y-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-extrabold">Address</span>
                                                </label>
                                                <textarea
                                                    name="registered_address"
                                                    value={formData.company?.registered_address || ''}
                                                    onChange={handleCompanyChange}
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
                                                    onChange={handleCompanyChange}
                                                    className="select select-bordered w-full"
                                                >
                                                    <option value="">Select State</option>
                                                    {companyStates.map(state => (
                                                        <option key={state.id} value={state.id}>{state.name}</option>
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
                                                    onChange={handleCompanyChange}
                                                    className="select select-bordered w-full"
                                                    disabled={!formData.company?.state}
                                                >
                                                    <option value="">Select District</option>
                                                    {companyDistricts.map(district => (
                                                        <option key={district.id} value={district.id}>{district.name}</option>
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
                                                    onChange={handleCompanyChange}
                                                    className="input input-bordered w-full font-bold"
                                                    maxLength={6}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="Enter Your Pincode"
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
                                                    onChange={handleCompanyChange}
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

                    {/* Payment Tab */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
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
                                        name="upi_id"
                                        value={formData?.upi_id || ''}
                                        onChange={handleChange}
                                        className={`input input-bordered w-full ${errors.upi_id ? 'input-error' : ''}`}
                                        placeholder="yourname@upi"
                                    />
                                    {renderError('upi_id')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-extrabold">Account Holder Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="account_holder_name"
                                            value={formData?.account_holder_name || ''}
                                            onChange={handleChange}
                                            className={`input input-bordered w-full ${errors.account_holder_name ? 'input-error' : ''}`}
                                        />
                                        {renderError('account_holder_name')}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-extrabold">Bank Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="bank_name"
                                            value={formData?.bank_name || ''}
                                            onChange={handleChange}
                                            className={`input input-bordered w-full ${errors.bank_name ? 'input-error' : ''}`}
                                        />
                                        {renderError('bank_name')}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-extrabold">Account Number</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="account_number"
                                            value={formData?.account_number || ''}
                                            onChange={handleChange}
                                            className={`input input-bordered w-full ${errors.account_number ? 'input-error' : ''}`}
                                        />
                                        {renderError('account_number')}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-extrabold">IFSC Code</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="ifsc_code"
                                            value={formData?.ifsc_code || ''}
                                            onChange={handleChange}
                                            className={`input input-bordered w-full ${errors.ifsc_code ? 'input-error' : ''}`}
                                        />
                                        {renderError('ifsc_code')}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-extrabold">Passbook Image</span>
                                        </label>
                                        <input
                                            type="file"
                                            name="passbook_pic"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className={`file-input file-input-bordered w-full ${errors.passbook_pic ? 'file-input-error' : ''}`}
                                        />
                                        {renderError('passbook_pic')}
                                        {renderDocumentPreview('passbook_pic')}
                                    </div>
                                </div>
                            )}

                            {/* Social Media Links */}
                            <div className="space-y-4 mt-6">
                                <h3 className="font-extrabold">Social Media Links</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text flex items-center gap-2 font-bold">
                                                <FaFacebook /> Facebook
                                            </span>
                                        </label>
                                        <input
                                            type="url"
                                            name="facebook"
                                            value={formData?.facebook || ''}
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
                                            value={formData?.twitter || ''}
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
                                            value={formData?.instagram || ''}
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
                                            value={formData?.youtube || ''}
                                            onChange={handleChange}
                                            className="input input-bordered w-full"
                                            placeholder="https://youtube.com/channel"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-center sticky bottom-0 bg-base-100 pt-4 pb-2 -mx-6 px-6 border-t gap-2">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`btn ${activeTab === 'personal' ? 'btn-disabled' : 'btn-ghost'}`}
                                onClick={() => {
                                    const prevTab =
                                        activeTab === 'personalDocs' ? 'personal' :
                                            activeTab === 'address' ? 'personalDocs' :
                                                activeTab === 'business' ? 'address' :
                                                    activeTab === 'businessDocs' ? 'business' :
                                                        'businessDocs';
                                    setActiveTab(prevTab);
                                }}
                                disabled={activeTab === 'personal'}
                            >
                                <BsArrowLeft /> Previous
                            </button>
                            <button
                                type="button"
                                className={`btn ${activeTab === 'payment' ? 'btn-disabled' : 'btn-ghost'}`}
                                onClick={() => {
                                    const nextTab =
                                        activeTab === 'personal' ? 'personalDocs' :
                                            activeTab === 'personalDocs' ? 'address' :
                                                activeTab === 'address' ? 'business' :
                                                    activeTab === 'business' ? 'businessDocs' :
                                                        'payment';
                                    setActiveTab(nextTab);
                                }}
                                disabled={activeTab === 'payment'}
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