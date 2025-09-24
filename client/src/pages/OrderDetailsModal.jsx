import { FiX, FiTruck, FiMapPin, FiPackage, FiDollarSign, FiInfo, FiCalendar, FiFileText, FiUser, FiClipboard, FiBox, FiShoppingBag, FiMail, FiPhone, FiHome, FiCreditCard, FiPercent, FiTag } from "react-icons/fi";

const OrderDetailsModal = ({ order, onClose }) => {
  console.log(order)
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
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount));
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
          {/* Order Status & Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                <FiCalendar className="text-blue-600" />
                Order Date
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(order.date)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h3 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                <FiClipboard className="text-yellow-600" />
                Order Status
              </h3>
              <p className="text-sm font-semibold capitalize text-gray-900">
                {order.statusDisplay || order.status || "Not specified"}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
                <FiCreditCard className="text-purple-600" />
                Payment Status
              </h3>
              <p className="text-sm font-semibold capitalize text-gray-900">
                {order.paymentStatusDisplay || order.paymentStatus || "Not specified"}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <FiDollarSign className="text-green-600" />
                Total Amount
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          {/* Buyer & Seller Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiUser className="text-blue-500" />
                Buyer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.address ? 
                      `${order.buyer.address.street_address || ''} ${order.buyer.address.city || ''} ${order.buyer.address.state || ''} ${order.buyer.address.postal_code || ''} ${order.buyer.address.country || ''}`.trim() || 'N/A' 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiShoppingBag className="text-green-500" />
                Vendor Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vendor ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.roleId || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiPackage className="text-purple-500" />
              Order Items (Total: {calculateTotalQuantity()})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
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
                      GST
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">
                        -{formatCurrency(item.discount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                        +{formatCurrency(item.gstAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiDollarSign className="text-green-500" />
              Order Summary
            </h3>
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 lg:w-1/3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FiTag className="text-blue-500" />
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FiPercent className="text-red-500" />
                    Discount:
                  </span>
                  <span className="text-sm font-medium text-red-500">
                    -{formatCurrency(order.discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FiCreditCard className="text-green-500" />
                    GST Amount:
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    +{formatCurrency(order.gstAmount)}
                  </span>
                </div>
                {parseFloat(order.transport_charges) > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FiTruck className="text-purple-500" />
                      Shipping:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      +{formatCurrency(order.transport_charges)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 mt-2 bg-gray-100 px-2 rounded">
                  <span className="text-sm font-bold text-gray-800">Grand Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiTruck className="text-green-500" />
              Shipping Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Additional Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiClipboard className="text-blue-500" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.description || 'No description provided'}
                </p>
              </div>
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