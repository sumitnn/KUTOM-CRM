import { useState, useEffect, lazy, Suspense } from "react";
import { FiPackage, FiCheckCircle, FiPlus, FiEdit, FiX, FiRefreshCw } from "react-icons/fi";
import { useGetStocksQuery, useCreateStockMutation, useUpdateStockMutation } from "../features/stocks/stocksApi";
import { useGetVendorActiveProductsQuery, useGetProductSizesQuery } from "../features/product/productApi";
import { toast } from "react-toastify";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const MyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("new_stock"); 
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    product: '',
    size: '',
    quantity: '',
    rate: '',
    status: 'in_stock',
    notes: '',
    expected_date: ''
  });

  const { data: stocks = [], isLoading, isError, error, refetch } = useGetStocksQuery({
    status: activeTab,
    page,
    pageSize
  });

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
      size: '',
      quantity: '',
      rate: '',
      status: 'in_stock',
      notes: '',
      expected_date: ''
    });
    setSelectedProductId(null);
    setShowCreateForm(true);
  };

  const openEditForm = (stock) => {
    setSelectedStock(stock);
    setFormData({
      product: stock.product,
      size: stock.size,
      quantity: stock.quantity,
      rate: stock.rate,
      status: stock.status,
      notes: stock.notes,
      expected_date: stock.expected_date || ''
    });
    setShowEditForm(true);
  };

  const closeForm = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
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
      size: '' // Reset size when product changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "new_stock":
        return (
          <tr className="font-bold text-black">
            <th className="w-12">No.</th>
            <th>Date</th>
            <th>Product ID</th>
            <th>Brand</th>
            <th>Product Name</th>
            <th>Unit (Kg/Ml/Unit)</th>
            <th>Total Stock Price</th>
            <th>Old Stock</th>
            <th>New Stock</th>
            <th>Total Available Stock</th>
            <th>Actions</th>
          </tr>
        );
      case "in_stock":
        return (
          <tr className="font-bold text-black">
            <th className="w-12">No.</th>
            <th>Date</th>
            <th>Product ID</th>
            <th>Brand</th>
            <th>Product Name</th>
            <th>Unit (Kg/Ml/Unit)</th>
            <th>Total Stock Price</th>
            <th>Available Stock</th>
            <th>Actions</th>
          </tr>
        );
      case "out_of_stock":
        return (
          <tr className="font-bold text-black">
            <th className="w-12">No.</th>
            <th>Date (Stock Out)</th>
            <th>Product ID</th>
            <th>Brand</th>
            <th>Category</th>
            <th>SubCategory</th>
            <th>Product Name</th>
            <th>Actions</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item, index) => {
    switch (activeTab) {
      case "new_stock":
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="font-bold">{(page - 1) * pageSize + index + 1}</td>
            <td>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </td>
            <td>{item.product}</td>
            <td>{item.brand_name}</td>
            <td>{item.product_name}</td>
            <td>{item.size_display}</td>
            <td>₹{item.total_price}</td>
            <td>{item.old_quantity || 0}</td>
            <td>{item.quantity}</td>
            <td>{(item.old_quantity || 0) + item.quantity}</td>
            <td>
              <button 
                onClick={() => openEditForm(item)}
                className="btn btn-ghost btn-md font-bold"
              >
                <FiEdit />
              </button>
            </td>
          </tr>
        );
      case "in_stock":
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="font-bold">{(page - 1) * pageSize + index + 1}</td>
            <td>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </td>
            <td>{item.product}</td>
            <td>{item.brand_name}</td>
            <td>{item.product_name}</td>
            <td>{item.size_display}</td>
            <td>₹{item.total_price}</td>
            <td>{item.quantity}</td>
            <td>
              <button 
                onClick={() => openEditForm(item)}
                className="btn btn-ghost btn-md font-bold"
              >
                <FiEdit />
              </button>
            </td>
          </tr>
        );
      case "out_of_stock":
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="font-bold">{(page - 1) * pageSize + index + 1}</td>
            <td>
              {new Date(item.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </td>
            <td>{item.product}</td>
            <td>{item.brand_name}</td>
            <td>{item.category_name}</td>
            <td>{item.subcategory_name}</td>
            <td>{item.product_name}</td>
            <td>
              <button 
                onClick={() => openEditForm(item)}
                className="btn btn-ghost btn-md font-bold"
              >
                <FiEdit />
              </button>
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
        <td colSpan={activeTab === "new_stock" ? 11 : activeTab === "in_stock" ? 9 : 8} className="text-center py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <Spinner />
          </Suspense>
        </td>
      </tr>
    );

    if (isError) return (
      <tr>
        <td colSpan={activeTab === "new_stock" ? 11 : activeTab === "in_stock" ? 9 : 8} className="text-center py-8">
          <Suspense fallback={<div>Error loading...</div>}>
            <ErrorMessage message={error?.data?.message || "Failed to load stocks"} />
          </Suspense>
        </td>
      </tr>
    );

    if (!stocks || stocks.length === 0) return (
      <tr>
        <td colSpan={activeTab === "new_stock" ? 11 : activeTab === "in_stock" ? 9 : 8} className="text-center py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <FiPackage className="w-12 h-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700">
              {activeTab === "new_stock" ? "No stock items added today" : 
               activeTab === "in_stock" ? "No items in stock" : "No out of stock items"}
            </h3>
            <p className="text-gray-500">
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

  const getColSpan = () => {
    switch (activeTab) {
      case "new_stock": return 11;
      case "in_stock": return 9;
      case "out_of_stock": return 8;
      default: return 10;
    }
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
          >
            <FiRefreshCw /> Refresh
          </button>
          {activeTab === "new_stock" && (
            <button 
              onClick={openCreateForm}
              className="btn btn-primary gap-2"
            >
              <FiPlus /> Add Stock
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={`tab ${activeTab === "new_stock" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("new_stock")}
        >
          <FiPackage className="mr-2" />
          Today's Stock
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
        {stocks?.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <div className="text-sm text-gray-500 font-bold">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{(page - 1) * pageSize + (stocks.length || 0)}</span> of{' '}
              <span className="font-medium">{stocks.length}</span> entries
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

      {/* Create Stock Form Overlay */}
      {(showCreateForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-extrabold text-lg">
                {showEditForm ? "Edit Stock" : "Add New Stock"}
              </h3>
              <button onClick={closeForm} className="btn btn-ghost btn-circle">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Product</span>
                  </label>
                  {showEditForm ? (
                    <input
                      type="text"
                      value={selectedStock?.product_name}
                      className="input input-bordered"
                      readOnly
                    />
                  ) : (
                    <select
                      name="product"
                      value={formData.product}
                      onChange={handleProductChange}
                      className="select select-bordered"
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
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Size</span>
                  </label>
                  {showEditForm ? (
                    <input
                      type="text"
                      value={selectedStock?.size_display}
                      className="input input-bordered"
                      readOnly
                    />
                  ) : (
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="select select-bordered"
                      required
                      disabled={!selectedProductId}
                    >
                      <option value="">Select a size</option>
                      {productSizes?.map(size => (
                        <option key={size.id} value={size.id}>
                          {size.size} 
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Quantity</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                    min="1"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Unit Price</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                    min="0"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Status</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-bold">Notes</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered"
                    rows="4"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={closeForm} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {showEditForm ? "Update Stock" : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStockPage;