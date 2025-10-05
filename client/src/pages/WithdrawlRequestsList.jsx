import { useState } from "react";
import { useGetWithdrawlRequestQuery } from "../features/topupApi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
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
  const currentBalance = requests.length > 0 ? requests[0].wallet?.current_balance || 0 : 0;

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    document.getElementById("screenshot_modal").showModal();
  };

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
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
        <div className="text-center max-w-lg p-6 bg-white rounded-lg shadow">
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              View all your withdrawal requests and their status
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refetch}
              className="inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
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
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Wallet Balance</h2>
                <p className="text-3xl font-bold mt-2">₹{currentBalance}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {requests.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No withdrawal requests found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't created any withdrawal requests yet.
              </p>
              <div className="mt-6">
                <Link
                  to={`/${role}/withdrawl-request`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Your First Request
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                      Method
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                      Created Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                     Other Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request, index) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{request.amount}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {request.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 inline-flex text-md leading-5 font-semibold rounded-full ${
                              statusColors[request.status.toLowerCase()] ||
                              "bg-gray-100 text-gray-800"
                            } capitalize`}
                          >
                            {request.status}
                          </span>
                          {request.status.toLowerCase() === 'rejected' && request.rejected_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              Reason: {request.rejected_reason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="space-y-2">
                          {request.payment_method === 'bank' ? (
                            <>
                              <div><strong className="text-gray-700">Bank:</strong> {request.payment_details.bank_name}</div>
                              <div><strong className="text-gray-700">Account:</strong> {request.payment_details.account_number}</div>
                              <div><strong className="text-gray-700">IFSC:</strong> {request.payment_details.ifsc_code}</div>
                              <div><strong className="text-gray-700">Name:</strong> {request.payment_details.account_holder_name}</div>
                            </>
                          ) : (
                            <>
                              <div><strong className="text-gray-700">UPI ID:</strong> {request.payment_details.upi_id}</div>
                              {request.payment_details.bank_upi && (
                                <div><strong className="text-gray-700">Bank UPI:</strong> {request.payment_details.bank_upi}</div>
                              )}
                            </>
                          )}
                          {request.status.toLowerCase() === 'approved' && request.screenshot && (
                            <button
                              onClick={() => openInNewTab(request.screenshot)}
                              className="mt-2 btn font-bold cursor-pointer text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              View File
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      <dialog id="screenshot_modal" className="modal">
        <div className="modal-box max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Payment Screenshot</h3>
            <form method="dialog">
              <button className="btn btn-circle btn-sm">
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
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default WithdrawlRequestsList;