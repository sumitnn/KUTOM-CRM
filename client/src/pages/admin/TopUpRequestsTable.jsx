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
  FiHash,
  FiClock,
  FiUser,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiUserCheck,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { BiTimeFive } from "react-icons/bi";
import { BsBank2, BsCreditCard2Front } from "react-icons/bs";
import { MdOutlinePayment, MdOutlinePendingActions } from "react-icons/md";
import ModalPortal from "../../components/ModalPortal";

const rejectionReasons = [
  { value: "INVALID_SCREENSHOT", label: "Invalid Screenshot", icon: "📸" },
  { value: "INVALID_AMOUNT", label: "Invalid Amount", icon: "💰" },
  { value: "REJECTED", label: "Other Reason", icon: "❌" },
];

const statusColors = {
  PENDING: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <MdOutlinePendingActions className="w-4 h-4" />
  },
  APPROVED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: <FiCheckCircle className="w-4 h-4" />
  },
  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: <FiXCircle className="w-4 h-4" />
  },
  INVALID_SCREENSHOT: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <FiAlertCircle className="w-4 h-4" />
  },
  INVALID_AMOUNT: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <FiAlertCircle className="w-4 h-4" />
  },
};

const paymentMethodColors = {
  upi: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: <FiCreditCard className="w-4 h-4" />
  },
  bank: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: <BsBank2 className="w-4 h-4" />
  },
  card: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: <BsCreditCard2Front className="w-4 h-4" />
  },
};

const ITEMS_PER_PAGE = 10;

const TopUpRequestsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Build query parameters
  const queryParams = {
    page: currentPage,
    page_size: ITEMS_PER_PAGE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterStatus !== "ALL" && { status: filterStatus.toLowerCase() }),
  };
  
  const {
    data: response = { results: [], count: 0 },
    isLoading,
    refetch,
    isError,
  } = useGetTopupRequestQuery(queryParams);

  const requests = response.results || [];
  const totalCount = response.count || 0;
  
  const [updateTopupRequest, { isLoading: updating }] = useUpdateTopupRequestMutation();
  const [modalImage, setModalImage] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedDescription, setRejectedDescription] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewDetailsModal, setViewDetailsModal] = useState({ open: false, request: null });

  const defaultScreenshot = "https://via.placeholder.com/600x400?text=No+Screenshot";

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
      toast.success(
        <div className="flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5 text-green-500" />
          <span>Request approved successfully</span>
        </div>
      );
      refetch();
    } catch (err) {
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
          rejected_reason: rejectedDescription 
            ? `${rejectedDescription} (${rejectedReason})`
            : rejectedReason
        }
      }).unwrap();
      toast.success("Request rejected successfully.");
      setRejectModal({ open: false, requestId: null });
      setRejectedReason("");
      setRejectedDescription("");
      refetch();
    } catch (err) {
      toast.error("Failed to reject request.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getUserIdentifier = (user) => {
    return user?.stockist_id || user?.reseller_id || user?.vendor_id || "N/A";
  };

  const openDetailsModal = (request) => {
    setViewDetailsModal({ open: true, request });
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-24 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Search and Filter Bar */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-2xl">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, username, email, amount..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
           
            
            <button
              onClick={refetch}
              className="p-3 rounded-2xl cursor-pointer border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer min-w-[180px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">📋 All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>

       
      </div>

      {isError ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <FiXCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load data</h3>
          <p className="text-gray-600 mb-6">There was an error loading the top-up requests.</p>
          <button 
            onClick={refetch}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <FiSearch className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600">No top-up requests match your current filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID & User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status & Review</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => {
                  const statusStyle = statusColors[req.status?.toUpperCase()] || statusColors.PENDING;
                  const paymentStyle = paymentMethodColors[req.payment_method] || paymentMethodColors.bank;
                  
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors group">
                      {/* ID & User Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {req.user?.username?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                #{req.id}
                              </span>
                              <span className="font-semibold text-gray-900">{req.user?.username}</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <FiMail className="w-3.5 h-3.5" />
                                <span className="text-xs">{req.user?.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <FiUser className="w-3.5 h-3.5" />
                                <span className="text-xs capitalize">{req.user?.role || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Payment Details Column */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-900 flex items-center">
                              <FaRupeeSign className="w-4 h-4" />
                              {parseFloat(req.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${paymentStyle.bg} ${paymentStyle.text} border ${paymentStyle.border}`}>
                            {paymentStyle.icon}
                            <span>{req.payment_method?.toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status & Review Column */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusStyle.badge}`}>
                            {statusStyle.icon}
                            {req.status?.toUpperCase()}
                          </span>
                          
                          {/* Reviewed At and By */}
                          {req.reviewed_at && (
                            <div className="space-y-1.5">
                              {req.approved_by && req.approved_by !== "Not Approved Yet" && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <FiUserCheck className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-gray-700">by <span className="font-medium">{req.approved_by}</span></span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <FiClock className="w-3.5 h-3.5" />
                                <span>{formatDateTime(req.reviewed_at)}</span>
                              </div>
                            </div>
                          )}
                          
                          {req.rejected_reason && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                              <span className="font-medium">Reason:</span> {req.rejected_reason}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Timeline Column */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <FiCalendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-900 font-medium">{formatDate(req.created_at)}</div>
                              <div className="text-xs text-gray-500">{formatTime(req.created_at)}</div>
                            </div>
                          </div>
                          {req.reviewed_at && (
                            <div className="flex items-center gap-2 text-sm border-t border-gray-100 pt-2">
                              <FiClock className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-gray-900 font-medium">Review at</div>
                                <div className="text-xs text-gray-500">{formatDate(req.reviewed_at)} ({formatTime(req.reviewed_at)})</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(req.screenshot)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="View Screenshot"
                          >
                            <FiImage className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => openDetailsModal(req)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="View Details"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                          
                          {req.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={updating}
                                className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-xl transition-all disabled:opacity-50"
                                title="Approve"
                              >
                                <FiCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, requestId: req.id })}
                                disabled={updating}
                                className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all disabled:opacity-50"
                                title="Reject"
                              >
                                <FiXCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-4 p-4">
            {requests.map((req) => {
              const statusStyle = statusColors[req.status?.toUpperCase()] || statusColors.PENDING;
              const paymentStyle = paymentMethodColors[req.payment_method] || paymentMethodColors.bank;
              
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          #{req.id}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}>
                          {statusStyle.icon}
                          {req.status}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900 flex items-center">
                        <FaRupeeSign className="w-4 h-4" />
                        {parseFloat(req.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                        {req.user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{req.user?.username}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <FiMail className="w-3 h-3" />
                          {req.user?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${paymentStyle.bg}`}>
                        {paymentStyle.icon}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Payment Method</div>
                        <div className="font-medium text-gray-900">{req.payment_method?.toUpperCase()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">Created</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(req.created_at)}</div>
                        <div className="text-xs text-gray-500">{formatTime(req.created_at)}</div>
                      </div>
                      {req.reviewed_at && (
                        <div>
                          <div className="text-xs text-gray-500">Reviewed</div>
                          <div className="text-sm font-medium text-gray-900">{formatDate(req.reviewed_at)}</div>
                          <div className="text-xs text-gray-500">{formatTime(req.reviewed_at)}</div>
                        </div>
                      )}
                    </div>

                    {req.reviewed_at && req.approved_by && req.approved_by !== "Not Approved Yet" && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <FiUserCheck className="w-4 h-4 text-green-600" />
                        <span>Reviewed by <span className="font-medium">{req.approved_by}</span></span>
                      </div>
                    )}

                    {req.rejected_reason && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                        <span className="font-medium">Reason:</span> {req.rejected_reason}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => openModal(req.screenshot)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <FiImage className="w-4 h-4" /> Screenshot
                      </button>
                      
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={updating}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50"
                          >
                            <FiCheck className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, requestId: req.id })}
                            disabled={updating}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                          >
                            <FiXCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                  </span>{' '}
                  of <span className="font-semibold">{totalCount}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                        className={`min-w-[40px] h-10 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                            : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Screenshot Modal */}
      <ModalPortal>
        <dialog id="screenshot_modal" className="modal">
          <div className="modal-box max-w-4xl p-0 overflow-hidden rounded-2xl">
            <div className="relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => downloadImage(modalImage)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all"
                  title="Download"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById("screenshot_modal").close()}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all"
                  title="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-100 p-8 flex justify-center items-center min-h-[500px]">
                {modalImage ? (
                  <img
                    src={modalImage}
                    alt="Payment Screenshot"
                    className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <FiImage className="w-20 h-20 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No image available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </ModalPortal>

      {/* Reject Modal */}
      <ModalPortal>
        <dialog id="reject_modal" className={`modal ${rejectModal.open ? 'modal-open' : ''}`}>
          <div className="modal-box max-w-md rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Reject Request</h3>
                <p className="text-sm text-gray-500">Please provide rejection details</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  {rejectionReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.icon} {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[100px]"
                  placeholder="Provide more details about the rejection..."
                  value={rejectedDescription}
                  onChange={(e) => setRejectedDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-action mt-8 flex gap-3">
              <button
                onClick={() => {
                  setRejectModal({ open: false, requestId: null });
                  setRejectedReason("");
                  setRejectedDescription("");
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectedReason || updating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiXCircle className="w-5 h-5" />
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </dialog>
      </ModalPortal>

      {/* Details Modal */}
      <ModalPortal>
        <dialog id="details_modal" className={`modal ${viewDetailsModal.open ? 'modal-open' : ''}`}>
          <div className="modal-box max-w-3xl rounded-2xl p-0 overflow-hidden">
            {viewDetailsModal.request && (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-2xl">Request Details</h3>
                      <p className="text-blue-100 mt-1">ID: #{viewDetailsModal.request.id}</p>
                    </div>
                    <button
                      onClick={() => setViewDetailsModal({ open: false, request: null })}
                      className="p-2 hover:bg-white/20 rounded-xl transition-all"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* User Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiUser className="w-5 h-5" />
                      User Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Username</div>
                        <div className="font-medium">{viewDetailsModal.request.user?.username}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-medium">{viewDetailsModal.request.user?.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium">{viewDetailsModal.request.user?.phone || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Role</div>
                        <div className="font-medium capitalize">{viewDetailsModal.request.user?.role}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">User ID</div>
                        <div className="font-mono text-sm">{getUserIdentifier(viewDetailsModal.request.user)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MdOutlinePayment className="w-5 h-5" />
                      Payment Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="font-bold text-xl flex items-center text-green-600">
                          <FaRupeeSign className="w-4 h-4" />
                          {parseFloat(viewDetailsModal.request.amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Payment Method</div>
                        <div className="font-medium capitalize">{viewDetailsModal.request.payment_method}</div>
                      </div>
                    </div>
                    
                    {viewDetailsModal.request.payment_details?.details && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">Transaction Details</div>
                        {viewDetailsModal.request.payment_method === 'upi' ? (
                          <div className="font-mono text-sm">{viewDetailsModal.request.payment_details.details.upi_id}</div>
                        ) : viewDetailsModal.request.payment_method === 'bank' ? (
                          <div className="space-y-1 text-sm">
                            <div><span className="text-gray-500">Bank:</span> {viewDetailsModal.request.payment_details.details.bank_name}</div>
                            <div><span className="text-gray-500">Account:</span> {viewDetailsModal.request.payment_details.details.account_number}</div>
                            <div><span className="text-gray-500">IFSC:</span> {viewDetailsModal.request.payment_details.details.ifsc_code}</div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BiTimeFive className="w-5 h-5" />
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiCalendar className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Created</div>
                          <div className="text-xs text-gray-500">{formatDateTime(viewDetailsModal.request.created_at)}</div>
                        </div>
                      </div>
                      
                      {viewDetailsModal.request.reviewed_at && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiCheck className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Reviewed</div>
                            <div className="text-xs text-gray-500">{formatDateTime(viewDetailsModal.request.reviewed_at)}</div>
                            {viewDetailsModal.request.approved_by && viewDetailsModal.request.approved_by !== "Not Approved Yet" && (
                              <div className="text-xs text-gray-600 mt-1">by {viewDetailsModal.request.approved_by}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Reason */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Status Information</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                        statusColors[viewDetailsModal.request.status?.toUpperCase()]?.badge
                      }`}>
                        {viewDetailsModal.request.status?.toUpperCase()}
                      </span>
                    </div>
                    
                    {viewDetailsModal.request.rejected_reason && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-xs text-red-500 font-medium mb-1">Rejection Reason</div>
                        <div className="text-sm text-red-700">{viewDetailsModal.request.rejected_reason}</div>
                      </div>
                    )}
                    
                    {viewDetailsModal.request.note && (
                      <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                        <div className="text-xs text-gray-500 font-medium mb-1">Note</div>
                        <div className="text-sm text-gray-700">{viewDetailsModal.request.note}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-action p-6 border-t border-gray-200">
                  <button
                    onClick={() => setViewDetailsModal({ open: false, request: null })}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </dialog>
      </ModalPortal>
    </div>
  );
};

export default TopUpRequestsTable;