import { useState } from "react";
import { FiPackage, FiTruck, FiCheckCircle, FiPlus, FiEdit, FiX } from "react-icons/fi";
import { useGetStocksQuery, useCreateStockMutation, useUpdateStockMutation } from "../features/stocks/stocksApi";

const MyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("in_stock"); 
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
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

  const { data: stocks, isLoading, isError } = useGetStocksQuery({
    status: activeTab,
    page,
    pageSize
  });

  const [createStock] = useCreateStockMutation();
  const [updateStock] = useUpdateStockMutation();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when changing tabs
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditForm) {
        await updateStock({ id: selectedStock.id, ...formData }).unwrap();
      } else {
        await createStock(formData).unwrap();
      }
      closeForm();
    } catch (error) {
      console.error('Error saving stock:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading stocks</div>;

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Stock Inventory</h1>
          <p className="text-sm text-gray-500">Manage your current stock and dispatches</p>
        </div>
        {activeTab === "in_stock" && (
          <button 
            onClick={openCreateForm}
            className="btn btn-primary gap-2"
          >
            <FiPlus /> Add Stock
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={`tab ${activeTab === "in_stock" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("in_stock")}
        >
          <FiPackage className="mr-2" />
          In Stock
        </button>
        <button
          className={`tab ${activeTab === "in_transit" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("in_transit")}
        >
          <FiTruck className="mr-2" />
          In Transit
        </button>
        <button
          className={`tab ${activeTab === "delivered" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => handleTabChange("delivered")}
        >
          <FiCheckCircle className="mr-2" />
          Delivered
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12">Sr No.</th>
                <th>Date</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Price</th>
                <th>Expected Date</th>
                <th>Status</th>
                {activeTab === "in_stock" && <th>Actions</th>}
              </tr>
            </thead>
            
            <tbody>
              {stocks?.results?.length > 0 ? (
                stocks.results.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="font-medium">{item.product_name}</td>
                    <td>{item.brand_name}</td>
                    <td>{item.category_name}</td>
                    <td>{item.subcategory_name}</td>
                    <td>{item.size_display}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.rate.toLocaleString()}</td>
                    <td>₹{item.total_price.toLocaleString()}</td>
                    <td>
                      {item.expected_date ? new Date(item.expected_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'in_stock' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.status.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </td>
                    {activeTab === "in_stock" && (
                      <td>
                        <button 
                          onClick={() => openEditForm(item)}
                          className="btn btn-ghost btn-sm"
                        >
                          <FiEdit />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === "in_stock" ? "13" : "12"} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {activeTab === "in_stock" ? (
                        <>
                          <FiPackage className="w-12 h-12 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-700">No items in stock</h3>
                          <p className="text-gray-500">Your in-stock items will appear here</p>
                        </>
                      ) : activeTab === "in_transit" ? (
                        <>
                          <FiTruck className="w-12 h-12 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-700">No items in transit</h3>
                          <p className="text-gray-500">Your in-transit items will appear here</p>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="w-12 h-12 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-700">No delivered items</h3>
                          <p className="text-gray-500">Your delivered items will appear here</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {stocks?.results?.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{(page - 1) * pageSize + stocks.results.length}</span> of{' '}
              <span className="font-medium">{stocks.count}</span> entries
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
                disabled={!stocks.next}
                onClick={() => setPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Stock Form Overlay */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Add New Stock</h3>
              <button onClick={closeForm} className="btn btn-ghost btn-circle">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Product</span>
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Size</span>
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quantity</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Rate</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Expected Date</span>
                  </label>
                  <input
                    type="date"
                    name="expected_date"
                    value={formData.expected_date}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={closeForm} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Form Overlay */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Edit Stock</h3>
              <button onClick={closeForm} className="btn btn-ghost btn-circle">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Product</span>
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Size</span>
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quantity</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Rate</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Expected Date</span>
                  </label>
                  <input
                    type="date"
                    name="expected_date"
                    value={formData.expected_date}
                    onChange={handleInputChange}
                    className="input input-bordered"
                  />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={closeForm} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Stock
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