import { useState } from "react";
import { toast } from "react-toastify";
import { useUpdatePasswordMutation } from "../../features/auth/authApi";
import { Link } from "react-router-dom";

const ChangePassword = ({ role }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

  const toggleVisibility = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Calculate password strength when new password changes
    if (name === "newPassword") {
      let strength = 0;
      if (value.length > 0) strength += 1;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await updatePassword({
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }).unwrap();

      toast.success("Password updated successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStrength(0);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to change password");
    }
  };

  const getStrengthColor = (strength) => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthTextColor = (strength) => {
    if (strength <= 1) return "text-red-500";
    if (strength <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-base-100 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Change Password</h2>
          <p className="text-white/90 mt-1">Secure your account with a new password</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Current Password</span>
            </label>
            <div className="relative">
              <input
                type={show.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="input input-bordered w-full pr-12 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility("current")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm p-1 hover:bg-base-200 rounded-full"
                aria-label={show.current ? "Hide password" : "Show password"}
              >
                {show.current ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">New Password</span>
            </label>
            <div className="relative">
              <input
                type={show.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="input input-bordered w-full pr-12 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility("new")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm p-1 hover:bg-base-200 rounded-full"
                aria-label={show.new ? "Hide password" : "Show password"}
              >
                {show.new ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Strength Meter */}
            {formData.newPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Password strength:</span>
                  <span className={`text-xs font-bold ${getStrengthTextColor(passwordStrength)}`}>
                    {passwordStrength <= 1 && "Very weak"}
                    {passwordStrength === 2 && "Weak"}
                    {passwordStrength === 3 && "Moderate"}
                    {passwordStrength === 4 && "Strong"}
                    {passwordStrength >= 5 && "Very strong"}
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? getStrengthColor(passwordStrength) : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Password Requirements */}
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 mb-2">Password requirements:</p>
              <ul className="space-y-1">
                <li className={`flex items-center text-xs ${formData.newPassword.length >= 8 ? "text-green-500" : "text-gray-500"}`}>
                  <svg className={`w-4 h-4 mr-1 ${formData.newPassword.length >= 8 ? "text-green-500" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {formData.newPassword.length >= 8 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  At least 8 characters
                </li>
                <li className={`flex items-center text-xs ${/[A-Z]/.test(formData.newPassword) ? "text-green-500" : "text-gray-500"}`}>
                  <svg className={`w-4 h-4 mr-1 ${/[A-Z]/.test(formData.newPassword) ? "text-green-500" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {/[A-Z]/.test(formData.newPassword) ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  At least one uppercase letter
                </li>
                <li className={`flex items-center text-xs ${/[0-9]/.test(formData.newPassword) ? "text-green-500" : "text-gray-500"}`}>
                  <svg className={`w-4 h-4 mr-1 ${/[0-9]/.test(formData.newPassword) ? "text-green-500" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {/[0-9]/.test(formData.newPassword) ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  At least one number
                </li>
                <li className={`flex items-center text-xs ${/[^A-Za-z0-9]/.test(formData.newPassword) ? "text-green-500" : "text-gray-500"}`}>
                  <svg className={`w-4 h-4 mr-1 ${/[^A-Za-z0-9]/.test(formData.newPassword) ? "text-green-500" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {/[^A-Za-z0-9]/.test(formData.newPassword) ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  At least one special character
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Confirm New Password</span>
            </label>
            <div className="relative">
              <input
                type={show.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="input input-bordered w-full pr-12 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility("confirm")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm p-1 hover:bg-base-200 rounded-full"
                aria-label={show.confirm ? "Hide password" : "Show password"}
              >
                {show.confirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.newPassword && formData.confirmPassword && (
              <div className={`flex items-center mt-2 text-sm ${formData.newPassword === formData.confirmPassword ? "text-green-500" : "text-red-500"}`}>
                <svg className={`w-4 h-4 mr-1 ${formData.newPassword === formData.confirmPassword ? "text-green-500" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {formData.newPassword === formData.confirmPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                {formData.newPassword === formData.confirmPassword 
                  ? "Passwords match" 
                  : "Passwords do not match"}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Link 
              to={`/${role}/dashboard`} 
              className="btn btn-outline btn-secondary flex-1 shadow-md hover:shadow-lg transition-all"
            >
              Back to Dashboard
            </Link>
            <button 
              className="btn btn-primary flex-1 shadow-md hover:shadow-lg transition-all" 
              type="submit" 
              disabled={isLoading || formData.newPassword !== formData.confirmPassword}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;