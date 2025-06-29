import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { useGetStatesQuery, useGetDistrictsQuery } from '../../features/location/locationApi';

const EditSectionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  fields, 
  initialData, 
  onSave,
  isLoading: isSaving
}) => {
  const [formData, setFormData] = useState(initialData || {});
  const [files, setFiles] = useState({});
  const [selectedState, setSelectedState] = useState(initialData?.state || '');
  const [errors, setErrors] = useState({});

  // Fetch states
  const { data: states = [] } = useGetStatesQuery();
  
  // Fetch districts based on selected state
  const { data: districts = [] } = useGetDistrictsQuery(selectedState, {
    skip: !selectedState,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedState(initialData.state || '');
      setFiles({});
      setErrors({});
    }
  }, [initialData]);

  const validatePhone = (value) => {
    if (!value) return 'This field is required';
    if (!/^\d{10}$/.test(value)) return 'Must be a 10-digit number';
    return '';
  };

  const validateAadhaar = (value) => {
    if (value && !/^\d{12}$/.test(value)) return 'Must be a 12-digit number';
    return '';
  };

  const validatePAN = (value) => {
    if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
      return 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    return '';
  };

  const validateGST = (value) => {
    if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
      return 'Invalid GST format (e.g., 22ABCDE1234F1Z5)';
    }
    return '';
  };

  const validatePostalCode = (value) => {
    if (value && !/^\d{6}$/.test(value)) return 'Must be a 6-digit number';
    return '';
  };

  const validateField = (name, value) => {
    const fieldConfig = fields.find(f => f.name === name);
    if (!fieldConfig || fieldConfig.disabled) return '';
    
    if (fieldConfig.type === 'file') {
      if (fieldConfig.required) {
        const hasExistingFile = typeof formData[name] === 'string' && formData[name].length > 0;
        const hasNewFile = files[name] instanceof File;
        
        if (!hasExistingFile && !hasNewFile) {
          return 'This field is required';
        }
      }
      return '';
    }
    
    switch (name) {
      case 'phone':
      case 'whatsapp_number':
      case 'company_phone':
        return validatePhone(value);
      case 'adhaar_card_number':
        return validateAadhaar(value);
      case 'pancard_number':
      case 'pan_number':
        return validatePAN(value);
      case 'gst_number':
        return validateGST(value);
      case 'postal_code':
      case 'pincode':
        return validatePostalCode(value);
      case 'date_of_birth':
        if (value) {
          const selectedDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - selectedDate.getFullYear();
          const monthDiff = today.getMonth() - selectedDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
            age--;
          }
          
          if (age < 18) {
            return 'You must be at least 18 years old';
          }
        } else if (fieldConfig.required) {
          return 'This field is required';
        }
        return '';
      default:
        if (fieldConfig.required && !value) {
          return 'This field is required';
        }
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    if (name === 'state') {
      setSelectedState(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        district: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    
    if (!file) return;
    
    const fieldConfig = fields.find(f => f.name === name);
    if (fieldConfig?.accept) {
      const acceptedTypes = fieldConfig.accept.split(',');
      const fileType = file.type;
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      const isValid = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.substring(1);
        } else {
          return fileType.match(type.replace('*', '.*'));
        }
      });
      
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          [name]: `Invalid file type. Accepted: ${fieldConfig.accept}`
        }));
        return;
      }
    }
    
    setFiles(prev => ({
      ...prev,
      [name]: file
    }));
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    let isValid = true;
    
    fields.forEach(field => {
      if (field.disabled) return;
      
      const value = formData[field.name];
      const error = validateField(field.name, value);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    
    if (!isValid) {
      return;
    }
    
    const dataToSave = {
      ...formData,
      ...Object.fromEntries(
        Object.entries(files).map(([key, file]) => [key, file]))
    };
    onSave(dataToSave);
  };

  const getAutocompleteValue = (fieldName) => {
    const mapping = {
      'name': 'name',
      'email': 'email',
      'phone': 'tel',
      'whatsapp_number': 'tel',
      'company_phone': 'tel',
      'address': 'street-address',
      'city': 'address-level2',
      'state': 'address-level1',
      'district': 'address-level2',
      'postal_code': 'postal-code',
      'pincode': 'postal-code',
      'date_of_birth': 'bday',
      'adhaar_card_number': 'off',
      'pancard_number': 'off',
      'pan_number': 'off',
      'gst_number': 'off'
    };
    
    return mapping[fieldName] || 'on';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            disabled={isSaving}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {fields.map((field) => {
            const fieldId = `field-${field.name}`;
            
            if (field.name === 'state') {
              return (
                <div key={field.name} className="form-control">
                  <label htmlFor={fieldId} className="label cursor-pointer">
                    <span className="label-text flex items-center gap-2 font-bold">
                      {field.icon} {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </span>
                  </label>
                  <select
                    id={fieldId}
                    name={field.name}
                    value={selectedState}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors[field.name] ? 'border-red-500' : ''} ${field.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                    required={field.required}
                    disabled={field.disabled || isSaving}
                    autoComplete={getAutocompleteValue(field.name)}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {errors[field.name] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                  )}
                </div>
              );
            }

            if (field.name === 'district') {
              return (
                <div key={field.name} className="form-control">
                  <label htmlFor={fieldId} className="label cursor-pointer">
                    <span className="label-text flex items-center gap-2 font-bold">
                      {field.icon} {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </span>
                  </label>
                  <select
                    id={fieldId}
                    name={field.name}
                    value={formData.district || ''}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${errors[field.name] ? 'border-red-500' : ''} ${field.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                    required={field.required}
                    disabled={!selectedState || field.disabled || isSaving}
                    autoComplete={getAutocompleteValue(field.name)}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {errors[field.name] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={field.name} className="form-control">
                <label htmlFor={fieldId} className="label cursor-pointer">
                  <span className="label-text flex items-center gap-2 font-bold">
                    {field.icon} {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </span>
                </label>
                
                {field.type === 'textarea' ? (
                  <>
                    <textarea
                      id={fieldId}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      className={`textarea textarea-bordered w-full font-bold ${errors[field.name] ? 'border-red-500' : ''} ${field.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                      rows={3}
                      disabled={field.disabled || isSaving}
                      autoComplete={getAutocompleteValue(field.name)}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                    )}
                  </>
                ) : field.type === 'select' ? (
                  <>
                    <select
                      id={fieldId}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      className={`select select-bordered w-full font-bold ${errors[field.name] ? 'border-red-500' : ''} ${field.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                      disabled={field.disabled || isSaving}
                      autoComplete={getAutocompleteValue(field.name)}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>
                          {option.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </option>
                      ))}
                    </select>
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                    )}
                  </>
                ) : field.type === 'file' ? (
                  <>
                    <input
                      type="file"
                      id={fieldId}
                      name={field.name}
                      onChange={handleFileChange}
                      className={`file-input file-input-bordered w-full font-bold ${errors[field.name] ? 'border-red-500' : ''} ${field.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                      accept={field.accept}
                      disabled={field.disabled || isSaving}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                    )}
                    {formData[field.name] && typeof formData[field.name] === 'string' && (
                      <div>
                        <p className="text-sm text-gray-500 mt-1 font-extrabold">
                          Current file: {formData[field.name].split('/').pop()}
                        </p>
                        <img
                          src={formData[field.name]}
                          className="size-20 cursor-pointer"
                          alt={formData[field.name].split('/').pop()}
                          onClick={() => window.open(formData[field.name], '_blank')}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      id={fieldId}
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      className={`input input-bordered w-full font-bold ${errors[field.name] ? 'border-red-500' : ''} ${field.disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                      disabled={(field.name === 'date_of_birth' && formData['date_of_birth']) || field.disabled || isSaving}
                      pattern={field.pattern}
                      title={field.title}
                      autoComplete={getAutocompleteValue(field.name)}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
          
          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white pb-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-ghost"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSaving || Object.values(errors).some(Boolean)}
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSectionModal;