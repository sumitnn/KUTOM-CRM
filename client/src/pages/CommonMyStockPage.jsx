import { useState, useEffect, lazy, Suspense } from "react";
import { FiPackage, FiCheckCircle, FiX, FiRefreshCw, FiCopy, FiCalendar, FiHash, FiUser, FiBox } from "react-icons/fi";
import { GrHistory } from "react-icons/gr";
import { useGetAdminStocksQuery, useGetStockHistoryQuery } from "../features/stocks/stocksApi";
import { toast } from "react-toastify";
import ModalPortal from "../components/ModalPortal";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const CommonMyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("in_stock"); 
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [copiedBatch, setCopiedBatch] = useState(null);
  
  const { data: response = {}, isLoading, isError, error, refetch } = useGetAdminStocksQuery({
    status: activeTab,
    page,
    pageSize
  });

  // Stock history query - only fetch when modal is open and stock is selected
  const { 
    data: historyData, 
    isLoading: isHistoryLoading, 
    isError: isHistoryError,
    refetch: refetchHistory 
  } = useGetStockHistoryQuery(selectedStock?.id, {
    skip: !selectedStock || !showHistoryModal
  });

  // Handle API response structure
  const stocks = Array.isArray(response) ? response : response.results || response.data || [];
  const totalCount = Array.isArray(response) ? response.length : response.count || response.total || 0;

  useEffect(() => {
    if (showHistoryModal && selectedStock) {
      refetchHistory();
    }
  }, [showHistoryModal, selectedStock, refetchHistory]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Stock data refreshed!");
  };

  const openHistoryModal = (stock) => {
    setSelectedStock(stock);
    setShowHistoryModal(true);
  };

  const handleCloseModal = () => {
    setShowHistoryModal(false);
    setSelectedStock(null);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedBatch(field);
    toast.success(`${field === 'batch' ? 'Batch number' : 'Product details'} copied to clipboard!`);
    setTimeout(() => setCopiedBatch(null), 2000);
  };

  // Improved responsive badge with better text handling
  const getStatusBadge = (stock) => {
    if (stock.total_quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
          <FiX className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Out of Stock</span>
        </span>
      );
    } else if (stock.total_quantity < 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
          <FiPackage className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Low Stock</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>In Stock</span>
        </span>
      );
    }
  };

  const getQuantityColor = (quantity) => {
    if (quantity === 0) return "text-red-600 font-bold";
    if (quantity < 10) return "text-amber-600 font-bold";
    return "text-emerald-600 font-bold";
  };

  // Responsive table headers with better mobile handling
  const renderTableHeaders = () => {
    return (
      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
        <th className="w-12 text-left py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">#</th>
        <th className="text-left py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">Product</th>
        <th className="hidden md:table-cell text-left py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">Batch</th>
        <th className="text-center py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">Qty</th>
        <th className="text-center py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">Status</th>
        <th className="hidden lg:table-cell text-center py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">Updated</th>
        <th className="text-center py-4 px-2 sm:px-4 font-bold text-gray-700 text-xs sm:text-sm">Actions</th>
      </tr>
    );
  };

  // Responsive table row with mobile optimizations
  const renderTableRow = (item, index) => {
    const productInfo = `${item.product_name}${item.variant_name && item.variant_name !== 'Default' ? ` - ${item.variant_name}` : ''}`;
    const categoryInfo = `${item.brand_name} • ${item.category_name}${item.subcategory_name && item.subcategory_name !== 'N/A' ? ` • ${item.subcategory_name}` : ''}`;

    return (
      <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
        <td className="py-4 px-2 sm:px-4 font-semibold text-gray-600 text-sm">
          {(page - 1) * pageSize + index + 1}
        </td>
        
        {/* Product Information Column - Optimized for mobile */}
        <td className="py-4 px-2 sm:px-4">
          <div className="flex flex-col space-y-1 min-w-0">
            <div className="flex items-start space-x-2">
              <FiBox className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 hidden sm:block" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                  {item.product_name}
                </h4>
                {item.variant_name && item.variant_name !== 'Default' && (
                  <p className="text-xs text-gray-600 truncate">Variant: {item.variant_name}</p>
                )}
                {/* Mobile-only batch info */}
                <div className="md:hidden mt-2 text-xs text-gray-500">
                  <span className="font-mono">Batch: {item.batch_number}</span>
                  <br />
                  <span>MFG: {new Date(item.manufacture_date).toLocaleDateString()}</span>
                  <br />
                  <span>EXP: {new Date(item.expiry_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </td>

        {/* Batch Details Column - Hidden on mobile/tablet */}
        <td className="hidden md:table-cell py-4 px-2 sm:px-4">
          <div className="flex flex-col space-y-2 text-sm">
            <div 
              className="flex items-center space-x-2 group cursor-pointer"
              onClick={() => copyToClipboard(item.batch_number, 'batch')}
            >
              <FiHash className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-mono text-gray-700 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">
                {item.batch_number}
              </span>
              <FiCopy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FiCalendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <div className="flex flex-col text-xs">
                <span>MFG: {new Date(item.manufacture_date).toLocaleDateString()}</span>
                <span>EXP: {new Date(item.expiry_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Quantity Column */}
        <td className="py-4 px-2 sm:px-4 text-center">
          <span className={`text-base sm:text-lg font-bold ${getQuantityColor(item.total_quantity)}`}>
            {item.total_quantity}
          </span>
        </td>

        {/* Status Column */}
        <td className="py-4 px-2 sm:px-4">
          <div className="flex justify-center">
            {getStatusBadge(item)}
          </div>
        </td>

        {/* Last Updated Column - Hidden on mobile/tablet */}
        <td className="hidden lg:table-cell py-4 px-2 sm:px-4 text-center text-xs sm:text-sm text-gray-600">
          {new Date(item.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </td>

        {/* Actions Column */}
        <td className="py-4 px-2 sm:px-4 text-center">
          <button 
            onClick={() => openHistoryModal(item)}
            className="btn btn-ghost btn-sm p-1.5 sm:p-2 font-semibold text-primary hover:bg-blue-100 hover:text-blue-700 transition-colors tooltip"
            data-tip="View Stock History"
          >
            <GrHistory className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </td>
      </tr>
    );
  };

  const renderTableContent = () => {
    if (isLoading) return (
      <tr>
        <td colSpan={7} className="text-center py-12">
          <Suspense fallback={<div>Loading...</div>}>
            <Spinner />
          </Suspense>
        </td>
      </tr>
    );

    if (isError) return (
      <tr>
        <td colSpan={7} className="text-center py-12">
          <Suspense fallback={<div>Error loading...</div>}>
            <ErrorMessage message={error?.data?.message || "Failed to load stocks"} />
          </Suspense>
        </td>
      </tr>
    );

    if (!stocks || stocks.length === 0) return (
      <tr>
        <td colSpan={7} className="text-center py-16">
          <div className="flex flex-col items-center justify-center gap-4 text-gray-500 px-4">
            <FiPackage className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                {activeTab === "in_stock" ? "No items in stock" : 
                 activeTab === "out_of_stock" ? "No out of stock items" : 
                 "No new stock items today"}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto">
                {activeTab === "in_stock" ? "Items that are currently in stock will appear here" : 
                 activeTab === "out_of_stock" ? "Items that are out of stock will appear here" : 
                 "New stock items added today will appear here"}
              </p>
            </div>
          </div>
        </td>
      </tr>
    );

    return stocks.map((item, index) => renderTableRow(item, index));
  };

  const renderHistoryModal = () => {
    if (!selectedStock || !showHistoryModal) return null;

    const historyItems = Array.isArray(historyData) ? historyData : [];
    const stockInfo = selectedStock;

    return (
      <ModalPortal>
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl p-0 overflow-hidden mx-4">
            {/* Modal Header - Responsive */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-2 truncate">
                    Stock History - {stockInfo.product_name}
                    {stockInfo.variant_name && stockInfo.variant_name !== 'Default' && (
                      <span className="text-gray-600"> ({stockInfo.variant_name})</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <FiHash className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="font-mono truncate max-w-[100px] sm:max-w-none">{stockInfo.batch_number}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Exp: {new Date(stockInfo.expiry_date).toLocaleDateString()}</span>
                    </div>
                    <div className={`text-sm sm:text-lg font-bold ${getQuantityColor(stockInfo.total_quantity)}`}>
                      Current: {stockInfo.total_quantity}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:text-gray-700 hover:bg-white flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stock Information Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-white border-b border-gray-100">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{stockInfo.product_name}</p>
                  {stockInfo.variant_name && stockInfo.variant_name !== 'Default' && (
                    <p className="text-xs text-gray-600 truncate">Variant: {stockInfo.variant_name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand & Category</p>
                  <p className="text-sm text-gray-800 truncate">{stockInfo.brand_name} • {stockInfo.category_name}</p>
                  {stockInfo.subcategory_name && stockInfo.subcategory_name !== 'N/A' && (
                    <p className="text-xs text-gray-600 truncate">{stockInfo.subcategory_name}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Batch Information</p>
                  <div className="flex items-center gap-2">
                    <FiHash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-mono text-sm text-gray-800 truncate">{stockInfo.batch_number}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manufactured</p>
                  <p className="text-sm text-gray-800">
                    {new Date(stockInfo.manufacture_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</p>
                  <p className="text-sm text-gray-800">
                    Created: {new Date(stockInfo.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-800">
                    Updated: {new Date(stockInfo.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry & Status</p>
                  <p className="text-sm text-gray-800">
                    Expires: {new Date(stockInfo.expiry_date).toLocaleDateString()}
                  </p>
                  <div className="mt-1">{getStatusBadge(stockInfo)}</div>
                </div>
              </div>
            </div>

            {/* History Table - Responsive with horizontal scroll */}
            <div className="p-4 sm:p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Stock Movement History</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200 -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  {isHistoryLoading ? (
                    <div className="text-center py-12">
                      <Suspense fallback={<div>Loading...</div>}>
                        <Spinner />
                      </Suspense>
                    </div>
                  ) : isHistoryError ? (
                    <div className="text-center py-12">
                      <Suspense fallback={<div>Error loading...</div>}>
                        <ErrorMessage message="Failed to load stock history" />
                      </Suspense>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Date & Time</th>
                          <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Action</th>
                          <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Previous</th>
                          <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Change</th>
                          <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">New</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {historyItems.length > 0 ? (
                          historyItems.map((history, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                {new Date(history.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 px-2 sm:px-4">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                  history.action === 'ADD' ? 'bg-emerald-50 text-emerald-700' :
                                  history.action === 'REMOVE' ? 'bg-red-50 text-red-700' :
                                  history.action === 'ORDER' ? 'bg-amber-50 text-amber-700' :
                                  history.action === 'RETURN' ? 'bg-blue-50 text-blue-700' : 
                                  'bg-gray-50 text-gray-700'
                                }`}>
                                  {history.action}
                                </span>
                              </td>
                              <td className="py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-medium text-gray-700">
                                {history.old_quantity}
                              </td>
                              <td className={`py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-bold ${
                                history.change_quantity > 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {history.change_quantity > 0 ? '+' : ''}{history.change_quantity}
                              </td>
                              <td className="py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-bold text-gray-800">
                                {history.new_quantity}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-500">
                              <div className="flex flex-col items-center justify-center gap-3 px-4">
                                <GrHistory className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
                                <h4 className="font-medium text-gray-600 text-sm sm:text-base">No history available</h4>
                                <p className="text-xs sm:text-sm">No stock history records found for this item.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-action p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={handleCloseModal} 
                className="btn btn-ghost hover:bg-white text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  };

  return (
    <div className="min-h-screen py-2 sm:py-4">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header - Responsive */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 truncate">Stock Inventory Management</h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
              Manage your stock inventory, track product movements, and monitor batch details in real-time.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={handleRefresh}
              className="btn btn-primary gap-1 sm:gap-2 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
              disabled={isLoading}
            >
              <FiRefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? "animate-spin" : ""}`} /> 
              <span className="hidden xs:inline">{isLoading ? "Refreshing..." : "Refresh Data"}</span>
              <span className="xs:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs - Responsive with horizontal scroll on mobile */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-1 sm:p-2 mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0">
            {[
              { key: "new_stock", label: "New Today", icon: FiPackage, color: "blue" },
              { key: "in_stock", label: "In Stock", icon: FiCheckCircle, color: "green" },
              { key: "out_of_stock", label: "Out of Stock", icon: FiX, color: "red" }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={`flex cursor-pointer items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.key 
                      ? `bg-${tab.color}-50 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm` 
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Container - Responsive with horizontal scroll */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  {renderTableHeaders()}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {renderTableContent()}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination - Responsive */}
          {totalCount > pageSize && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-t border-gray-200 gap-4 bg-gray-50">
              <div className="text-xs sm:text-sm text-gray-600 font-medium order-2 sm:order-1">
                Showing <span className="font-semibold text-gray-800">{(page - 1) * pageSize + 1}</span> -{' '}
                <span className="font-semibold text-gray-800">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                <span className="font-semibold text-gray-800">{totalCount}</span>
              </div>
              <div className="join shadow-sm order-1 sm:order-2">
                <button 
                  className="join-item btn btn-sm border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm px-3 sm:px-4" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  « Prev
                </button>
                <button className="join-item btn btn-sm bg-blue-500 text-white border-blue-500 font-medium text-xs sm:text-sm px-3 sm:px-4">
                  {page}
                </button>
                <button 
                  className="join-item btn btn-sm border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm px-3 sm:px-4" 
                  disabled={page * pageSize >= totalCount}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History Modal */}
        {renderHistoryModal()}
      </div>
    </div>
  );
};

export default CommonMyStockPage;