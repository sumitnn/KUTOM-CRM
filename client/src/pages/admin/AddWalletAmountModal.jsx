import { useUpdateWalletAmountMutation } from "../../features/walletApi";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ModalPortal from "../../components/ModalPortal";

const AddWalletAmountModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    userEmail: "",
    amount: "",
    transactionType: "CREDIT",
    description: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [updateWallet, { isLoading, error }] = useUpdateWalletAmountMutation();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        userEmail: "",
        amount: "",
        transactionType: "CREDIT",
        description: ""
      });
      setErrors({});
      setTouched({});
    }
  }, [open]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      const apiError = error.data?.message || "Failed to update wallet. Please try again.";
      
      if (error.data?.message === "User not found.") {
        setErrors(prev => ({
          ...prev,
          userEmail: "User with this email address was not found."
        }));
        toast.error("❌ User not found. Please check the email address.");
      } else {
        toast.error(`❌ ${apiError}`);
      }
    }
  }, [error]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "userEmail":
        if (!value.trim()) {
          error = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      
      case "amount":
        if (!value.trim()) {
          error = "Amount is required";
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          error = "Please enter a valid positive amount";
        } else if (parseFloat(value) > 1000000) {
          error = "Amount cannot exceed ₹10,00,000";
        }
        break;
      
      case "description":
        if (value.length > 200) {
          error = "Description cannot exceed 200 characters";
        }
        break;
      
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userEmail.trim()) {
      newErrors.userEmail = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      newErrors.userEmail = "Please enter a valid email address";
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid positive amount";
    }
    
    if (formData.description.length > 200) {
      newErrors.description = "Description cannot exceed 200 characters";
    }

    setErrors(newErrors);
    setTouched({
      userEmail: true,
      amount: true,
      description: true
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("⚠️ Please fix the errors before submitting.");
      return;
    }

    try {
      const payload = {
        userEmail: formData.userEmail.trim(),
        data: {
          amount: parseFloat(formData.amount),
          transaction_type: formData.transactionType,
          transaction_status: "SUCCESS",
          description: formData.description.trim() || 
            `${formData.transactionType === "CREDIT" ? "Added" : "Deducted"} wallet balance`
        },
      };

      await updateWallet(payload).unwrap();

      // Success handling
      const action = formData.transactionType === "CREDIT" ? "added to" : "deducted from";
      toast.success(`✅ ₹${formData.amount} successfully ${action} user's wallet!`);
      
      onClose();
    } catch (err) {
      // Error handling is done in the useEffect above
      console.error("Wallet update error:", err);
    }
  };

  const getInputClass = (field) => {
    const baseClass = "input input-bordered w-full transition-all duration-200";
    if (errors[field] && touched[field]) {
      return `${baseClass} input-error border-2`;
    }
    return baseClass;
  };

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div 
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-primary" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Update Wallet Balance</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {formData.transactionType === "CREDIT" ? "Add funds to" : "Deduct funds from"} user wallet
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* User Email */}
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">
                  User Email <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="email"
                placeholder="Enter user email address..."
                className={getInputClass("userEmail")}
                value={formData.userEmail}
                onChange={(e) => handleInputChange("userEmail", e.target.value)}
                onBlur={() => handleBlur("userEmail")}
                disabled={isLoading}
              />
              {errors.userEmail && touched.userEmail && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.userEmail}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">
                  Amount (₹) <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  placeholder="0.00"
                  className={`${getInputClass("amount")}`}
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  onBlur={() => handleBlur("amount")}
                  disabled={isLoading}
                />
              </div>
              {errors.amount && touched.amount && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.amount}
                </div>
              )}
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Transaction Type</span>
              </label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="transactionType"
                    value="CREDIT"
                    checked={formData.transactionType === "CREDIT"}
                    onChange={(e) => handleInputChange("transactionType", e.target.value)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                    formData.transactionType === "CREDIT" 
                      ? "border-green-500 bg-green-50 text-green-700 font-semibold" 
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Credit
                    </div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="transactionType"
                    value="DEBIT"
                    checked={formData.transactionType === "DEBIT"}
                    onChange={(e) => handleInputChange("transactionType", e.target.value)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                    formData.transactionType === "DEBIT" 
                      ? "border-red-500 bg-red-50 text-red-700 font-semibold" 
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      Debit
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Description (Optional)</span>
                <span className="label-text-alt text-gray-500">
                  {formData.description.length}/200
                </span>
              </label>
              <textarea
                placeholder="Add a note about this transaction..."
                className={`textarea textarea-bordered w-full h-24 resize-none ${errors.description ? 'textarea-error border-2' : ''}`}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                onBlur={() => handleBlur("description")}
                disabled={isLoading}
              />
              {errors.description && touched.description && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.description}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost px-6 hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-8 gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {formData.transactionType === "CREDIT" ? "Add Funds" : "Deduct Funds"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AddWalletAmountModal;