import { useState, useEffect } from "react";
import { FiPackage, FiTruck, FiCheckCircle, FiPlus, FiEdit, FiX } from "react-icons/fi";
import { useGetStocksQuery, useCreateStockMutation, useUpdateStockMutation } from "../features/stocks/stocksApi";
import { useGetVendorActiveProductsQuery, useGetProductSizesQuery } from "../features/product/productApi";

const MyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("in_stock"); 
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

  const { data: stocks, isLoading, isError } = useGetStocksQuery({
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
      setSelectedProductId(selectedStock.product_id);
    }
  }, [showEditForm, selectedStock]);

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
    setSelectedProductId(null);
    setShowCreateForm(true);
  };

  const openEditForm = (stock) => {
    setSelectedStock(stock);
    setFormData({
      product: stock.product_id,
      size: stock.size_id,
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
          ...payload,
          product: selectedStock.product,
          size: selectedStock.size
        }).unwrap();
      } else {
        await createStock(payload).unwrap();
      }
      closeForm();
    } catch (error) {
      console.error('Error saving stock:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading stocks</div>;
  console.log(selectedStock)
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
              <tr className="font-bold text-black">
                <th className="w-12">Sr No.</th>
                <th>Created Date</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total Price</th>
                
                <th>Status</th>
                {activeTab === "in_stock" && <th>Actions</th>}
              </tr>
            </thead>
            
            <tbody>
              {stocks?.results?.length > 0 ? (
                stocks.results.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="font-bold">{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year:"numeric"
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
                          className="btn btn-ghost btn-md"
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
            <div className="text-sm text-gray-500 font-bold ">
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
                        {product.name} - {product.brand?.name || 'No Brand'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Size</span>
                  </label>
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
                        {size.size} ({size.measurement})
                      </option>
                    ))}
                  </select>
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
                    step="1"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
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
      {showEditForm && selectedStock && (
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
                    value={selectedStock.product_name}
                    className="input input-bordered"
                    readOnly
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Size</span>
                  </label>
                  <input
                    type="text"
                    value={selectedStock.size_display}
                    className="input input-bordered"
                    readOnly
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
                    step="1"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    required
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