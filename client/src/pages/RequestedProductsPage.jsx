import { useState } from "react";
import { FiCheckCircle, FiClock, FiTruck, FiXCircle, FiEyeOff } from "react-icons/fi";
import { useGetProductsByStatusQuery } from "../features/product/productApi"; 

const RequestedProductsPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Fetch products based on status
  const { data: pendingProducts = [], isLoading: isPendingLoading } = useGetProductsByStatusQuery('draft');
  const { data: acceptedProducts = [], isLoading: isAcceptedLoading } = useGetProductsByStatusQuery('published');
  
  // We'll need to filter for inactive products since the API doesn't have a direct status for it
  const allProducts = [...pendingProducts, ...acceptedProducts];
  const inactiveProducts = allProducts.filter(product => 
    product.sizes.every(size => !size.is_active)
  );

  const requestData = {
    pending: pendingProducts.map(product => ({
      id: product.id,
      date: product.created_at,
      name: product.name,
      sku: product.sku,
      brand: product.brand_name,
      category: product.category_name,
      subcategory: product.subcategory_name,
      quantity: product.sizes.reduce((sum, size) => sum + size.quantity, 0),
      rate: parseFloat(product.sizes.find(size => size.is_default)?.price || product.sizes[0]?.price || 0),
      price: parseFloat(product.sizes.reduce((sum, size) => sum + (size.quantity * parseFloat(size.price)), 0)),
      demandDate: product.updated_at,
      status: product.status,
      isActive: product.sizes.some(size => size.is_active)
    })),
    accepted: acceptedProducts.map(product => ({
      id: product.id,
      date: product.created_at,
      name: product.name,
      sku: product.sku,
      brand: product.brand_name,
      category: product.category_name,
      subcategory: product.subcategory_name,
      quantity: product.sizes.reduce((sum, size) => sum + size.quantity, 0),
      rate: parseFloat(product.sizes.find(size => size.is_default)?.price || product.sizes[0]?.price || 0),
      price: parseFloat(product.sizes.reduce((sum, size) => sum + (size.quantity * parseFloat(size.price)), 0)),
      demandDate: product.updated_at,
      status: product.status,
      isActive: product.sizes.some(size => size.is_active)
    })),
    inactive: inactiveProducts.map(product => ({
      id: product.id,
      date: product.created_at,
      name: product.name,
      sku: product.sku,
      brand: product.brand_name,
      category: product.category_name,
      subcategory: product.subcategory_name,
      quantity: product.sizes.reduce((sum, size) => sum + size.quantity, 0),
      rate: parseFloat(product.sizes.find(size => size.is_default)?.price || product.sizes[0]?.price || 0),
      price: parseFloat(product.sizes.reduce((sum, size) => sum + (size.quantity * parseFloat(size.price)), 0)),
      demandDate: product.updated_at,
      status: product.status,
      isActive: false
    }))
  };

  const updateStatus = (newStatus) => {
    // Here you would typically call an API to update the status
    alert(`Status updated to ${newStatus} for ${selectedProduct.name}`);
    setShowStatusModal(false);
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Update Status for {selectedProduct?.name}</h3>
            <div className="flex flex-col gap-3 mb-6">
              <button 
                className="btn btn-outline justify-start gap-2"
                onClick={() => updateStatus("published")}
              >
                <FiCheckCircle className="text-green-600" />
                Publish Product
              </button>
              <button 
                className="btn btn-outline justify-start gap-2"
                onClick={() => updateStatus("draft")}
              >
                <FiClock className="text-yellow-600" />
                Mark as Draft
              </button>
              <button 
                className="btn btn-outline justify-start gap-2"
                onClick={() => updateStatus("inactive")}
              >
                <FiEyeOff className="text-gray-600" />
                Mark as Inactive
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Requests</h1>
          <p className="text-sm text-gray-500 font-bold">Manage product status and visibility</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-500 text-black font-bold  p-1 rounded-lg mb-6">
        <button
          className={`tab ${activeTab === "pending" ? "tab-active bg-white font-bold shadow-sm" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <FiClock className="mr-2" />
          Draft ({pendingProducts.length})
        </button>
        <button
          className={`tab ${activeTab === "accepted" ? "tab-active bg-white font-bold  shadow-sm" : ""}`}
          onClick={() => setActiveTab("accepted")}
        >
          <FiCheckCircle className="mr-2" />
          Published ({acceptedProducts.length})
        </button>
        <button
          className={`tab ${activeTab === "inactive" ? "tab-active bg-white font-bold  shadow-sm" : ""}`}
          onClick={() => setActiveTab("inactive")}
        >
          <FiEyeOff className="mr-2" />
          Inactive ({inactiveProducts.length})
        </button>
      </div>

      {/* Loading states */}
      {(isPendingLoading || isAcceptedLoading) && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Table */}
      {!isPendingLoading && !isAcceptedLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-300 font-bold text-black">
                <tr>
                  <th className="w-12">Sr No.</th>
                  <th>Created Date</th>
                  <th>Product Name</th>
                  <th>Product (SKU)</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Price</th>
                  <th>Last Updated</th>
                  
                </tr>
              </thead>
              
              <tbody>
                {requestData[activeTab]?.length > 0 ? (
                  requestData[activeTab].map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td>{index + 1}</td>
                      <td>
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year:"numeric"
                        })}
                      </td>
                      <td className="font-bold">{item.name}</td>
                      <td className="font-bold">{item.sku}</td>
                      <td>{item.brand}</td>
                      <td>{item.category}</td>
                      <td>{item.subcategory}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.rate.toLocaleString()}</td>
                      <td>₹{item.price.toLocaleString()}</td>
                      <td>
                        {new Date(item.demandDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year:"numeric"
                        })}
                      </td>
                      
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {activeTab === "pending" ? (
                          <>
                            <FiClock className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">No draft products</h3>
                            <p className="text-gray-500">Draft products will appear here</p>
                          </>
                        ) : activeTab === "accepted" ? (
                          <>
                            <FiCheckCircle className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">No published products</h3>
                            <p className="text-gray-500">Published products will appear here</p>
                          </>
                        ) : (
                          <>
                            <FiEyeOff className="w-12 h-12 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700">No inactive products</h3>
                            <p className="text-gray-500">Inactive products will appear here</p>
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
          {requestData[activeTab]?.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 font-bold">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{requestData[activeTab].length}</span> entries
              </div>
              <div className="join">
                <button className="join-item btn btn-sm btn-disabled">«</button>
                <button className="join-item btn btn-sm btn-active">1</button>
                <button className="join-item btn btn-sm btn-disabled">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestedProductsPage;