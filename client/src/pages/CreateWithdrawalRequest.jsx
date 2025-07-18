import { useState, useEffect } from "react";
import { useCreateWithdrawlRequestMutation } from "../features/topupApi";
import { useGetPaymentDetailsQuery } from "../features/profile/profileApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateWithdrawalRequest = ({ role }) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { data: paymentDetails } = useGetPaymentDetailsQuery();
  const [createWithdrawal] = useCreateWithdrawlRequestMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!amount || !paymentMethod) {
      toast.error("Amount and Payment Method are required");
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
      const withdrawalData = {
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        note: note,
        payment_details: paymentMethod === 'upi' ? {
          upi_id: paymentDetails.upi_id,
          bank_upi: paymentDetails.bank_upi
        } : {
          account_holder_name: paymentDetails.account_holder_name,
          account_number: paymentDetails.account_number,
          ifsc_code: paymentDetails.ifsc_code,
          bank_name: paymentDetails.bank_name
        }
      };

      await createWithdrawal(withdrawalData).unwrap();
      toast.success("Withdrawal request submitted successfully");
      navigate(`/${role}/my-withdrawl`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create Withdrawal Request</h1>
            <p className="mt-2 text-sm text-gray-600">
              Request to withdraw money from your wallet
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Amount */}
              <div className="sm:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    min="1"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method To Receive Money <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* UPI Payment Option */}
                  <div>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:border-blue-400 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        required
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">UPI Payment</span>
                        <span className="block text-xs mt-1">
                          {paymentDetails?.upi_id ? (
                            <span className="text-gray-500">Your UPI ID: {paymentDetails.upi_id}</span>
                          ) : (
                            <span className="text-red-500">No UPI ID found. Please add in profile settings.</span>
                          )}
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Bank Transfer Option */}
                  <div>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:border-blue-400 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">Bank Transfer</span>
                        <span className="block text-xs mt-1">
                          {paymentDetails?.account_number ? (
                            <span className="text-gray-500">Account ending with: ••••{paymentDetails.account_number.slice(-4)}</span>
                          ) : (
                            <span className="text-red-500">No bank details found. Please add in profile settings.</span>
                          )}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Details Preview */}
              {paymentMethod && (
                <div className="sm:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Details To Receive Money</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {paymentMethod === 'upi' ? (
                      paymentDetails?.upi_id ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">UPI ID:</span> {paymentDetails.upi_id}
                          </p>
                        
                          <p className="text-sm text-gray-700">
                            Money will be transferred to this UPI ID upon approval.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">
                          No UPI ID found. Please add your UPI ID in profile settings.
                        </p>
                      )
                    ) : paymentMethod === 'bank' ? (
                      paymentDetails?.account_number ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Account Holder:</span> {paymentDetails.account_holder_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Account Number:</span> ••••••••••{paymentDetails.account_number.slice(-4)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Bank Name:</span> {paymentDetails.bank_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">IFSC Code:</span> {paymentDetails.ifsc_code}
                          </p>
                          <p className="text-sm text-gray-700">
                            Money will be transferred to this bank account upon approval.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">
                          No bank details found. Please add your bank details in profile settings.
                        </p>
                      )
                    ) : null}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="sm:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Any additional information about your withdrawal request..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !amount || 
                  !paymentMethod ||
                  (paymentMethod === 'upi' && !paymentDetails?.upi_id) || 
                  (paymentMethod === 'bank' && !paymentDetails?.account_number)
                }
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWithdrawalRequest;