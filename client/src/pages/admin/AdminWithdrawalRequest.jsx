import React, { useState } from 'react';
import { useGetAdminWithdrawalsQuery, useUpdateWithdrawalMutation } from '../../features/topupApi';
import { format } from 'date-fns';
import ModalPortal from '../../components/ModalPortal';
import { toast } from 'react-toastify';
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const paymentMethodOptions = [
  { value: '', label: 'All Methods' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank Transfer' },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const AdminWithdrawalRequest = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [openApproveConfirm, setOpenApproveConfirm] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const { data, isLoading, isError } = useGetAdminWithdrawalsQuery({
    page,
    search: searchTerm,
    status: statusFilter,
    payment_method: paymentMethodFilter,
    date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
    date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : null,
  });

  const [updateWithdrawal] = useUpdateWithdrawalMutation();

  const handleStatusChange = async (id, newStatus, reason = '') => {
    setIsProcessing(true);
    try {
      await updateWithdrawal({ 
        id, 
        data: reason ? { status: newStatus, rejected_reason: reason } : { status: newStatus } 
      }).unwrap();
      toast.success("Updated Record Successfully");
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error);
    } finally {
      setIsProcessing(false);
      setOpenApproveConfirm(false);
      setOpenRejectModal(false);
      setRejectionReason('');
    }
  };

  const handleUploadScreenshot = async () => {
    if (!selectedWithdrawal || !screenshotFile) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('screenshot', screenshotFile);
    formData.append('status', "screenshot");
    
    try {
      await updateWithdrawal({
        id: selectedWithdrawal.id,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).unwrap();
      toast.success("Updated Payment Screenshot Successfully");
      setOpenDialog(false);
      setScreenshotFile(null);
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      toast.error("Failed invalid action");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentMethodFilter('');
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  const openScreenshotModal = (screenshotUrl) => {
    setSelectedScreenshot(screenshotUrl);
    setScreenshotModal(true);
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderPaymentDetails = (withdrawal) => {
    const { payment_method, payment_details } = withdrawal;
    
    if (payment_method === 'upi') {
      return (
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="font-semibold w-20">UPI ID:</span>
            <span className="text-gray-700 font-bold">{payment_details?.upi_id || 'N/A'}</span>
          </div>
        </div>
      );
    }
    
    if (payment_method === 'bank') {
      return (
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="font-semibold w-20">Bank:</span>
            <span className="text-gray-700 font-bold">{payment_details?.bank_name || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Account:</span>
            <span className="text-gray-700 font-bold">{payment_details?.account_number ? payment_details?.account_number : 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Holder:</span>
            <span className="text-gray-700 font-bold">{payment_details?.account_holder_name || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">IFSC:</span>
            <span className="text-gray-700 font-bold">{payment_details?.ifsc_code || 'N/A'}</span>
          </div>
        </div>
      );
    }
    
    return <span className="text-gray-500 text-xs">No payment details available</span>;
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Withdrawal Requests</h2>
      <p className="text-sm text-gray-600 mb-6 font-bold">Manage and review all withdrawal requests</p>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-4">
          <div className="md:col-span-2 lg:col-span-1">
            <input
              type="text"
              className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2 lg:col-span-1 flex space-x-2">
            <input
              type="date"
              className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : null)}
            />
            <input
              type="date"
              className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-1 flex space-x-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 px-4 py-2 bg-gray-200 cursor-pointer text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {/* Results Section */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Error loading withdrawals
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">User Details</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Payment Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Requested Date</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.results?.map((withdrawal, index) => (
                    <React.Fragment key={withdrawal.id}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleRowExpansion(withdrawal.id)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                          <div className="lg:hidden text-xs text-gray-500 mt-1">
                            {withdrawal.payment_method_display}
                          </div>
                          <div className="md:hidden mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-extrabold rounded-full ${statusColors[withdrawal.status]}`}>
                              {withdrawal.status}
                            </span>
                          </div>
                          <div className="xl:hidden text-xs text-gray-500 mt-1">
                            {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {withdrawal.user?.username || withdrawal.user?.email || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {withdrawal.user?.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <strong>Role:</strong> {withdrawal.user?.role_display || 'Unknown'}
                          </div>
                          {withdrawal.user?.vendor_id && (
                            <div className="text-xs text-blue-600 font-bold">
                              <strong>Vendor ID:</strong> {withdrawal.user.vendor_id}
                            </div>
                          )}
                          {withdrawal.user?.stockist_id && (
                            <div className="text-xs text-blue-600 font-bold">
                              <strong>Stockist ID:</strong> {withdrawal.user.stockist_id}
                            </div>
                          )}
                          {withdrawal.user?.reseller_id && (
                            <div className="text-xs text-blue-600 font-bold">
                              <strong>Reseller ID:</strong> {withdrawal.user.reseller_id}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                          ₹{withdrawal.amount}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-bold hidden lg:table-cell">
                          {withdrawal.payment_method_display}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className={`px-2 inline-flex text-xs leading-5 font-extrabold rounded-full ${statusColors[withdrawal.status]}`}>
                            {withdrawal.status}
                          </span>
                          {withdrawal.status === 'rejected' && withdrawal.rejected_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              Reason: {withdrawal.rejected_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-bold hidden xl:table-cell">
                          {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            {withdrawal.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWithdrawal(withdrawal);
                                    setOpenApproveConfirm(true);
                                  }}
                                  disabled={isProcessing}
                                  className={`text-green-600 btn hover:text-green-900 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWithdrawal(withdrawal);
                                    setOpenRejectModal(true);
                                  }}
                                  disabled={isProcessing}
                                  className={`text-red-600 btn hover:text-red-900 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {['approved', 'pending'].includes(withdrawal.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWithdrawal(withdrawal);
                                  setOpenDialog(true);
                                }}
                                disabled={isProcessing}
                                className={`text-blue-600 btn hover:text-blue-900 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {withdrawal?.screenshot ? "Uploaded (Update)" : "Upload Proof"}
                              </button>
                            )}
                            {withdrawal.screenshot && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openScreenshotModal(withdrawal.screenshot);
                                }}
                                className="text-purple-600 btn hover:text-purple-900"
                              >
                                View Screenshot
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === withdrawal.id && (
                        <tr className="bg-gray-50">
                          <td colSpan="7" className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Payment Details</h4>
                                {renderPaymentDetails(withdrawal)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Wallet Information</h4>
                                <div className="space-y-1 text-xs">
                                  <div className="flex">
                                    <span className="font-semibold w-24">Current Balance:</span>
                                    <span className="text-gray-700">₹{withdrawal.wallet?.current_balance || '0.00'}</span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-semibold w-24">Payout Balance:</span>
                                    <span className="text-gray-700">₹{withdrawal.wallet?.payout_balance || '0.00'}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Request Information</h4>
                                <div className="space-y-1 text-xs">
                                  <div className="flex">
                                    <span className="font-semibold w-20">Request ID:</span>
                                    <span className="text-gray-700">#{withdrawal.id}</span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-semibold w-20">Date:</span>
                                    <span className="text-gray-700">{format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}</span>
                                  </div>
                                  {withdrawal.approved_by && (
                                    <div className="flex">
                                      <span className="font-semibold w-20">Approved By:</span>
                                      <span className="text-gray-700">{withdrawal.approved_by?.username || 'N/A'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {data?.count > 0 && (
            <div className="mt-6 flex flex-col items-center">
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: Math.ceil(data.count / 10) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 rounded-md ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, data.count)} of {data.count} withdrawals
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Upload Proof Dialog */}
      {openDialog && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-extrabold text-gray-900">Upload Payment Proof</h3>
              <div className="mt-4">
                {selectedWithdrawal && (
                  <>
                    <p className="text-md text-gray-600">
                      For withdrawal  <strong>#{selectedWithdrawal.id}</strong>
                    </p>
                    <p className="text-md text-gray-600 mt-1">
                      Amount:  <strong>₹{selectedWithdrawal.amount}</strong>
                    </p>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Screenshot (Pdf/Image)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setScreenshotFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 cursor-pointer
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleUploadScreenshot}
                disabled={!screenshotFile || isProcessing}
                className={`w-full sm:w-auto cursor-pointer inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:text-sm ${!screenshotFile || isProcessing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isProcessing ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setOpenDialog(false)}
                disabled={isProcessing}
                className="w-full sm:w-auto cursor-pointer inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div></ModalPortal>
      )}

      {/* Approve Confirmation Dialog */}
      {openApproveConfirm && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Confirm Approval</h3>
              <div className="mt-4">
                {selectedWithdrawal && (
                  <>
                    <p className="text-md text-gray-600">
                      Are you sure you want to approve withdrawal #{selectedWithdrawal.id}?
                    </p>
                    <p className="text-md text-gray-600 mt-1">
                      Amount: ₹{selectedWithdrawal.amount}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange(selectedWithdrawal.id, 'approved')}
                disabled={isProcessing}
                className={`w-full sm:w-auto cursor-pointer inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:text-sm ${isProcessing ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isProcessing ? 'Processing...' : 'Confirm Approve'}
              </button>
              <button
                type="button"
                onClick={() => setOpenApproveConfirm(false)}
                disabled={isProcessing}
                className="w-full sm:w-auto cursor-pointer inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div></ModalPortal>
      )}

      {/* Reject Reason Dialog */}
      {openRejectModal && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">Reject Withdrawal Request</h3>
              <div className="mt-4">
                {selectedWithdrawal && (
                  <>
                    <p className="text-md text-gray-600">
                      Withdrawal <strong>#{selectedWithdrawal.id}</strong>
                    </p>
                    <p className="text-md text-gray-600 mt-1">
                      Amount: <strong>₹{selectedWithdrawal.amount}</strong>
                    </p>
                    <div className="mt-4">
                      <label htmlFor="rejectionReason" className="block text-sm font-bold text-gray-700 mb-1">
                        Reason for rejection*
                      </label>
                      <textarea
                        id="rejectionReason"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange(selectedWithdrawal.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason || isProcessing}
                className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:text-sm ${!rejectionReason || isProcessing ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isProcessing ? 'Processing...' : 'Confirm Reject'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div></ModalPortal>
      )}

      {/* Screenshot Preview Modal */}
      {screenshotModal && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-bold text-gray-900">Payment Screenshot</h3>
              <button
                onClick={() => setScreenshotModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex justify-center">
              {selectedScreenshot && (
                <img
                  src={selectedScreenshot}
                  alt="Payment Screenshot"
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              )}
            </div>
          </div>
        </div></ModalPortal>
      )}
    </div>
  );
};

export default AdminWithdrawalRequest;