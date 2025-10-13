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
  const [expandedRequest, setExpandedRequest] = useState(null);

  const requests = responseData.results || [];
  const currentBalance = requests.length > 0 ? requests[0].wallet?.payout_balance || 0 : 0;

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    document.getElementById("screenshot_modal").showModal();
  };

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleExpand = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 cursor-default">
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
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold opacity-95">Available Payout Balance</h2>
                </div>
                <p className="text-4xl sm:text-5xl font-bold mb-2">₹{currentBalance}</p>
                <p className="text-blue-100 text-base opacity-90">Ready for withdrawal processing</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-sm opacity-90">Total Requests: {requests.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4 sm:space-y-6">
          {requests.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/60 cursor-default">
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
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-gray-300 cursor-pointer"
                onClick={() => toggleExpand(request.id)}
              >
                {/* Request Header - Always Visible */}
                <div className="p-5 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                        <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-gray-900">₹{request.amount}</span>
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[request.status.toLowerCase()]} inline-flex items-center gap-2 w-fit`}>
                            <span className="text-base">{statusIcons[request.status.toLowerCase()]}</span>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {format(new Date(request.created_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {format(new Date(request.created_at), "h:mm a")}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize border border-gray-200">
                            {request.payment_method}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(request.id);
                        }}
                        className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group/btn cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 text-gray-500 group-hover/btn:text-gray-700 transition-all duration-200 ${
                            expandedRequest === request.id ? 'rotate-180' : ''
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {expandedRequest === request.id && (
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30 border-t border-gray-100 cursor-default">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          Payment Details
                        </h3>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-200/80 shadow-sm">
                          {request.payment_method === 'bank' ? (
                            <div className="space-y-4">
                              {[
                                { label: "Bank Name", value: request.payment_details.bank_name },
                                { label: "Account Number", value: request.payment_details.account_number },
                                { label: "IFSC Code", value: request.payment_details.ifsc_code },
                                { label: "Account Holder", value: request.payment_details.account_holder_name }
                              ].map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-b-0">
                                  <span className="text-sm font-medium text-gray-500">{item.label}</span>
                                  <span className="text-sm font-semibold text-gray-900 text-right">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-500">UPI ID</span>
                                <span className="text-sm font-semibold text-gray-900 text-right">{request.payment_details.upi_id}</span>
                              </div>
                              {request.payment_details.bank_upi && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                                  <span className="text-sm font-medium text-gray-500">Bank UPI</span>
                                  <span className="text-sm font-semibold text-gray-900 text-right">{request.payment_details.bank_upi}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Additional Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          Request Information
                        </h3>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-200/80 shadow-sm space-y-4">
                          {/* Rejection Reason */}
                          {request.status.toLowerCase() === 'rejected' && request.rejected_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-1 bg-red-100 rounded-lg flex-shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h4>
                                  <p className="text-sm text-red-700">{request.rejected_reason}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Screenshot */}
                          {request.status.toLowerCase() === 'approved' && request.screenshot && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Proof</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInNewTab(request.screenshot);
                                }}
                                className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200 text-sm font-medium cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                View Payment Screenshot
                              </button>
                            </div>
                          )}

                          {/* Request ID */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Request ID</span>
                            <span className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                              {request.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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