import { useState } from "react";
import { FiPackage, FiTruck } from "react-icons/fi";

const MyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("readyToDispatch");
  
  // Sample data - replace with your API data
  const stockData = {
    readyToDispatch: [
      {
        id: 1,
        date: "2023-05-10",
        name: "Wireless Earbuds",
        brand: "JBL",
        category: "Electronics",
        subcategory: "Audio",
        quantity: 50,
        rate: 1999,
        price: 99950,
        expectedDate: "2023-05-15",
        status: "packed"
      },
      // Add more sample data
    ],
    inTransit: [
      // Sample data for in-transit items
    ]
  };

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Stock Inventory</h1>
          <p className="text-sm text-gray-500">Manage your current stock and dispatches</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={`tab ${activeTab === "readyToDispatch" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => setActiveTab("readyToDispatch")}
        >
          <FiPackage className="mr-2" />
          Ready to Dispatch
        </button>
        <button
          className={`tab ${activeTab === "inTransit" ? "tab-active bg-white shadow-sm" : ""}`}
          onClick={() => setActiveTab("inTransit")}
        >
          <FiTruck className="mr-2" />
          In Transit
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
                <th>Expected Date</th>
                <th>Status</th>
              </tr>
            </thead>
            
            <tbody>
              {stockData[activeTab]?.length > 0 ? (
                stockData[activeTab].map((item, index) => (
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
                      {new Date(item.expectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'packed' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {activeTab === "readyToDispatch" ? (
                        <>
                          <FiPackage className="w-12 h-12 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-700">No stock ready for dispatch</h3>
                          <p className="text-gray-500">Your ready-to-dispatch items will appear here</p>
                        </>
                      ) : (
                        <>
                          <FiTruck className="w-12 h-12 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-700">No items in transit</h3>
                          <p className="text-gray-500">Your in-transit items will appear here</p>
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
        {stockData[activeTab]?.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{stockData[activeTab].length}</span> entries
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

export default MyStockPage;