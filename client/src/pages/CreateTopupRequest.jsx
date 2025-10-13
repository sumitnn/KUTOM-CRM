import { useState } from "react";
import { useCreateTopupRequestMutation } from "../features/topupApi";
import { useGetAdminPaymentDetailsQuery } from "../features/profile/profileApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ModalPortal from "../components/ModalPortal";

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
    
    if (!amount || !screenshot || !paymentMethod) {
      toast.error("Amount, Screenshot and Payment Method are required");
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-2 px-4 sm:px-6 lg:px-8 cursor-default">
      <div className="max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create Topup Reqeust
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Request wallet topup to admin
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-800 mb-2">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-600 font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Payment Method *
                </label>
                <div className="space-y-2">
                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'upi' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="h-4 w-4 text-blue-600"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-800">UPI</span>
                        {paymentDetails?.upi_id && (
                          <p className="text-xs text-green-600 mt-1">✓ Available</p>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'bank' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="h-4 w-4 text-blue-600"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-800">Bank Transfer</span>
                        {paymentDetails?.account_number && (
                          <p className="text-xs text-green-600 mt-1">✓ Available</p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Details Preview */}
              {paymentMethod && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">Payment Details</h3>
                    {paymentDetails?.passbook_pic && (
                      <button
                        type="button"
                        onClick={() => setShowPassbook(!showPassbook)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        {showPassbook ? 'Hide' : 'Passbook'}
                      </button>
                    )}
                  </div>

                  {paymentMethod === 'upi' && paymentDetails?.upi_id ? (
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">UPI ID:</span> {paymentDetails.upi_id}</p>
                      {paymentDetails.bank_upi && (
                        <p><span className="font-medium">Bank:</span> {paymentDetails.bank_upi}</p>
                      )}
                    </div>
                  ) : paymentMethod === 'bank' && paymentDetails?.account_number ? (
                    <div className="text-xs space-y-1">
                      <p><span className="font-bold">Bank Name:</span> {paymentDetails.bank_name}</p>
                      <p><span className="font-bold">Account Holder Name:</span> {paymentDetails.account_holder_name}</p>
                      <p><span className="font-bold">Account Number:</span> {paymentDetails.account_number}</p>
                      <p><span className="font-bold">IFSC Code:</span> {paymentDetails.ifsc_code}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-red-600">Please add payment details in profile</p>
                  )}
                </div>
              )}

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Payment Proof *
                </label>
                <div className={`border-2 border-dashed rounded-lg transition-all ${
                  previewImage ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'
                }`}>
                  {previewImage ? (
                    <div className="p-3">
                      <div className="relative">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-32 object-contain rounded" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            setScreenshot(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="p-4 text-center">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-1 text-xs text-gray-600">Click to upload screenshot</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
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
                  )}
                </div>
              </div>

              {/* Note */}
              <div>
                <label htmlFor="note" className="block text-sm font-semibold text-gray-800 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Additional information..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium cursor-pointer transition-colors"
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Passbook Modal */}
        {showPassbook && paymentDetails?.passbook_pic && (
          <ModalPortal>
          <div className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-sm w-full p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Passbook</h3>
                <button
                  onClick={() => setShowPassbook(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <img 
                src={paymentDetails.passbook_pic} 
                alt="Passbook" 
                className="w-full rounded border"
              />
            </div>
          </div></ModalPortal>
        )}
      </div>
    </div>
  );
};

export default CreateTopupRequest;