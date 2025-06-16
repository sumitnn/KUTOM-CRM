import { useState } from "react";
import { FiCheckCircle, FiClock, FiTruck, FiXCircle } from "react-icons/fi";

const RequestedProductsPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Sample data - replace with your API data
  const requestData = {
    pending: [
      {
        id: 1,
        date: "2023-05-12",
        name: "Smart Watch",
        brand: "Noise",
        category: "Electronics",
        subcategory: "Wearables",
        quantity: 5,
        rate: 2999,
        price: 14995,
        demandDate: "2023-05-20",
        status: "pending"
      },
      // Add more sample data
    ],
    accepted: [],
    ready: [],
    dispatched: []
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
                onClick={() => updateStatus("accepted")}
              >
                <FiCheckCircle className="text-green-600" />
                Accept Request
              </button>
              <button 
                className="btn btn-outline justify-start gap-2"
                onClick={() => updateStatus("ready")}
              >
                <FiClock className="text-yellow-600" />
                Mark as Ready
              </button>
              <button 
                className="btn btn-outline justify-start gap-2"
                onClick={() => updateStatus("dispatched")}
              >
                <FiTruck className="text-blue-600" />
                Mark as Dispatched
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
          <p className="text-sm text-gray-500">Manage incoming product requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={`tab ${activeTab === "pending" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <FiClock className="mr-2" />
          Pending
        </button>
        <button
          className={`tab ${activeTab === "accepted" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => setActiveTab("accepted")}
        >
          <FiCheckCircle className="mr-2" />
          Accepted
        </button>
        <button
          className={`tab ${activeTab === "ready" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => setActiveTab("ready")}
        >
          <FiXCircle className="mr-2" />
          Ready
        </button>
        <button
          className={`tab ${activeTab === "dispatched" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => setActiveTab("dispatched")}
        >
          <FiTruck className="mr-2" />
          Dispatched
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
                <th>Qty</th>
                <th>Rate</th>
                <th>Price</th>
                <th>Demand Date</th>
                <th className="text-center">Action</th>
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
                        day: 'numeric'
                      })}
                    </td>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.brand}</td>
                    <td>{item.category}</td>
                    <td>{item.subcategory}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.rate.toLocaleString()}</td>
                    <td>₹{item.price.toLocaleString()}</td>
                    <td>
                      {new Date(item.demandDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowStatusModal(true);
                          }}
                        >
                          Change Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiClock className="w-12 h-12 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-700">
                        {activeTab === "pending" ? "No pending requests" :
                         activeTab === "accepted" ? "No accepted requests" :
                         activeTab === "ready" ? "No ready items" : "No dispatched items"}
                      </h3>
                      <p className="text-gray-500">
                        {activeTab === "pending" ? "New requests will appear here" :
                         "Items will appear here once they reach this status"}
                      </p>
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
            <div className="text-sm text-gray-500">
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
    </div>
  );
};

export default RequestedProductsPage;