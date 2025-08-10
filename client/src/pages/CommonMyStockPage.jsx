import { useState, useEffect, lazy, Suspense } from "react";
import { FiPackage, FiCheckCircle, FiEdit, FiX, FiRefreshCw, FiEye } from "react-icons/fi";
import { useGetAdminStocksQuery } from "../features/stocks/stocksApi";
import { useGetProductCommissionQuery, useUpdateProductCommissionMutation } from "../features/commission/commissionApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const CommonMyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("in_stock"); 
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isUpdating, setisUpdating] = useState(false);
  
  const [updateCommission] = useUpdateProductCommissionMutation();
  
  // Form state
  const [formData, setFormData] = useState({
    price: '',
    resale_price: '',
    stockist_commission: '',
    reseller_commission: ''
  });

  const { data: response = {}, isLoading, isError, error, refetch } = useGetAdminStocksQuery({
    status: activeTab,
    page,
    pageSize
  });

  // Fetch commission data when a stock is selected
  const { data: commissionData } = useGetProductCommissionQuery(selectedStock?.id, {
    skip: !selectedStock
  });

  const stocks = response.results || [];
  const totalCount = response.count || 0;
  const navigate = useNavigate();

  useEffect(() => {
    if (showEditModal && selectedStock) {
      setFormData({
        price: selectedStock.price,
        resale_price: selectedStock.resale_price,
        stockist_commission: commissionData?.stockist_commission || '',
        reseller_commission: commissionData?.reseller_commission || ''
      });
    }
  }, [showEditModal, selectedStock, commissionData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Stock data refreshed!");
  };

  const openEditModal = (stock) => {
    setSelectedStock(stock);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedStock(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        
        setisUpdating(true);
      // Update commissions if they exist in the form
      if (formData.stockist_commission || formData.reseller_commission) {
        await updateCommission({
          productId: selectedStock.id,
          stockist_commission_value: formData.stockist_commission,
          reseller_commission_value: formData.reseller_commission
        }).unwrap();
      }

        toast.success("Stock and commissions updated successfully!");
        setisUpdating(false);
        refetch();
        
      handleCloseModal();
    } catch (err) {
        toast.error(err?.data?.detail || "Failed to update commision");
         setisUpdating(false);
    }
  };

  const renderTableHeaders = () => {
    return (
      <tr className="font-bold text-black">
        <th className="w-12">No.</th>
        <th>{activeTab === "in_stock" ? "Created" : "Updated"} Date</th>
        <th>SKU</th>
        <th>Product Name</th>
        <th>Price</th>
        <th>Resale Price</th>
        {(role === 'admin' || role === 'stockist') && <th>Stockist Commission</th>}
        {(role === 'admin' || role === 'reseller') && <th>Reseller Commission</th>}
        <th className="text-center">Available Qty</th>
        <th>Status</th>
        <th className="text-center">Actions</th>
      </tr>
    );
  };

  const renderTableRow = (item, index) => {
    const dateField = activeTab === "in_stock" ? item.created_at : item.updated_at;
    
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
        <td>{item.sku}</td>
        <td className="whitespace-nowrap">{item.name}</td>
        <td>₹{item.price}</td>
        <td>₹{item.resale_price}</td>
        {(role === 'admin' || role === 'stockist') && (
          <td>₹{item?.stockist_commission_value || '0'}</td>
        )}
        {(role === 'admin' || role === 'reseller') && (
          <td>₹{item?.reseller_commission_value || '0'}</td>
        )}
        <td className="text-center">{item.quantity_available}</td>
        <td>
          <span className={`badge ${item.stock_status === 'in_stock' ? 'badge-success' : 'badge-error'}`}>
            {item.stock_status.replace('_', ' ')}
          </span>
        </td>
        <td className="flex gap-2 justify-center">
          <button 
            onClick={() => navigate(`/view/product/${item.id}/`)}
            className="btn btn-ghost btn-xs font-bold tooltip"
            data-tip="View Product"
          >
            <FiEye />
          </button>
          <button 
            onClick={() => openEditModal(item)}
            className="btn btn-ghost btn-xs font-bold tooltip"
            data-tip="Edit Price"
          >
            <FiEdit />
          </button>
        </td>
      </tr>
    );
  };

  const renderTableContent = () => {
    if (isLoading) return (
      <tr>
        <td colSpan={9 + (role === 'admin' ? 2 : role === 'stockist' || role === 'reseller' ? 1 : 0)} className="text-center py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <Spinner />
          </Suspense>
        </td>
      </tr>
    );

    if (isError) return (
      <tr>
        <td colSpan={9 + (role === 'admin' ? 2 : role === 'stockist' || role === 'reseller' ? 1 : 0)} className="text-center py-8">
          <Suspense fallback={<div>Error loading...</div>}>
            <ErrorMessage message={error?.data?.message || "Failed to load stocks"} />
          </Suspense>
        </td>
      </tr>
    );

    if (!stocks || stocks.length === 0) return (
      <tr>
        <td colSpan={9 + (role === 'admin' ? 2 : role === 'stockist' || role === 'reseller' ? 1 : 0)} className="text-center py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <FiPackage className="w-12 h-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700">
              {activeTab === "in_stock" ? "No items in stock" : "No out of stock items"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "in_stock" ? "Your in-stock items will appear here" : "Your out of stock items will appear here"}
            </p>
          </div>
        </td>
      </tr>
    );

    return stocks.map((item, index) => renderTableRow(item, index));
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Management</h1>
          <p className="text-sm text-gray-500">Manage your stock inventory</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="btn btn-ghost gap-2"
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
        {stocks.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 gap-4">
            <div className="text-sm text-gray-500 font-bold">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{(page - 1) * pageSize + stocks.length}</span> of{' '}
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
                disabled={stocks.length < pageSize}
                onClick={() => setPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedStock && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button 
              onClick={handleCloseModal}
              className="btn btn-sm btn-circle absolute right-2 top-2"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">Update Pricing for {selectedStock.name}</h3>
            
            <div className="mb-4">
              <p className="text-sm"><span className="font-bold">SKU:</span> {selectedStock.sku}</p>
              <p className="text-sm"><span className="font-bold">Current Price:</span> ₹{selectedStock.price}</p>
              <p className="text-sm"><span className="font-bold">Current Resale Price:</span> ₹{selectedStock.resale_price}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Actual Price</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Resale Price</span>
                  </label>
                  <input
                    type="number"
                    name="resale_price"
                    value={formData.resale_price}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    min="1"
                    required
                  />
                </div>
                
                {(role === 'admin' || role === 'stockist') && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">Stockist Commission</span>
                    </label>
                    <input
                      type="number"
                      name="stockist_commission"
                      value={formData.stockist_commission}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      min="0"
                    />
                  </div>
                )}
                
                {(role === 'admin' || role === 'reseller') && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">Reseller Commission</span>
                    </label>
                    <input
                      type="number"
                      name="reseller_commission"
                      value={formData.reseller_commission}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      min="0"
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? <span className="loading loading-spinner"></span> : 'Update'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonMyStockPage;