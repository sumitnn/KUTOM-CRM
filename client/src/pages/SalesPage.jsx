import { useState } from "react";
import { FiDownload, FiFileText, FiPrinter } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const SalesPage = ({ role }) => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("month");
  
  // Sample data - replace with your API data
  const salesData = [
    {
      id: 1,
      date: "2023-05-15",
      name: "Premium Headphones",
      brand: "Sony",
      category: "Electronics",
      subcategory: "Audio",
      quantity: 2,
      actualRate: 12000,
      acceptedPrice: 11000,
      deliveredDate: "2023-05-18",
      receivedDate: "2023-05-20",
      amount: 22000,
      status: "completed"
    },
    // Add more sample data as needed
  ];

  return (
    <div className="px-4 py-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
          <p className="text-sm text-gray-500">Track all your completed sales transactions</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select 
            className="select select-bordered w-full md:w-40 focus:ring-2 focus:ring-primary"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button className="btn btn-outline gap-2">
            <FiPrinter /> Print Report
          </button>
        </div>
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
                <th>Actual Rate</th>
                <th>Accepted Price</th>
                <th>Delivered</th>
                <th>Received</th>
                <th>Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              {salesData.length > 0 ? (
                salesData.map((sale, index) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td>{index + 1}</td>
                    <td>
                      {new Date(sale.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="font-medium">{sale.name}</td>
                    <td>{sale.brand}</td>
                    <td>{sale.category}</td>
                    <td>{sale.subcategory}</td>
                    <td>{sale.quantity}</td>
                    <td>₹{sale.actualRate.toLocaleString()}</td>
                    <td>₹{sale.acceptedPrice.toLocaleString()}</td>
                    <td>
                      {new Date(sale.deliveredDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      {new Date(sale.receivedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="font-semibold">₹{sale.amount.toLocaleString()}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button 
                          className="btn btn-xs btn-ghost btn-square hover:bg-blue-50 tooltip" 
                          data-tip="View Bill"
                          onClick={() => window.open(`/sales/bill/${sale.id}`, '_blank')}
                        >
                          <FiFileText className="text-blue-600" />
                        </button>
                        <button 
                          className="btn btn-xs btn-ghost btn-square hover:bg-green-50 tooltip" 
                          data-tip="Download Bill"
                          onClick={() => alert(`Downloading bill for ${sale.name}`)}
                        >
                          <FiDownload className="text-green-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <h3 className="text-lg font-medium text-gray-700">No sales records found</h3>
                      <p className="text-gray-500">Your sales transactions will appear here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {salesData.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{salesData.length}</span> entries
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

export default SalesPage;