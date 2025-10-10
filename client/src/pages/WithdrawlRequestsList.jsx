import { useState } from "react";
import { useGetWithdrawlRequestQuery } from "../features/topupApi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import ModalPortal from "../components/ModalPortal";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
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
  const currentBalance = requests.length > 0 ? requests[0].wallet?.current_balance || 0 : 0;

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg p-6 bg-white rounded-lg shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error?.data?.message || "Please try again later"}
          </p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and manage your withdrawal requests
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={refetch}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
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
              Refresh
            </button>
            <Link
              to={`/${role}/withdrawl-request`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Request
            </Link>
          </div>
        </div>

        {/* Current Balance Card */}
        {requests.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 mb-8 text-white transform hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold opacity-90">Available Balance</h2>
                <p className="text-3xl font-bold mt-2">₹{currentBalance.toLocaleString()}</p>
                <p className="text-blue-100 text-sm mt-1">Ready for withdrawal</p>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-16 w-16 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">
                No withdrawal requests
              </h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                You haven't created any withdrawal requests yet. Start by creating your first request.
              </p>
              <div className="mt-6">
                <Link
                  to={`/${role}/withdrawl-request`}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Create Your First Request
                </Link>
              </div>
            </div>
          ) : (
            requests.map((request, index) => (
              <div key={request.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Request Header - Always Visible */}
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xl font-bold text-gray-900">₹{request.amount}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[request.status.toLowerCase()]}`}>
                            <span className="mr-1">{statusIcons[request.status.toLowerCase()]}</span>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize border border-gray-200">
                        {request.payment_method}
                      </span>
                      <button
                        onClick={() => toggleExpand(request.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
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
                  <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                          Payment Details
                        </h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          {request.payment_method === 'bank' ? (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Bank Name</span>
                                <span className="text-sm font-semibold text-gray-900">{request.payment_details.bank_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Account Number</span>
                                <span className="text-sm font-semibold text-gray-900">{request.payment_details.account_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">IFSC Code</span>
                                <span className="text-sm font-semibold text-gray-900">{request.payment_details.ifsc_code}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Account Holder</span>
                                <span className="text-sm font-semibold text-gray-900">{request.payment_details.account_holder_name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">UPI ID</span>
                                <span className="text-sm font-semibold text-gray-900">{request.payment_details.upi_id}</span>
                              </div>
                              {request.payment_details.bank_upi && (
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-500">Bank UPI</span>
                                  <span className="text-sm font-semibold text-gray-900">{request.payment_details.bank_upi}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Additional Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Request Information
                        </h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                          {/* Rejection Reason */}
                          {request.status.toLowerCase() === 'rejected' && request.rejected_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <h4 className="text-sm font-semibold text-red-800">Rejection Reason</h4>
                                  <p className="text-sm text-red-700 mt-1">{request.rejected_reason}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Screenshot */}
                          {request.status.toLowerCase() === 'approved' && request.screenshot && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Proof</h4>
                              <button
                                onClick={() => openInNewTab(request.screenshot)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                View Payment Screenshot
                              </button>
                            </div>
                          )}

                          {/* Request ID */}
                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Request ID</span>
                            <span className="text-sm font-mono text-gray-900">{request.id}</span>
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
        <dialog id="screenshot_modal" className="modal">
          <div className="modal-box max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Payment Screenshot</h3>
              <form method="dialog">
                <button className="btn btn-circle btn-sm btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </div>
            {modalImage && (
              <div className="overflow-auto max-h-[70vh] flex justify-center">
                <img
                  src={modalImage}
                  alt="Payment Screenshot"
                  className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </ModalPortal>
    </div>
  );
};

export default WithdrawlRequestsList;