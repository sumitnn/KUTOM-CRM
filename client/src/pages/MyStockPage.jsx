import { useState, useEffect, lazy, Suspense } from "react";
import { 
  FiPackage, FiCheckCircle, FiPlus, FiEdit, FiX, 
  FiRefreshCw, FiBox, FiTrendingUp, FiTrendingDown, 
  FiInfo, FiLayers, FiCalendar, FiHash 
} from "react-icons/fi";
import { FaHistory } from "react-icons/fa";
import { useGetStocksQuery, useCreateStockMutation, useUpdateStockMutation, useGetStockHistoryQuery } from "../features/stocks/stocksApi";
import { useGetVendorActiveProductsQuery, useGetProductSizesQuery } from "../features/product/productApi";
import { toast } from "react-toastify";
import ModalPortal from "../components/ModalPortal";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const MyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("new_stock"); 
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    product: '',
    variant: '',
    total_quantity: '',
    status: 'in_stock',
    notes: '',
    batch_number: '',
    manufacture_date: '',
    expiry_date: ''
  });

  const { data: stocks = [], isLoading, isError, error, refetch } = useGetStocksQuery({
    status: activeTab,
    page,
    pageSize
  });

  // Get stock history only when modal is open and stock is selected
  const { data: stockHistory = [], isLoading: isHistoryLoading } = useGetStockHistoryQuery(
    selectedStock?.id, 
    {
      skip: !showHistoryModal || !selectedStock?.id
    }
  );

  // Get active products for dropdown
  const { data: activeProducts } = useGetVendorActiveProductsQuery();
  
  // Get product sizes when product is selected
  const { data: productSizes } = useGetProductSizesQuery(selectedProductId, {
    skip: !selectedProductId
  });

  const [createStock] = useCreateStockMutation();
  const [updateStock] = useUpdateStockMutation();

  useEffect(() => {
    if (showEditForm && selectedStock) {
      setSelectedProductId(selectedStock.product);
      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setFormData({
        product: selectedStock.product,
        variant: selectedStock.variant,
        total_quantity: selectedStock.total_quantity,
        status: selectedStock.status,
        notes: selectedStock.notes || '',
        batch_number: selectedStock.batch_number || '',
        manufacture_date: formatDateForInput(selectedStock.manufacture_date),
        expiry_date: formatDateForInput(selectedStock.expiry_date)
      });
    }
  }, [showEditForm, selectedStock]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Stock data refreshed!");
  };

  const openCreateForm = () => {
    setFormData({
      product: '',
      variant: '',
      total_quantity: '',
      status: 'in_stock',
      notes: '',
      batch_number: '',
      manufacture_date: '',
      expiry_date: ''
    });
    setSelectedProductId(null);
    setShowCreateForm(true);
  };

  const openEditForm = (stock) => {
    setSelectedStock(stock);
    setShowEditForm(true);
  };

  const openHistoryModal = (stock) => {
    setSelectedStock(stock);
    setShowHistoryModal(true);
  };

  const closeForm = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedStock(null);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedStock(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    setFormData(prev => ({
      ...prev,
      product: productId,
      variant: '' // Reset size when product changes
    }));
  };

  const handleSubmit = async (e) => {
    setIsDisabled(true);
    e.preventDefault();
    
    // Validate dates
    if (formData.manufacture_date && formData.expiry_date) {
      const manufactureDate = new Date(formData.manufacture_date);
      const expiryDate = new Date(formData.expiry_date);
      
      if (expiryDate <= manufactureDate) {
        toast.error("Expiry date must be after manufacture date");
        setIsDisabled(false);
        return;
      }
    }
    
    try {
      const payload = {
        ...formData,
        product: selectedProductId,
      };

      if (showEditForm) {
        await updateStock({ 
          id: selectedStock.id, 
          ...payload
        }).unwrap();
        toast.success("Stock updated successfully!");
      } else {
        await createStock(payload).unwrap();
        toast.success("Stock created successfully!");
      }
      refetch();
      closeForm();
    } catch (err) {
      console.error('Error saving stock:', err);
      toast.error(err.data?.message || "Stock already exists for this product-size combination. Please update instead.");
    } finally {
      setIsDisabled(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'ADD': return <FiTrendingUp className="text-green-500 font-extrabold" />;
      case 'UPDATE': return <FiEdit className="text-blue-500 font-extrabold" />;
      case 'SELL': return <FiTrendingDown className="text-red-500 font-extrabold" />;
      default: return <FiInfo className="text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'ADD': return "bg-green-100 text-green-800";
      case 'UPDATE': return "bg-blue-100 text-blue-800";
      case 'SELL': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "new_stock":
        return (
          <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">No.</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">Date</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">Product Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">Variant</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">Batch Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">Stock Details</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-700">Actions</th>
          </tr>
        );
      case "in_stock":
        return (
          <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">No.</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">Last Updated</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">Product Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">Variant</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">Batch Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">Available Stock</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700">Actions</th>
          </tr>
        );
      case "out_of_stock":
        return (
          <tr className="bg-gradient-to-r from-red-50 to-orange-50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">No.</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Stock Out Date</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Product Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Category</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Batch Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Last Stock</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Actions</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderBatchInfo = (item) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FiHash className="w-3 h-3 text-gray-400" />
        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
          {item.batch_number || 'N/A'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <FiCalendar className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-600">
          Mfg: {formatDateDisplay(item.manufacture_date)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <FiCalendar className={`w-3 h-3 ${isExpired(item.expiry_date) ? 'text-red-400' : 'text-gray-400'}`} />
        <span className={`text-xs ${isExpired(item.expiry_date) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
          Exp: {formatDateDisplay(item.expiry_date)}
          {isExpired(item.expiry_date) && ' (Expired)'}
        </span>
      </div>
    </div>
  );

  const renderTableRow = (item, index) => {
    const productInfo = (
      <div className="space-y-1">
        <div className="font-semibold text-gray-900">{item.product_name}</div>
        <div className="text-xs text-gray-500"><h2>Brand:</h2> {item.brand_name}</div>
        <div className="text-xs text-gray-500"><h2>Category:</h2> {item.category_name}</div>
      </div>
    );

    const categoryInfo = (
      <div className="space-y-1">
        <div className="text-sm font-medium">{item.category_name}</div>
        <div className="text-xs text-gray-500">{item.subcategory_name}</div>
      </div>
    );

    switch (activeTab) {
      case "new_stock":
        return (
          <tr key={item.id} className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors group">
            <td className="px-6 py-4 font-medium text-gray-900">{(page - 1) * pageSize + index + 1}</td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-700">
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
                <div className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </div>
            </td>
            <td className="px-6 py-4">{productInfo}</td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {item.variant_name}
              </span>
            </td>
            <td className="px-6 py-4">
              {renderBatchInfo(item)}
            </td>
            <td className="px-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Old:</span>
                  <span className="text-sm font-medium">{item.last_history?.old_quantity || 0}</span>
                  <span className="text-xs text-gray-500">New:</span>
                  <span className="text-sm font-medium text-green-600">+{item.last_history?.change_quantity || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Total:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 font-bold">
                    <FiBox className="mr-1" /> {item.total_quantity}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditForm(item)}
                  className="inline-flex items-center px-3 cursor-pointer py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <FiEdit className="mr-1" /> Edit
                </button>
                <button 
                  onClick={() => openHistoryModal(item)}
                  className="inline-flex items-center cursor-pointer px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FaHistory className="mr-1" /> History
                </button>
              </div>
            </td>
          </tr>
        );
      case "in_stock":
        return (
          <tr key={item.id} className="border-b border-gray-100 hover:bg-green-50/30 transition-colors group">
            <td className="px-6 py-4 font-medium text-gray-900">{(page - 1) * pageSize + index + 1}</td>
            <td className="px-6 py-4 text-sm text-gray-700">
              {new Date(item.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </td>
            <td className="px-6 py-4">{productInfo}</td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {item.variant_name}
              </span>
            </td>
            <td className="px-6 py-4">
              {renderBatchInfo(item)}
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm">
                <FiBox className="mr-2" /> {item.total_quantity} units
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditForm(item)}
                  className="inline-flex items-center cursor-pointer px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                >
                  <FiEdit className="mr-1" /> Update
                </button>
                <button 
                  onClick={() => openHistoryModal(item)}
                  className="inline-flex items-center cursor-pointer px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FaHistory className="mr-1" /> History
                </button>
              </div>
            </td>
          </tr>
        );
      case "out_of_stock":
        return (
          <tr key={item.id} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors group">
            <td className="px-6 py-4 font-medium text-gray-900">{(page - 1) * pageSize + index + 1}</td>
            <td className="px-6 py-4 text-sm text-gray-700">
              {new Date(item.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </td>
            <td className="px-6 py-4">{productInfo}</td>
            <td className="px-6 py-4">{categoryInfo}</td>
            <td className="px-6 py-4">
              {renderBatchInfo(item)}
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800">
                <FiTrendingDown className="mr-2" /> Out of Stock
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditForm(item)}
                  className="inline-flex items-center cursor-pointer px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                >
                  <FiPlus className="mr-1" /> Restock
                </button>
                <button 
                  onClick={() => openHistoryModal(item)}
                  className="inline-flex items-center cursor-pointer px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FaHistory className="mr-1" /> History
                </button>
              </div>
            </td>
          </tr>
        );
      default:
        return null;
    }
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
        <td colSpan={7} className="text-center py-12">
          <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
            <FiPackage className="w-16 h-16 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-400">
              {activeTab === "new_stock" ? "No stock items added today" : 
               activeTab === "in_stock" ? "No items in stock" : "No out of stock items"}
            </h3>
            <p className="text-sm">
              {activeTab === "new_stock" ? "Items added today will appear here" : 
               activeTab === "in_stock" ? "Your in-stock items will appear here" : 
               "Your out of stock items will appear here"}
            </p>
          </div>
        </td>
      </tr>
    );

    return stocks.map((item, index) => renderTableRow(item, index));
  };

  return (
    <div className="py-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Stock Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your stock inventory efficiently</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-4 cursor-pointer py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors transform hover:scale-105"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
          {activeTab === "new_stock" && (
            <button 
              onClick={openCreateForm}
              className="inline-flex items-center cursor-pointer px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors transform hover:scale-105"
            >
              <FiPlus className="mr-2" /> Add Stock
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-2 mb-8 shadow-sm">
        <button
          className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all transform cursor-pointer ${
            activeTab === "new_stock" 
              ? "bg-white text-indigo-700 shadow-lg scale-105" 
              : "text-gray-600 hover:text-gray-900 hover:scale-102"
          }`}
          onClick={() => handleTabChange("new_stock")}
        >
          <FiTrendingUp className="mr-2" />
          Today's Stock
        </button>
        <button
          className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all transform cursor-pointer ${
            activeTab === "in_stock" 
              ? "bg-white text-green-700 shadow-lg scale-105" 
              : "text-gray-600 hover:text-gray-900 hover:scale-102"
          }`}
          onClick={() => handleTabChange("in_stock")}
        >
          <FiCheckCircle className="mr-2" />
          In Stock
        </button>
        <button
          className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all transform cursor-pointer ${
            activeTab === "out_of_stock" 
              ? "bg-white text-red-700 shadow-lg scale-105" 
              : "text-gray-600 hover:text-gray-900 hover:scale-102"
          }`}
          onClick={() => handleTabChange("out_of_stock")}
        >
          <FiTrendingDown className="mr-2" />
          Out of Stock
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {renderTableContent()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {stocks?.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{(page - 1) * pageSize + (stocks.length || 0)}</span> of{' '}
              <span className="font-medium">{stocks.length}</span> entries
            </div>
            <div className="flex space-x-2">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform hover:scale-105"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform hover:scale-105"
                disabled={stocks.length < pageSize}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Stock Form Overlay */}
      {(showCreateForm || showEditForm) && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {showEditForm ? "Edit Stock" : "Add New Stock"}
              </h3>
              <button 
                onClick={closeForm} 
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  {showEditForm ? (
                    <input
                      type="text"
                      value={selectedStock?.product_name}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
                      readOnly
                    />
                  ) : (
                    <select
                      name="product"
                      value={formData.product}
                      onChange={handleProductChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a product</option>
                      {activeProducts?.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Variant</label>
                  {showEditForm ? (
                    <input
                      type="text"
                      value={selectedStock?.variant_name}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
                      readOnly
                    />
                  ) : (
                    <select
                      name="variant"
                      value={formData.variant}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      disabled={!selectedProductId}
                    >
                      <option value="">Select a variant</option>
                      {productSizes?.map(variant => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name} 
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    name="total_quantity"
                    value={formData.total_quantity}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    className="block w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder="Enter batch number"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Manufacture Date</label>
                  <input
                    type="date"
                    name="manufacture_date"
                    value={formData.manufacture_date}
                    onChange={handleInputChange}
                    className="block w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="block w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="block w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="in_stock">New Stock Adding</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="block w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows="3"
                    placeholder="Add any notes about this stock item..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={closeForm} 
                  className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`px-4 py-2 cursor-pointer border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"} 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                >
                  {showEditForm ? "Update Stock" : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div></ModalPortal>
      )}

      {/* Stock History Modal */}
      {showHistoryModal && selectedStock && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Stock History</h3>
                <p className="text-sm text-gray-500 mt-1 font-extrabold">
                  {selectedStock.product_name} - {selectedStock.variant_name}
                </p>
                <div className="text-xs text-gray-600 font-bold mt-1">
                  Batch: {selectedStock.batch_number} | 
                  Mfg: {formatDateDisplay(selectedStock.manufacture_date)} | 
                  Exp: {formatDateDisplay(selectedStock.expiry_date)}
                  {isExpired(selectedStock.expiry_date) && <span className="text-red-600 font-semibold"> (Expired)</span>}
                </div>
              </div>
              <button 
                onClick={closeHistoryModal} 
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {isHistoryLoading ? (
                <div className="text-center py-8">
                  <Spinner />
                </div>
              ) : stockHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaHistory className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No history available for this stock item</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockHistory.map((history, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getActionIcon(history.action)}
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${getActionColor(history.action)}`}>
                            {history.action}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(history.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-500"><h2>Old: </h2>{history.old_quantity}</span>
                          <span className={`font-medium ${
                            history.action === 'ADD' ? 'text-green-600' : 
                            history.action === 'SELL' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {history.action === 'ADD' ? '+' : history.action === 'SELL' ? '-' : '±'}({history.change_quantity})
                          </span>
                          <span className="font-bold text-gray-900">New: {history.new_quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div></ModalPortal>
      )}
    </div>
  );
};

export default MyStockPage;