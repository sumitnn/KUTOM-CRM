import { useState } from "react";
import logo from "../assets/icons/fev.png";
import { MdEmail, MdPhone, MdClose, MdPerson, MdWork, MdArrowDropDown } from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";

const CommonLayout = ({ children }) => {
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

  const adminEmail = "stocktn.com@gmail.com";
  const adminPhone = "+91 9270301020";

  const roles = [
    { value: "", label: "Select a role", disabled: true },
    { value: "vendor", label: "Vendor" },
    { value: "reseller", label: "Reseller" },
    { value: "stockist", label: "Stockist" },
  ];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const submitNewAccountApplication = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.post(import.meta.env.VITE_BACKEND_API_URL+"/apply/", formData);
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
      setSubmitMessage(
        error.response?.data?.message || "An error occurred. Please try again later."
      );
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

  return (
    <>
      {/* Header */}
      <header className="w-full fixed top-0 h-16 bg-white flex items-center justify-between px-6 lg:px-20 border-b border-gray-200 shadow-sm z-50">
        {/* Logo and Slogan */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-xl text-gray-800">StockTN</span>
            <span className="text-xs text-gray-500 font-bold hidden sm:block">
              Simplifying Stock Management, Empowering Businesses
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn btn-sm lg:btn-md bg-emerald-600 hover:bg-emerald-700 text-white px-4"
          >
            Apply
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-sm lg:btn-md bg-indigo-600 hover:bg-indigo-700 text-white px-4"
          >
            Contact Admin
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className="pt-16">{children}</div>

      {/* Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl"
            >
              <MdClose />
            </button>

            {/* Modal Title */}
            <h2 className="text-2xl font-bold text-center text-black mb-6">
              Contact Admin Details
            </h2>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MdEmail className="text-xl text-indigo-500" />
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${adminEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 hover:underline break-all"
                >
                  {adminEmail}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <MdPhone className="text-xl text-indigo-600" />
                <a
                  href={`tel:${adminPhone}`}
                  className="text-indigo-700 hover:underline"
                >
                  {adminPhone}
                </a>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={closeApplyModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-3xl cursor-pointer"
            >
              <MdClose />
            </button>

            {/* Modal Title */}
            <h2 className="text-2xl font-extrabold text-center text-black mb-6">
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
                {/* Role Selection - Now as a dropdown */}
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
                      {roles.map((option) => (
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

                {/* Full Name */}
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-bold text-gray-700"
                  >
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdPerson className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border cursor-pointer ${
                        errors.full_name
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-md shadow-sm`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-gray-700"
                  >
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdEmail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border cursor-pointer ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-md shadow-sm`}
                      placeholder="your@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-bold text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          // Only allow numbers and limit to 10 characters
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({
                            ...formData,
                            phone: value
                          });
                        }}
                        className={`block w-full pl-10 pr-3 py-2 border cursor-pointer ${
                          errors.phone
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-md shadow-sm`}
                        placeholder="9876543210"
                        maxLength={10}  // HTML attribute to limit input length
                      />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

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
          </div>
        </div>
      )}
    </>
  );
};

export default CommonLayout;