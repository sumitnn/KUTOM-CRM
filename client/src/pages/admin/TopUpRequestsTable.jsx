import { useState, useEffect } from "react";
import {
  useGetTopupRequestQuery,
  useUpdateTopupRequestMutation,
} from "../../features/topupApi";
import { toast } from "react-toastify";
import {
  FiDownload,
  FiX,
  FiCheck,
  FiXCircle,
  FiImage,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiAward,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const rejectionReasons = [
  { value: "INVALID_SCREENSHOT", label: "Invalid Screenshot" },
  { value: "INVALID_AMOUNT", label: "Invalid Amount" },
  { value: "REJECTED", label: "Other Reason" },
];

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  INVALID_SCREENSHOT: "bg-red-100 text-red-800",
  INVALID_AMOUNT: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

const ITEMS_PER_PAGE = 10;

const TopUpRequestsTable = () => {
  const {
    data: response = { results: [] }, // Default to empty results array
    isLoading,
    refetch,
    error,
    isError,
  } = useGetTopupRequestQuery();

  // Get the actual requests from the response
  const requests = response.results || [];

  const [updateTopupRequest, { isLoading: updating }] = useUpdateTopupRequestMutation();
  const [modalImage, setModalImage] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedDescription, setRejectedDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const defaultScreenshot = "https://via.placeholder.com/150?text=No+Image";

  // Filter and search logic (now client-side since API might not support search)
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.user?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.amount?.toString().includes(searchTerm) ||
                         req.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || req.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openModal = (imageUrl) => {
    setModalImage(imageUrl || defaultScreenshot);
    document.getElementById("screenshot_modal").showModal();
  };

  const downloadImage = (imageUrl) => {
    const link = document.createElement("a");
    link.href = imageUrl || defaultScreenshot;
    link.download = "screenshot.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = async (topupid) => {
    try {
      await updateTopupRequest({ topupId: topupid, data: { status: "APPROVED" } }).unwrap();
      toast.success("Request approved successfully.");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve request.");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectedReason) {
      toast.error("Please select a rejection reason.");
      return;
    }

    try {
      await updateTopupRequest({
        topupId: rejectModal.requestId,
        data: {
          status: rejectedReason,
          rejected_reason: rejectedDescription
        }
      }).unwrap();
      toast.success("Request rejected.");
      setRejectModal({ open: false, requestId: null });
      setRejectedReason("");
      setRejectedDescription("");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request.");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with search and filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Top-up Requests</h2>
            <div className="text-sm text-gray-500">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
              {response.count !== undefined && ` (${response.count} total)`}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by user, amount or status..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="INVALID_SCREENSHOT">Invalid Screenshot</option>
              <option value="INVALID_AMOUNT">Invalid Amount</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-10">
            <div className="text-red-500 mb-2">Failed to load data</div>
            <button 
              onClick={refetch}
              className="btn btn-outline btn-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No top-up requests found matching your criteria
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiUser className="mr-2" /> User
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaRupeeSign className="mr-2" /> Amount
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      <div className="flex items-center">
                        <FiImage className="mr-2" /> Screenshot
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2" /> Date
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.user}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{req.role || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {req.role || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600 flex items-center">
                          <FaRupeeSign className="mr-1" /> {req.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <button
                          onClick={() => openModal(req.screenshot)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          <FiImage className="mr-1" /> View
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                          {req.status}
                        </span>
                        <div className="text-xs text-gray-500 lg:hidden mt-1">{formatDate(req.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {req.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={updating}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                              >
                                <FiCheck className="mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, requestId: req.id })}
                                disabled={updating}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
                              >
                                <FiXCircle className="mr-1" /> Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openModal(req.screenshot)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none md:hidden"
                          >
                            <FiImage className="mr-1" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredRequests.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="inline" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === page ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="inline" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      <dialog id="screenshot_modal" className="modal">
        <div className="modal-box max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Payment Screenshot</h3>
            <button
              onClick={() => document.getElementById("screenshot_modal").close()}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <FiX />
            </button>
          </div>
          <div className="bg-gray-100 rounded-lg p-2 mb-4 flex justify-center">
            {modalImage ? (
              <img
                src={modalImage}
                alt="Payment Screenshot"
                className="max-h-[70vh] object-contain rounded"
              />
            ) : (
              <div className="py-20 text-gray-400">No image available</div>
            )}
          </div>
          <div className="modal-action">
            <button
              onClick={() => downloadImage(modalImage)}
              className="btn btn-outline"
            >
              <FiDownload className="mr-2" /> Download
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Reject Modal */}
      <dialog id="reject_modal" className={`modal ${rejectModal.open ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Reject Top-up Request</h3>
            <button
              onClick={() => {
                setRejectModal({ open: false, requestId: null });
                setRejectedReason("");
                setRejectedDescription("");
              }}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                required
              >
                <option value="">Select a reason</option>
                {rejectionReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional details (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Provide more information..."
                value={rejectedDescription}
                onChange={(e) => setRejectedDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-action">
            <button
              onClick={handleRejectConfirm}
              disabled={!rejectedReason || updating}
              className={`btn btn-error ${!rejectedReason ? 'btn-disabled' : ''}`}
            >
              {updating ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Confirm Rejection"
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default TopUpRequestsTable;