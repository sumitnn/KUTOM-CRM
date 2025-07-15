// features/withdrawal/AdminWithdrawalRequest.jsx
import React, { useState } from 'react';
import { useGetAdminWithdrawalsQuery, useUpdateWithdrawalMutation } from '../../features/topupApi';
import { format } from 'date-fns';

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
    } catch (error) {
      console.error('Failed to update status:', error);
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
    
    try {
      await updateWithdrawal({
        id: selectedWithdrawal.id,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).unwrap();
      setOpenDialog(false);
      setScreenshotFile(null);
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
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

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Withdrawal Requests</h2>
      <p className="text-sm text-gray-600 mb-6 font-bold">Manage and review all withdrawal requests</p>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:grid md:grid-cols-5 md:gap-4">
          <div className="md:col-span-1">
            <input
              type="text"
              className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="md:col-span-1">
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
          
          <div className="md:col-span-1">
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
          
          <div className="md:col-span-1">
            <input
              type="date"
              className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
          
          <div className="md:col-span-1 flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 cursor-pointer text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Payment Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Created Date</th>
                    <th className="px-6 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.results?.map((withdrawal,index) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{index +1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                              {withdrawal.user?.email || 'Unknown'}
                              <br/>
                        <strong>Role</strong> ({withdrawal.user?.role || 'Unknown'})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                        ₹{withdrawal.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                        {withdrawal.payment_method === 'upi' ? 'UPI' : 'Bank Transfer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${statusColors[withdrawal.status]}`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setOpenApproveConfirm(true);
                                }}
                                disabled={isProcessing}
                                className={`text-green-600 btn hover:text-green-900 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setOpenRejectModal(true);
                                }}
                                disabled={isProcessing}
                                className={`text-red-600 btn hover:text-red-900 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {['approved', 'pending'].includes(withdrawal.status) && (
  <button
    onClick={() => {
      setSelectedWithdrawal(withdrawal);
      setOpenDialog(true);
    }}
    disabled={isProcessing}
    className={`text-blue-600 btn hover:text-blue-900 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
     {withdrawal?.screenshot?"Uploaded (Update)":"Upload Transaction File"}
  </button>
)}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {data?.count > 0 && (
            <div className="mt-6 flex flex-col items-center">
              <div className="flex space-x-2">
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
              <p className="mt-2 text-sm text-gray-600">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, data.count)} of {data.count} withdrawals
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Upload Proof Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
                        Upload Screenshot(Pdf/Image)
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
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleUploadScreenshot}
                disabled={!screenshotFile || isProcessing}
                className={`w-full inline-flex cursor-pointer justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${!screenshotFile || isProcessing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isProcessing ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setOpenDialog(false)}
                disabled={isProcessing}
                className="mt-3 w-full inline-flex cursor-pointer justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {openApproveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => handleStatusChange(selectedWithdrawal.id, 'approved')}
                disabled={isProcessing}
                className={`w-full inline-flex cursor-pointer justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${isProcessing ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isProcessing ? 'Processing...' : 'Confirm Approve'}
              </button>
              <button
                type="button"
                onClick={() => setOpenApproveConfirm(false)}
                disabled={isProcessing}
                className="mt-3 w-full inline-flex cursor-pointer justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {openRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => handleStatusChange(selectedWithdrawal.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason || isProcessing}
                className={`w-full inline-flex cursor-pointer justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${!rejectionReason || isProcessing ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
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
                className="mt-3 w-full inline-flex cursor-pointer justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawalRequest;