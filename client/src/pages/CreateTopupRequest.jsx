import { useState } from "react";
import { useCreateTopupRequestMutation } from "../features/topupApi";
import { useGetAdminPaymentDetailsQuery } from "../features/profile/profileApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateTopupRequest = ({role}) => {
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showPassbook, setShowPassbook] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { data: paymentDetails } = useGetAdminPaymentDetailsQuery();
  const [createTopup] = useCreateTopupRequestMutation();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!amount || !screenshot || !paymentMethod) {
      toast.error("Amount, Screenshot and Payment Method are required");
      return;
    }

    // Validate payment details based on method
    if (paymentMethod === 'upi' && !paymentDetails?.upi_id) {
      toast.error("Please add your UPI ID in profile settings first");
      return;
    }

    if (paymentMethod === 'bank' && !paymentDetails?.account_number) {
      toast.error("Please add your bank details in profile settings first");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount.toString());
      formData.append("screenshot", screenshot);
      formData.append("note", note);
      formData.append("payment_method", paymentMethod);
      
      // Include the relevant payment details in the request
      const paymentData = {
        method: paymentMethod,
        details: paymentMethod === 'upi' ? {
          upi_id: paymentDetails.upi_id,
          bank_upi: paymentDetails.bank_upi
        } : {
          account_holder_name: paymentDetails.account_holder_name,
          account_number: paymentDetails.account_number,
          ifsc_code: paymentDetails.ifsc_code,
          bank_name: paymentDetails.bank_name
        }
      };
      
      formData.append("payment_details", JSON.stringify(paymentData));

      await createTopup(formData).unwrap();
      toast.success("Topup request submitted successfully");
      navigate(`/${role}/my-topup-request`);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold  bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create Topup Request
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-md mx-auto">
            Fill in the details below to request a wallet topup
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <label htmlFor="amount" className="block text-lg font-semibold text-gray-800 mb-3">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-600 text-xl font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    min="1"
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                    placeholder="Enter amount ..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <label className="block text-lg font-semibold text-gray-800 mb-4">
                  Select Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* UPI Payment Option */}
                  <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'upi' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 mt-1"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        required
                      />
                      <div className="ml-3 flex-1">
                        <span className="block text-base font-semibold text-gray-800">UPI Payment</span>
                        <div className="mt-2">
                          {paymentDetails?.upi_id ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800 font-medium">
                                UPI ID: {paymentDetails.upi_id}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-800">
                                No UPI ID found. Please add in profile settings.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Bank Transfer Option */}
                  <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'bank' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 mt-1"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                      />
                      <div className="ml-3 flex-1">
                        <span className="block text-base font-semibold text-gray-800">Bank Transfer</span>
                        <div className="mt-2">
                          {paymentDetails?.account_number ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800 font-medium">
                                Account: ••••{paymentDetails.account_number.slice(-4)}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-800">
                                No bank details found. Please add in profile settings.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Details Preview */}
              {paymentMethod && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Payment Details</h3>
                    {paymentDetails?.passbook_pic && (
                      <button
                        type="button"
                        onClick={() => setShowPassbook(!showPassbook)}
                        className="px-4 py-2 cursor-pointer bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                      >
                        {showPassbook ? 'Hide Passbook' : 'Show Passbook'}
                      </button>
                    )}
                  </div>

                  {/* Passbook Image Modal */}
                  {showPassbook && paymentDetails?.passbook_pic && (
                    <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">Passbook Image</h4>
                        <button
                          onClick={() => setShowPassbook(false)}
                          className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <img 
                        src={paymentDetails.passbook_pic} 
                        alt="Passbook" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    {paymentMethod === 'upi' ? (
                      paymentDetails?.upi_id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-blue-800">UPI ID</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{paymentDetails.upi_id}</p>
                            </div>
                            {paymentDetails.bank_upi && (
                              <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-green-800">Bank UPI</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{paymentDetails.bank_upi}</p>
                              </div>
                            )}
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 font-medium">
                              ✅ The payment has been successfully made via the above UPI ID.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 font-medium">
                            No UPI ID found. Please add your UPI ID in profile settings.
                          </p>
                        </div>
                      )
                    ) : paymentMethod === 'bank' ? (
                      paymentDetails?.account_number ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-blue-800">Account Holder Name</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{paymentDetails.account_holder_name}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-green-800">Account Number</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{paymentDetails.account_number}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-purple-800">Bank Name</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{paymentDetails.bank_name}</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-orange-800">IFSC Code</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{paymentDetails.ifsc_code}</p>
                            </div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 font-medium">
                              ✅ The payment has been successfully made via the above Bank Details.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 font-medium">
                            No bank details found. Please add your bank details in profile settings.
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              )}

              {/* Screenshot Upload */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <label className="block text-lg font-semibold text-gray-800 mb-4">
                  Payment Screenshot <span className="text-red-500">*</span>
                </label>
                <div className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
                  previewImage 
                    ? 'border-green-300 bg-green-25' 
                    : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                }`}>
                  <div className="space-y-4 text-center">
                    {previewImage ? (
                      <div className="relative">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="mx-auto h-48 w-auto object-contain rounded-lg shadow-md" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            setScreenshot(null);
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors duration-200 shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex text-lg text-gray-600 justify-center">
                          <label
                            htmlFor="screenshot"
                            className="relative cursor-pointer bg-white rounded-xl font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none px-6 py-3 border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
                          >
                            <span>Choose Screenshot</span>
                            <input
                              id="screenshot"
                              name="screenshot"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                              required
                            />
                          </label>
                        </div>
                        <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <label htmlFor="note" className="block text-lg font-semibold text-gray-800 mb-4">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 resize-none"
                  placeholder="Enter any additional information about your transaction..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 border-2 cursor-pointer border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !amount || 
                    !screenshot || 
                    !paymentMethod ||
                    (paymentMethod === 'upi' && !paymentDetails?.upi_id) || 
                    (paymentMethod === 'bank' && !paymentDetails?.account_number)
                  }
                  className="px-8 py-4 border border-transparent cursor-pointer text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Request...
                    </div>
                  ) : (
                    "Submit Topup Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTopupRequest;