import { FiFileText, FiDownload, FiPrinter, FiX } from 'react-icons/fi';
import ModalPortal from '../ModalPortal';

const OrderBillModal = ({ order, onClose }) => {
  // Calculate totals
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // Assuming 18% tax
  const total = subtotal + tax;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <div className="flex items-center space-x-2">
            <FiFileText className="text-indigo-500" />
            <h3 className="text-lg font-semibold">Order Bill - #{order.id}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between mb-6">
            <div>
              <h4 className="font-medium text-gray-900">Seller Information</h4>
              <p className="text-sm text-gray-500">Your Company Name</p>
              <p className="text-sm text-gray-500">123 Business Street</p>
              <p className="text-sm text-gray-500">City, State 10001</p>
              <p className="text-sm text-gray-500">GSTIN: 22AAAAA0000A1Z5</p>
            </div>
            <div className="text-right">
              <h4 className="font-medium text-gray-900">Buyer Information</h4>
              <p className="text-sm text-gray-500">{order.createdFor.name}</p>
              <p className="text-sm text-gray-500">Role ID: {order.createdFor.roleId}</p>
              <p className="text-sm text-gray-500">Order Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-gray-500">ID: {item.productId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.size}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">₹{item.price}</td>
                    <td className="px-4 py-3 text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Subtotal:</span>
                <span className="text-sm">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tax (18%):</span>
                <span className="text-sm">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-medium">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium">
              <FiPrinter className="mr-2" /> Print
            </button>
            <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
              <FiDownload className="mr-2" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default OrderBillModal;