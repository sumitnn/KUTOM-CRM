import React, { useState } from 'react';
import { useGetAdminWithdrawalsQuery, useUpdateWithdrawalMutation } from '../../features/topupApi';
import { format } from 'date-fns';
import ModalPortal from '../../components/ModalPortal';
import { toast } from 'react-toastify';
import { FiSearch, FiFilter, FiX, FiEye, FiCheck, FiXCircle, FiUpload, FiChevronDown, FiChevronUp, FiDollarSign, FiCreditCard, FiUser, FiMapPin } from 'react-icons/fi';

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
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  approved: 'bg-green-100 text-green-800 border border-green-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
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
  const [transactionId, setTransactionId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
      const updateData = reason ? { status: newStatus, rejected_reason: reason } : { status: newStatus };
      if (newStatus === 'approved' && transactionId) {
        updateData.transaction_id = transactionId;
      }
      
      await updateWithdrawal({ 
        id, 
        data: updateData 
      }).unwrap();
      toast.success("Updated Record Successfully");
      setTransactionId('');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error?.data?.message || "Failed to update withdrawal");
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
    setShowFilters(false);
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
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCreditCard className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">UPI ID</div>
              <div className="text-lg font-bold text-gray-900 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                {payment_details?.upi_id || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (payment_method === 'bank') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Account Holder</div>
              <div className="text-lg font-bold text-gray-900 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                {payment_details?.account_holder_name || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-600">Bank Name</div>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                {payment_details?.bank_name || 'N/A'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-600">Account Number</div>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 font-mono">
                {payment_details?.account_number || 'N/A'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-600">IFSC Code</div>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 font-mono">
                {payment_details?.ifsc_code || 'N/A'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-600">Branch</div>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                {payment_details?.branch_name || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return <span className="text-gray-500 text-sm">No payment details available</span>;
  };

  const renderPaymentDetailsModal = (withdrawal) => {
    const { payment_method, payment_details } = withdrawal;
    
    if (payment_method === 'upi') {
      return (
        <div className="bg-green-50 p-4 rounded-2xl border border-green-200 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCreditCard className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">UPI Transfer Details</h4>
              <p className="text-sm text-gray-600">Payment will be sent via UPI</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-green-200">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 mb-1">UPI ID</div>
              <div className="text-xl font-bold text-gray-900 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                {payment_details?.upi_id || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (payment_method === 'bank') {
      return (
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Bank Transfer Details</h4>
              <p className="text-sm text-gray-600">Payment will be sent via Bank Transfer</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-200">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Account Holder</div>
                  <div className="text-lg font-bold text-gray-900">
                    {payment_details?.account_holder_name || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bank Name</div>
                  <div className="text-base font-medium text-gray-900">
                    {payment_details?.bank_name || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-blue-200">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Account Number</div>
                  <div className="text-lg font-bold text-gray-900 font-mono">
                    {payment_details?.account_number || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">IFSC Code</div>
                  <div className="text-base font-medium text-gray-900 font-mono">
                    {payment_details?.ifsc_code || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            {payment_details?.branch_name && (
              <div className="md:col-span-2 bg-white p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <FiMapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Branch</div>
                    <div className="text-base font-medium text-gray-900">
                      {payment_details.branch_name}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 mb-4">
        <div className="text-center">
          <div className="text-sm font-semibold text-yellow-700">No payment details available</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-8xl mx-auto ">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Withdrawal Requests
              </h1>
              <p className="text-gray-600 font-medium mt-2 text-lg">
                Manage and review all withdrawal requests
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="relative flex-1 lg:max-w-md">
              <div className="relative flex rounded-2xl shadow-sm bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="Search by user, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearch(e)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 cursor-pointer top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex cursor-pointer items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-semibold shadow-sm"
              >
                <FiFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
              </button>
              
              <button
                onClick={handleSearch}
                className="px-4 sm:px-6 py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <FiSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-4 cursor-pointer py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <select
                  className="w-full px-4 cursor-pointer py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
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
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  className="w-full cursor-pointer px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  className="w-full px-4 cursor-pointer py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3">
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition-all duration-200 hover:shadow-md"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Results Section */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : isError ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-3xl text-center">
            <p className="font-semibold">Error loading withdrawals</p>
            <p className="text-sm mt-1">Please try again later</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Request</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">User Details</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Date</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Transaction ID</th>
                      <th className="px-4 sm:px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data?.results?.map((withdrawal, index) => (
                      <React.Fragment key={withdrawal.id}>
                        <tr 
                          className="hover:bg-gray-50 transition-colors duration-150 group cursor-pointer"
                          onClick={() => toggleRowExpansion(withdrawal.id)}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-sm font-bold text-gray-900">#{withdrawal.id}</div>
                                <div className="lg:hidden text-xs text-gray-500 mt-1">
                                  {withdrawal.payment_method_display}
                                </div>
                                <div className="md:hidden mt-1">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-bold rounded-full ${statusColors[withdrawal.status]}`}>
                                    {withdrawal.status}
                                  </span>
                                </div>
                                <div className="xl:hidden text-xs text-gray-500 mt-1">
                                  {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-bold text-gray-900">
                              {withdrawal.user?.username || withdrawal.user?.email || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {withdrawal.user?.email}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {withdrawal.user?.vendor_id && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  Vendor : {withdrawal.user.vendor_id}
                                </span>
                              )}
                              {withdrawal.user?.stockist_id && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Stockist : {withdrawal.user.stockist_id}
                                </span>
                              )}
                              {withdrawal.user?.reseller_id && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  Reseller : {withdrawal.user.reseller_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-gray-900">
                              ₹{withdrawal.amount}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold hidden lg:table-cell">
                            {withdrawal.payment_method_display}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${statusColors[withdrawal.status]}`}>
                              {withdrawal.status}
                            </span>
                            {withdrawal.status === 'rejected' && withdrawal.rejected_reason && (
                              <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                                {withdrawal.rejected_reason}
                              </div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold hidden xl:table-cell">
                            {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold hidden xl:table-cell">
                            {withdrawal.transaction_id}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {withdrawal.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWithdrawal(withdrawal);
                                      setOpenApproveConfirm(true);
                                    }}
                                    disabled={isProcessing}
                                    className="inline-flex cursor-pointer items-center gap-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs"
                                  >
                                    <FiCheck className="h-3 w-3" />
                                    <span className="hidden sm:inline">Approve</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWithdrawal(withdrawal);
                                      setOpenRejectModal(true);
                                    }}
                                    disabled={isProcessing}
                                    className="inline-flex cursor-pointer items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs"
                                  >
                                    <FiXCircle className="h-3 w-3" />
                                    <span className="hidden sm:inline">Reject</span>
                                  </button>
                                </div>
                              )}
                              <div className="flex gap-1">
                                {['approved', 'pending'].includes(withdrawal.status) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWithdrawal(withdrawal);
                                      setOpenDialog(true);
                                    }}
                                    disabled={isProcessing}
                                    className="inline-flex cursor-pointer items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs"
                                  >
                                    <FiUpload className="h-3 w-3" />
                                    <span className="hidden sm:inline">{withdrawal?.screenshot ? "Update" : "Proof"}</span>
                                  </button>
                                )}
                                {withdrawal.screenshot && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openScreenshotModal(withdrawal.screenshot);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs"
                                  >
                                    <FiEye className="h-3 w-3" />
                                    <span className="hidden sm:inline">View</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        {expandedRow === withdrawal.id && (
                          <tr className="bg-blue-50">
                            <td colSpan="8" className="px-4 sm:px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <div className="bg-white p-4 rounded-2xl border border-blue-200">
                                  <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                    <FiDollarSign className="h-4 w-4 text-blue-600" />
                                    Payment Details
                                  </h4>
                                  {renderPaymentDetails(withdrawal)}
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-blue-200">
                                  <h4 className="font-bold text-sm text-gray-700 mb-3">Wallet Information</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-600">Current Balance:</span>
                                      <span className="text-sm font-bold text-gray-900">₹{withdrawal.wallet?.current_balance || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-600">Payout Balance:</span>
                                      <span className="text-sm font-bold text-gray-900">₹{withdrawal.wallet?.payout_balance || '0.00'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-blue-200">
                                  <h4 className="font-bold text-sm text-gray-700 mb-3">Request Information</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-600">Request ID:</span>
                                      <span className="text-sm font-bold text-gray-900">#{withdrawal.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-600">Date:</span>
                                      <span className="text-sm font-bold text-gray-900">{format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}</span>
                                    </div>
                                    {withdrawal.approved_by && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-600">Approved By:</span>
                                        <span className="text-sm font-bold text-gray-900">{withdrawal.approved_by?.username || 'N/A'}</span>
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
              
              {(!data?.results || data.results.length === 0) && (
                <div className="text-center py-12">
                  <FiDollarSign className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No withdrawal requests found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter || paymentMethodFilter || dateFrom || dateTo 
                      ? 'Try adjusting your filters' 
                      : 'No withdrawal requests available at the moment'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {data?.count > 0 && (
              <div className="mt-8 flex flex-col items-center">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: Math.ceil(data.count / 10) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        page === i + 1 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, data.count)} of {data.count} withdrawals
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Upload Proof Modal */}
        {openDialog && (
  <ModalPortal>
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative mx-4">
        <button
          onClick={() => {
            setOpenDialog(false);
            setScreenshotFile(null);
          }}
          className="absolute cursor-pointer top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <FiX className="h-6 w-6" />
        </button>
        
        <div className="text-center mb-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upload Payment Proof
          </h3>
          <p className="text-gray-600 mt-2">Add payment confirmation screenshot</p>
        </div>

        <div className="mt-6 space-y-4">
          {selectedWithdrawal && (
            <>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Withdrawal ID:</span>
                  <span className="text-sm font-bold text-gray-900">#{selectedWithdrawal.id}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-semibold text-gray-700">Amount:</span>
                  <span className="text-lg font-bold text-green-600">₹{selectedWithdrawal.amount}</span>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Upload Screenshot (PDF/Image)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors duration-200 relative">
                  <FiUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setScreenshotFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {screenshotFile && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Selected: {screenshotFile.name}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => {
              setOpenDialog(false);
              setScreenshotFile(null);
            }}
            disabled={isProcessing}
            className="px-6 py-3 cursor-pointer border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadScreenshot}
            disabled={!screenshotFile || isProcessing}
            className={`px-6 py-3 cursor-pointer text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              !screenshotFile || isProcessing
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <FiUpload className="h-4 w-4" />
                Upload Proof
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
)}

        {/* Approve Confirmation Modal with Bank Details */}
        {openApproveConfirm && (
          <ModalPortal>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative mx-4">
                <button
                  onClick={() => {
                    setOpenApproveConfirm(false);
                    setTransactionId('');
                  }}
                  className="absolute  cursor-pointer top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
                
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Confirm Approval</h3>
                  <p className="text-gray-600 mt-2">Approve this withdrawal request</p>
                </div>

                <div className="mt-6 space-y-6">
                  {selectedWithdrawal && (
                    <>
                      {/* Payment Details */}
                      {renderPaymentDetailsModal(selectedWithdrawal)}
                      
                      {/* Request Summary */}
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-700">Withdrawal ID</div>
                            <div className="text-lg font-bold text-gray-900">#{selectedWithdrawal.id}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-700">Amount</div>
                            <div className="text-2xl font-bold text-green-600">₹{selectedWithdrawal.amount}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-700">User</div>
                            <div className="text-lg font-bold text-gray-900">{selectedWithdrawal.user?.username}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Transaction ID Input */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Transaction ID (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                          placeholder="Enter transaction reference ID..."
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Optional: Add transaction reference for tracking
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => {
                      setOpenApproveConfirm(false);
                      setTransactionId('');
                    }}
                    disabled={isProcessing}
                    className="px-6 py-3 cursor-pointer border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedWithdrawal.id, 'approved')}
                    disabled={isProcessing}
                    className={`px-6 py-3 cursor-pointer text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      isProcessing
                        ? 'bg-green-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheck className="h-4 w-4" />
                        Confirm Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Reject Reason Modal with Bank Details */}
        {openRejectModal && (
          <ModalPortal>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative mx-4">
                <button
                  onClick={() => {
                    setOpenRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="absolute cursor-pointer top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
                
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiXCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Reject Withdrawal</h3>
                  <p className="text-gray-600 mt-2">Provide reason for rejection</p>
                </div>

                <div className="mt-6 space-y-6">
                  {selectedWithdrawal && (
                    <>
                      {/* Payment Details */}
                      {renderPaymentDetailsModal(selectedWithdrawal)}
                      
                      {/* Request Summary */}
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-700">Withdrawal ID</div>
                            <div className="text-lg font-bold text-gray-900">#{selectedWithdrawal.id}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-700">Amount</div>
                            <div className="text-2xl font-bold text-red-600">₹{selectedWithdrawal.amount}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-700">User</div>
                            <div className="text-lg font-bold text-gray-900">{selectedWithdrawal.user?.username}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rejection Reason */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Reason for Rejection *
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white resize-none"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter detailed reason for rejecting this withdrawal request..."
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => {
                      setOpenRejectModal(false);
                      setRejectionReason('');
                    }}
                    disabled={isProcessing}
                    className="px-6 py-3  cursor-pointer border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedWithdrawal.id, 'rejected', rejectionReason)}
                    disabled={!rejectionReason || isProcessing}
                    className={`px-6 py-3 cursor-pointer text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      !rejectionReason || isProcessing
                        ? 'bg-red-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiXCircle className="h-4 w-4" />
                        Confirm Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Screenshot Preview Modal */}
        {screenshotModal && (
          <ModalPortal>
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4">
                <div className="p-6 flex justify-between items-center border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Payment Screenshot</h3>
                  <button
                    onClick={() => setScreenshotModal(false)}
                    className="text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-auto flex justify-center">
                  {selectedScreenshot && (
                    <img
                      src={selectedScreenshot}
                      alt="Payment Screenshot"
                      className="max-w-full h-auto rounded-2xl border-2 border-gray-200 shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawalRequest;