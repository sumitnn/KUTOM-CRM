import { useState } from "react";
import { useGetMyTopupRequestQuery } from "../features/topupApi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  INVALID_SCREENSHOT: "bg-red-100 text-red-800",
  INVALID_AMOUNT: "bg-red-100 text-red-800",
};

const statusIcons = {
  PENDING: (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  APPROVED: (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  REJECTED: (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const TopupRequestsList = ({ role }) => {
  const {
    data: responseData = {},
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyTopupRequestQuery();
  const [modalImage, setModalImage] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);

  const requests = responseData.results || [];

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    document.getElementById("screenshot_modal").showModal();
  };

  const toggleExpandRequest = (requestId) => {
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Topup Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              View all your wallet topup requests and their status
            </p>
          </div>
          <Link
            to={`/${role}/topup-request`}
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
                No topup requests found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't created any topup requests yet.
              </p>
              <div className="mt-6">
                <Link
                  to={`/${role}/topup-request`}
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
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Method
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Screenshot
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <>
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{request.amount}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {request.payment_method}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                statusColors[request.status.toUpperCase()] ||
                                "bg-gray-100 text-gray-800"
                              } capitalize`}
                            >
                              {statusIcons[request.status.toUpperCase()]}
                              {request.status.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {format(new Date(request.created_at), "MMM d, yyyy")}
                            <br />
                            <span className="text-xs text-gray-400">
                              {format(new Date(request.created_at), "h:mm a")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {request.screenshot ? (
                            <button
                              onClick={() => openModal(request.screenshot)}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              View
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleExpandRequest(request.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
                          >
                            {expandedRequest === request.id ? (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Less
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                More
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRequest === request.id && (
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-4 sm:px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 mr-2 text-blue-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Transaction Details
                                  </h3>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Note</p>
                                      <p className="text-sm">
                                        {request.note || (
                                          <span className="text-gray-400">Not provided</span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                                      <p className="text-sm capitalize">{request.payment_method}</p>
                                    </div>
                                    {request.payment_details?.details?.upi_id && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                                        <p className="text-sm">{request.payment_details.details.upi_id}</p>
                                      </div>
                                    )}
                                    {request.payment_details?.details?.bank_upi && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Bank UPI</p>
                                        <p className="text-sm">{request.payment_details.details.bank_upi}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {request.payment_method === 'bank' && (
                                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                                        />
                                      </svg>
                                      Bank Details
                                    </h3>
                                    <div className="space-y-3">
                                      {request.payment_details?.details?.account_holder_name && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                                          <p className="text-sm">
                                            {request.payment_details.details.account_holder_name}
                                          </p>
                                        </div>
                                      )}
                                      {request.payment_details?.details?.bank_name && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                                          <p className="text-sm">
                                            {request.payment_details.details.bank_name}
                                          </p>
                                        </div>
                                      )}
                                      {request.payment_details?.details?.account_number && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Account Number</p>
                                          <p className="text-sm">
                                            {request.payment_details.details.account_number}
                                          </p>
                                        </div>
                                      )}
                                      {request.payment_details?.details?.ifsc_code && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                                          <p className="text-sm">
                                            {request.payment_details.details.ifsc_code}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 mr-2 text-purple-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Timeline
                                  </h3>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Created At</p>
                                      <p className="text-sm">
                                        {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                                      </p>
                                    </div>
                                    {request.reviewed_at && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Reviewed At</p>
                                        <p className="text-sm">
                                          {format(new Date(request.reviewed_at), "MMM d, yyyy h:mm a")}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 mr-2 text-yellow-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                      />
                                    </svg>
                                    Status Information
                                  </h3>
                                  <div className="space-y-3">
                                    {request.approved_by && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Approved By</p>
                                        <p className="text-sm text-green-600">
                                          {request.approved_by}
                                        </p>
                                      </div>
                                    )}
                                    {request.rejected_reason && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Rejection Reason</p>
                                        <p className="text-sm text-red-600">
                                          {request.rejected_reason}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {request.screenshot && (
                                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2 text-blue-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      Payment Proof
                                    </h3>
                                    <button
                                      onClick={() => openModal(request.screenshot)}
                                      className="w-full"
                                    >
                                      <img
                                        src={request.screenshot}
                                        alt="Payment proof"
                                        className="w-full h-auto rounded-md border border-gray-200 max-h-40 object-contain"
                                      />
                                      <p className="mt-2 text-sm text-blue-600 text-center">
                                        Click to view full size
                                      </p>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

export default TopupRequestsList;