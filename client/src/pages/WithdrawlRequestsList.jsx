import { useState } from "react";
import { useGetWithdrawlRequestQuery } from "../features/topupApi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import ModalPortal from "../components/ModalPortal";

const statusColors = {
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

const statusIcons = {
  pending: "⏳",
  approved: "✅",
  rejected: "❌",
};

const WithdrawlRequestsList = ({ role }) => {
  const {
    data: responseData = {},
    isLoading,
    isError,
    error,
    refetch,
  } = useGetWithdrawlRequestQuery();
  const [modalImage, setModalImage] = useState(null);

  const requests = responseData.results || [];
  const currentBalance =
  requests.length > 0
    ? role === "vendor"
      ? requests[0].wallet?.current_balance || 0
      : requests[0].wallet?.payout_balance || 0
    : 0;


 

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cursor-wait">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading withdrawal requests...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 cursor-default">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading requests</h3>
          <p className="text-gray-600 mb-6">
            {error?.data?.message || "Please try again later"}
          </p>
          <button
            onClick={refetch}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium cursor-pointer shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cursor-default py-4">
      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Withdrawal Requests
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Track and manage your withdrawal requests in one place
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={refetch}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh List
            </button>
            
            <Link
              to={`/${role}/withdrawl-request`}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl shadow-sm text-base font-medium text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Withdrawal
            </Link>
          </div>
        </div>

        {/* Current Balance Card */}
        {requests.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 text-white transform hover:scale-[1.01] transition-transform duration-300 cursor-default">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  
                  <h2 className="text-xl font-semibold opacity-95">Available Payout Balance</h2>
                </div>
                <p className="text-4xl sm:text-5xl font-bold mb-2">₹{currentBalance}</p>
                <p className="text-blue-100 text-base opacity-90">Ready for withdrawal processing</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-sm opacity-90 font-extrabold">Total Requests: {requests.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.length === 0 ? (
            <div className="col-span-full text-center py-16 sm:py-20 px-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/60 cursor-default">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No withdrawal requests yet
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
                Start your first withdrawal request to get your earnings transferred to your account.
              </p>
              <Link
                to={`/${role}/withdrawl-request`}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold cursor-pointer"
              >
                Create First Withdrawal Request
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ) : (
            requests.map((request, index) => (
              <div 
                key={request.id} 
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-gray-300 cursor-pointer p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <span className="text-lg font-bold text-blue-600">#{request.id}</span>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[request.status.toLowerCase()]} inline-flex items-center gap-1`}>
                        <span className="text-sm">{statusIcons[request.status.toLowerCase()]}</span>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize border border-gray-200">
                    {request.payment_method}
                  </span>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-900">₹{request.amount}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {request.payment_method === 'bank' ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-medium text-gray-900">{request.payment_details.bank_name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Account:</span>
                          <span className="font-medium text-gray-900">{request.payment_details.account_number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">IFSC:</span>
                          <span className="font-medium text-gray-900">{request.payment_details.ifsc_code}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">UPI ID:</span>
                        <span className="font-medium text-gray-900">{request.payment_details.upi_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Transaction ID:</span>
                    <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200 text-xs">
                      {request.transaction_id || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Status Specific Content */}
                {request.status.toLowerCase() === 'rejected' && request.rejected_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason</p>
                        <p className="text-xs text-red-700">{request.rejected_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {request.status.toLowerCase() === 'approved' && request.screenshot && (
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInNewTab(request.screenshot);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200 text-sm font-medium cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      View Proof
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      <ModalPortal>
        <dialog id="screenshot_modal" className="modal cursor-default">
          <div className="modal-box max-w-4xl w-full mx-4 p-0 overflow-hidden bg-transparent shadow-2xl">
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="font-bold text-xl text-gray-900">Payment Confirmation</h3>
                <form method="dialog">
                  <button className="btn btn-circle btn-sm btn-ghost hover:bg-gray-100 cursor-pointer transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </form>
              </div>
              {modalImage && (
                <div className="overflow-auto max-h-[70vh] flex justify-center p-2">
                  <img
                    src={modalImage}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm cursor-zoom-in"
                    onClick={() => openInNewTab(modalImage)}
                  />
                </div>
              )}
              {/* Transaction ID in Modal */}
              {modalImage && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Transaction ID:</span>
                    <span className="font-mono text-sm text-gray-900 bg-white px-3 py-1 rounded border border-gray-300">
                      {requests.find(r => r.screenshot === modalImage)?.transaction_id || 
                       "N/A"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button className="cursor-default">close</button>
          </form>
        </dialog>
      </ModalPortal>
    </div>
  );
};

export default WithdrawlRequestsList;