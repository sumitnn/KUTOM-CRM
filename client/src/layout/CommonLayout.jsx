import { useState } from "react";
import logo from "../assets/icons/fev.png";
import { 
  MdEmail, 
  MdPhone, 
  MdClose, 
  MdPerson, 
  MdWork, 
  MdArrowDropDown 
} from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";

const CommonLayout = ({ children }) => {
  // State management
  const [showModal, setShowModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    full_name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // Constants
  const ADMIN_DETAILS = {
    email: "stocktn.com@gmail.com",
    phone: "+91 9270301020"
  };

  const ROLES = [
    { value: "", label: "Select a role", disabled: true },
    { value: "vendor", label: "Vendor" },
    { value: "reseller", label: "Reseller" },
    { value: "stockist", label: "Stockist" },
  ];

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.role) newErrors.role = "Please select a role";
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  const submitNewAccountApplication = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}/apply/`, 
        formData
      );
      
      if (response.status === 201) {
        setSubmitMessage(
          "Thank you for joining our team! Our executive will call you within 24 hours. For more details, call +91 9270301020."
        );
        setFormData({
          role: "",
          full_name: "",
          email: "",
          phone: "",
        });
      }
    } catch (error) {
      const message = error?.response?.data?.message || 
                     error?.response?.data?.errors?.[0] || 
                     "An error occurred. Please try again later.";
      setSubmitMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      submitNewAccountApplication();
    }
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setSubmitMessage("");
    setErrors({});
  };

  // Reusable components
  const ModalWrapper = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-3xl cursor-pointer"
          aria-label="Close modal"
        >
          <MdClose />
        </button>
        {children}
      </div>
    </div>
  );

  const InputField = ({ 
    id, 
    name, 
    value, 
    onChange, 
    placeholder, 
    error, 
    icon: Icon, 
    type = "text",
    ...props 
  }) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-700"
      >
        {placeholder}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 font-bold" />
          </div>
        )}
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border ${
            error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          } rounded-md shadow-sm`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="w-full fixed top-0 h-16 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-20 border-b border-gray-200 shadow-sm z-50">
        {/* Logo and Slogan */}
        <div className="flex items-center gap-2 sm:gap-4">
          <img 
            src={logo} 
            alt="Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10" 
          />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-lg sm:text-xl text-gray-800">StockTN</span>
            <span className="text-xs text-gray-500 font-bold hidden sm:block">
              Simplifying Stock Management, Empowering Businesses
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-sm lg:btn-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4"
          >
            Contact Admin
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn btn-sm lg:btn-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4"
          >
            Apply
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className="pt-16">{children}</div>

      {/* Contact Modal */}
      {showModal && (
        <ModalWrapper onClose={() => setShowModal(false)}>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Contact Admin Details
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MdEmail className="text-xl text-indigo-500" />
              <a
                href={`mailto:${ADMIN_DETAILS.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 hover:underline break-all"
              >
                {ADMIN_DETAILS.email}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <MdPhone className="text-xl text-indigo-600" />
              <a
                href={`tel:${ADMIN_DETAILS.phone.replace(/\D/g, '')}`}
                className="text-indigo-700 hover:underline"
              >
                {ADMIN_DETAILS.phone}
              </a>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-6"
            >
              Close
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <ModalWrapper onClose={closeApplyModal}>
          <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-6">
            Join Our Team
          </h2>

          {submitMessage ? (
            <div className="text-center py-4">
              <p className="text-green-600 mb-4">{submitMessage}</p>
              <button
                onClick={closeApplyModal}
                className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white px-6"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-md font-bold text-gray-800 mb-2">
                  Select Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`block w-full pl-3 pr-10 py-2 border ${
                      errors.role
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-md shadow-sm appearance-none cursor-pointer`}
                  >
                    {ROLES.map((option) => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <MdArrowDropDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              {/* Form Fields */}
              <InputField
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                error={errors.full_name}
                  icon={MdPerson}
                 
              />

              <InputField
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                error={errors.email}
                icon={MdEmail}
              />

              <InputField
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="Phone Number"
                error={errors.phone}
                icon={MdPhone}
                maxLength={10}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center btn btn-md bg-indigo-600 hover:bg-indigo-700 text-white px-6 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          )}
        </ModalWrapper>
      )}
    </>
  );
};

export default CommonLayout;