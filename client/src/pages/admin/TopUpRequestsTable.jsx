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
  FiMail,
  FiPhone,
  FiCreditCard,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import ModalPortal from "../../components/ModalPortal";

const rejectionReasons = [
  { value: "INVALID_SCREENSHOT", label: "Invalid Screenshot" },
  { value: "INVALID_AMOUNT", label: "Invalid Amount" },
  { value: "REJECTED", label: "Other Reason" },
];

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border border-green-200",
  INVALID_SCREENSHOT: "bg-red-100 text-red-800 border border-red-200",
  INVALID_AMOUNT: "bg-red-100 text-red-800 border border-red-200",
  REJECTED: "bg-red-100 text-red-800 border border-red-200",
};

const paymentMethodColors = {
  upi: "bg-purple-100 text-purple-800",
  bank: "bg-blue-100 text-blue-800",
  card: "bg-orange-100 text-orange-800",
};

const ITEMS_PER_PAGE = 10;

const TopUpRequestsTable = () => {
  const {
    data: response = { results: [] },
    isLoading,
    refetch,
    error,
    isError,
  } = useGetTopupRequestQuery();

  const requests = response.results || [];

  const [updateTopupRequest, { isLoading: updating }] = useUpdateTopupRequestMutation();
  const [modalImage, setModalImage] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedDescription, setRejectedDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState(null);

  const defaultScreenshot = "https://via.placeholder.com/150?text=No+Image";

  // Filter and search logic
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.phone?.includes(searchTerm) ||
      req.user?.stockist_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.reseller_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      await updateTopupRequest({ topupId: topupid, data: { status: "approved" } }).unwrap();
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
          status: "rejected",
          rejected_reason: `${rejectedDescription} || ${rejectedReason}`
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

  const getUserIdentifier = (user) => {
    return user.stockist_id || user.reseller_id || user.vendor_id || "N/A";
  };

  const getPaymentMethodDisplay = (method) => {
    return method ? method.toUpperCase() : "N/A";
  };

  const toggleRowExpansion = (requestId) => {
    setExpandedRow(expandedRow === requestId ? null : requestId);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="container mx-auto px-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with search and filters */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Top-up Requests</h2>
              <div className="text-sm text-gray-600 mt-1">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
                {response.count !== undefined && ` (${response.count} total)`}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search by user, email, phone, ID..."
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="border border-gray-300 rounded-xl cursor-pointer px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <div className="text-red-500 mb-4 text-lg">Failed to load data</div>
            <button 
              onClick={refetch}
              className="btn btn-outline btn-primary"
            >
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-xl font-medium mb-2">No requests found</div>
            <div className="text-gray-400">No top-up requests match your current filters</div>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="lg:hidden">
              {paginatedRequests.map((req) => (
                <div key={req.id} className="border-b border-gray-200 last:border-b-0 p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {req.user?.username?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{req.user?.username}</div>
                          <div className="text-xs text-gray-500 capitalize">{req.user?.role || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-500 text-xs">Amount</div>
                      <div className="font-semibold text-green-600 flex items-center">
                        <FaRupeeSign className="mr-1" /> {req.amount}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Payment Method</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium inline-block ${paymentMethodColors[req.payment_method] || 'bg-gray-100 text-gray-800'}`}>
                        {getPaymentMethodDisplay(req.payment_method)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">User ID</div>
                      <div className="font-medium text-gray-900">{getUserIdentifier(req.user)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Date</div>
                      <div className="font-medium text-gray-900 text-xs">{formatDate(req.created_at)}</div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => toggleRowExpansion(req.id)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mb-3"
                    >
                      <FiInfo className="w-4 h-4" />
                      {expandedRow === req.id ? 'Hide Details' : 'Show Details'}
                    </button>

                    {expandedRow === req.id && (
                      <div className="space-y-3 text-sm bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <div className="text-gray-500 text-xs">Email</div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <FiMail className="w-4 h-4 text-gray-400" />
                              {req.user?.email || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Phone</div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <FiPhone className="w-4 h-4 text-gray-400" />
                              {req.user?.phone || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Payment Details</div>
                            <div className="font-medium text-gray-900 text-xs bg-white p-2 rounded border">
                              {req.payment_method === 'upi' ? (
                                <div>
                                  <div>UPI ID: {req.payment_details?.details?.upi_id || "N/A"}</div>
                                </div>
                              ) : req.payment_method === 'bank' ? (
                                <div>
                                  <div>Bank: {req.payment_details?.details?.bank_name || "N/A"}</div>
                                  <div>Account: {req.payment_details?.details?.account_number || "N/A"}</div>
                                  <div>IFSC: {req.payment_details?.details?.ifsc_code || "N/A"}</div>
                                </div>
                              ) : (
                                "No payment details available"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => openModal(req.screenshot)}
                      className="inline-flex items-center cursor-pointer px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex-1 justify-center"
                    >
                      <FiImage className="mr-2 w-4 h-4" /> View Screenshot
                    </button>
                    
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={updating}
                          className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 flex-1 justify-center"
                        >
                          <FiCheck className="mr-2 w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, requestId: req.id })}
                          disabled={updating}
                          className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 flex-1 justify-center"
                        >
                          <FiXCircle className="mr-2 w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User Details
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Payment Info
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status & Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
                            {req.user?.username?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-gray-900">{req.user?.username}</div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                                {req.user?.role || "N/A"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <FiMail className="w-4 h-4" />
                                {req.user?.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <FiPhone className="w-4 h-4" />
                                {req.user?.phone}
                              </div>
                              <div className="flex items-center gap-2">
                                <FiCreditCard className="w-4 h-4" />
                                ID: {getUserIdentifier(req.user)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-green-600 flex items-center text-lg">
                              <FaRupeeSign className="mr-1" /> {req.amount}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${paymentMethodColors[req.payment_method] || 'bg-gray-100 text-gray-800'}`}>
                              {getPaymentMethodDisplay(req.payment_method)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                            {req.payment_method === 'upi' ? (
                              <div>
                                <div className="font-medium">UPI Transfer</div>
                                <div>UPI ID: {req.payment_details?.details?.upi_id || "N/A"}</div>
                              </div>
                            ) : req.payment_method === 'bank' ? (
                              <div>
                                <div className="font-medium">Bank Transfer</div>
                                <div>Bank: {req.payment_details?.details?.bank_name || "N/A"}</div>
                                <div>Account: {req.payment_details?.details?.account_number || "N/A"}</div>
                                <div>IFSC: {req.payment_details?.details?.ifsc_code || "N/A"}</div>
                              </div>
                            ) : (
                              "No payment details available"
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                            {req.status}
                          </span>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <FiCalendar className="w-4 h-4" />
                            {formatDate(req.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openModal(req.screenshot)}
                            className="inline-flex items-center cursor-pointer px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            <FiImage className="mr-2 w-4 h-4" /> Screenshot
                          </button>
                          
                          {req.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={updating}
                                className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FiCheck className="mr-2 w-4 h-4" /> Approve
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, requestId: req.id })}
                                disabled={updating}
                                className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FiXCircle className="mr-2 w-4 h-4" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)}
                  </span>{' '}
                  of <span className="font-semibold">{filteredRequests.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      <ModalPortal>
      <dialog id="screenshot_modal" className="modal">
        <div className="modal-box max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Payment Screenshot</h3>
            <button
              onClick={() => document.getElementById("screenshot_modal").close()}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <FiX />
            </button>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 mb-4 flex-1 flex justify-center items-center overflow-auto">
            {modalImage ? (
              <img
                src={modalImage}
                alt="Payment Screenshot"
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <div className="py-20 text-gray-400 text-center">
                <FiImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>No image available</div>
              </div>
            )}
          </div>
          <div className="modal-action">
            <button
              onClick={() => downloadImage(modalImage)}
              className="btn btn-primary gap-2"
            >
              <FiDownload className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog></ModalPortal>

      {/* Reject Modal */}
      <ModalPortal>
      <dialog id="reject_modal" className={`modal ${rejectModal.open ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-md">
          <div className="flex justify-between items-center mb-6">
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-bordered w-full cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Additional details (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Provide more information about why this request is being rejected..."
                value={rejectedDescription}
                onChange={(e) => setRejectedDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-action mt-8">
            <button
              onClick={() => {
                setRejectModal({ open: false, requestId: null });
                setRejectedReason("");
                setRejectedDescription("");
              }}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={!rejectedReason || updating}
              className={`btn btn-error gap-2 ${!rejectedReason ? 'btn-disabled' : ''}`}
            >
              {updating ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Processing...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </button>
          </div>
        </div>
      </dialog></ModalPortal>
    </div>
  );
};

export default TopUpRequestsTable;