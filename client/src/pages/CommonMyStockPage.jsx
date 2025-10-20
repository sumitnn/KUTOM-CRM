import { useState, useEffect, lazy, Suspense } from "react";
import { FiPackage, FiCheckCircle, FiX, FiRefreshCw } from "react-icons/fi";
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

  const renderTableHeaders = () => {
    return (
      <tr className="font-bold text-black">
        <th className="w-12">No.</th>
        <th>Date</th>
        <th>Product Name</th>
        <th>Variant</th>
        <th>Brand</th>
        <th>Category</th>
        <th>Subcategory</th>
        <th className="text-center">Available Quantity</th>
       
        <th className="text-center">Actions</th>
      </tr>
    );
  };

  const renderTableRow = (item, index) => {
    const dateField =  item.created_at ;
    
    return (
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="font-bold">{(page - 1) * pageSize + index + 1}</td>
        <td>
          {new Date(dateField).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </td>
        <td className="whitespace-nowrap">{item.product_name}</td>
        <td>{item.variant_name || 'Default'}</td>
        <td>{item.brand_name}</td>
        <td>{item.category_name}</td>
        <td>{item.subcategory_name || 'N/A'}</td>
        <td className="text-center font-bold">{item.total_quantity}</td>
        
        <td className="text-center">
          <button 
            onClick={() => openHistoryModal(item)}
            className="btn btn-ghost btn-xs font-bold tooltip text-primary"
            data-tip="View History"
          >
            <GrHistory className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  const renderTableContent = () => {
    if (isLoading) return (
      <tr>
        <td colSpan={10} className="text-center py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <Spinner />
          </Suspense>
        </td>
      </tr>
    );

    if (isError) return (
      <tr>
        <td colSpan={10} className="text-center py-8">
          <Suspense fallback={<div>Error loading...</div>}>
            <ErrorMessage message={error?.data?.message || "Failed to load stocks"} />
          </Suspense>
        </td>
      </tr>
    );

    if (!stocks || stocks.length === 0) return (
      <tr>
        <td colSpan={10} className="text-center py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <FiPackage className="w-12 h-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700">
              {activeTab === "in_stock" ? "No items in stock" : 
               activeTab === "out_of_stock" ? "No out of stock items" : 
               "No new stock items today"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "in_stock" ? "Your in-stock items will appear here" : 
               activeTab === "out_of_stock" ? "Your out of stock items will appear here" : 
               "New stock items added today will appear here"}
            </p>
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
        <div className="modal-box max-w-6xl">
          <button 
            onClick={handleCloseModal}
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >
            ✕
          </button>
          <h3 className="font-bold text-lg mb-4">
            Stock History - {stockInfo.product_name}
            {stockInfo.variant_name && ` (${stockInfo.variant_name})`}
          </h3>
          
          {/* Stock Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-bold text-gray-600">Product Name</p>
              <p className="text-sm font-medium">{stockInfo.product_name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Current Quantity</p>
              <p className="text-sm font-bold">{stockInfo.total_quantity}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Brand</p>
              <p className="text-sm">{stockInfo.brand_name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Category</p>
              <p className="text-sm">{stockInfo.category_name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Subcategory</p>
              <p className="text-sm">{stockInfo.subcategory_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Variant</p>
              <p className="text-sm">{stockInfo.variant_name || 'Default'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Created</p>
              <p className="text-sm">
                {new Date(stockInfo.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">Last Updated</p>
              <p className="text-sm">
                {new Date(stockInfo.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {/* History Table */}
          <div className="overflow-x-auto">
            {isHistoryLoading ? (
              <div className="text-center py-8">
                <Suspense fallback={<div>Loading...</div>}>
                  <Spinner />
                </Suspense>
              </div>
            ) : isHistoryError ? (
              <div className="text-center py-8">
                <Suspense fallback={<div>Error loading...</div>}>
                  <ErrorMessage message="Failed to load stock history" />
                </Suspense>
              </div>
            ) : (
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Action</th>
                    <th>Previous Qty</th>
                    <th>Change</th>
                    <th>New Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.length > 0 ? (
                    historyItems.map((history, index) => (
                      <tr key={index}>
                        <td>
                          {new Date(history.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <span className={`badge ${
                            history.action === 'ADD' ? 'badge-success' :
                            history.action === 'REMOVE' ? 'badge-error' :
                            history.action === 'ORDER' ? 'badge-warning' :
                            history.action === 'RETURN' ? 'badge-info' : 'badge-neutral'
                          }`}>
                            {history.action}
                          </span>
                        </td>
                        <td className="font-medium">{history.old_quantity}</td>
                        <td className={`font-bold ${history.change_quantity > 0 ? 'text-success' : 'text-error'}`}>
                          {history.change_quantity > 0 ? '+' : ''}{history.change_quantity}
                        </td>
                        <td className="font-bold">{history.new_quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <GrHistory className="w-12 h-12 text-gray-300" />
                          <h4 className="font-medium">No history available</h4>
                          <p className="text-sm">No stock history records found for this item.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Actions */}
          <div className="modal-action">
            <button onClick={handleCloseModal} className="btn btn-ghost">Close</button>
          </div>
        </div>
      </div></ModalPortal>
    );
  };

  return (
    <div className=" py-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Inventory Management</h1>
          <p className="text-sm text-gray-500">Manage your stock inventory and track history</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="btn btn-primary gap-2"
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} /> 
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={`tab ${activeTab === "new_stock" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("new_stock")}
        >
          <FiPackage className="mr-2" />
          New Today
        </button>
        <button
          className={`tab ${activeTab === "in_stock" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("in_stock")}
        >
          <FiCheckCircle className="mr-2" />
          In Stock
        </button>
        <button
          className={`tab ${activeTab === "out_of_stock" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("out_of_stock")}
        >
          <FiX className="mr-2" />
          Out of Stock
        </button>
        
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              {renderTableHeaders()}
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
            <div className="text-sm text-gray-500 font-bold">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
              <span className="font-medium">{totalCount}</span> entries
            </div>
            <div className="join">
              <button 
                className="join-item btn btn-sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                «
              </button>
              <button className="join-item btn btn-sm btn-active">{page}</button>
              <button 
                className="join-item btn btn-sm" 
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {renderHistoryModal()}
    </div>
  );
};

export default CommonMyStockPage;