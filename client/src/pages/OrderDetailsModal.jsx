import { FiX, FiTruck, FiMapPin, FiPackage, FiDollarSign, FiInfo, FiCalendar, FiFileText, FiUser, FiClipboard, FiBox, FiShoppingBag, FiMail, FiPhone, FiHome } from "react-icons/fi";

const OrderDetailsModal = ({ order, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateTotalQuantity = () => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const renderReceipt = () => {
    if (!order.receipt) return <p className="text-sm text-gray-500">No receipt provided</p>;
    
    const extension = order.receipt.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <a 
          href={order.receipt} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <FiFileText className="h-4 w-4" />
          <span>View Receipt PDF</span>
        </a>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <div className="mt-2">
          <img 
            src={order.receipt} 
            alt="Order Receipt" 
            className="h-32 w-auto rounded-md border border-gray-200"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiInfo className="text-blue-500" />
            Order Details - #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                <FiCalendar className="text-blue-500" />
                Order Date
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(order.date)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Order Status</h3>
              <p className="text-sm font-semibold capitalize text-gray-900">
                {order.status || "Not specified"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FiClipboard className="text-blue-500" />
              Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Note</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.note || 'No note provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Receipt</p>
                {renderReceipt()}
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FiShoppingBag className="text-green-500" />
              Vendor Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.createdFor?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.createdFor?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vendor ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.createdFor?.roleId || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FiTruck className="text-green-500" />
              Shipping Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Courier Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.courier_name || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tracking Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.tracking_number || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transport Charges</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.transport_charges)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Delivery Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(order.expected_delivery_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FiPackage className="text-purple-500" />
              Order Items (Total: {calculateTotalQuantity()})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                            <FiBox className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.productName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {item.productId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.size || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.discount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency((parseFloat(item.price) - parseFloat(item.discount || 0)) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FiDollarSign className="text-green-500" />
              Order Summary
            </h3>
            <div className="flex justify-end">
              <div className="w-full md:w-1/3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {order.transport_charges && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Shipping:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.transport_charges)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-sm font-bold text-gray-600">Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(
                      parseFloat(order.totalAmount) + 
                      (order.transport_charges ? parseFloat(order.transport_charges) : 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;