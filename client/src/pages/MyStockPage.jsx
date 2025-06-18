import { useState } from "react";
import { FiPackage, FiTruck, FiCheckCircle } from "react-icons/fi";
import { useGetStocksQuery } from "../features/stocks/stocksApi";

const MyStockPage = ({ role }) => {
  const [activeTab, setActiveTab] = useState("in_stock"); 
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: stocks, isLoading, isError } = useGetStocksQuery({
    status: activeTab,
    page,
    pageSize
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when changing tabs
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-8">
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
    </div>
  );
};

export default MyStockPage;