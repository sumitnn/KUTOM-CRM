import { useState } from 'react';
import { FiX, FiSave, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const OrderEntryModal = ({ order, onClose, onSave }) => {
  const [entryData, setEntryData] = useState({
    receivedQuantity: order.quantity,
    size: order.size,
    condition: 'good',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate received quantity
    if (entryData.receivedQuantity > order.quantity) {
      toast.error("Received quantity cannot be more than ordered quantity");
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Order Entry Details - #{order.id}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  id="productName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-600 sm:text-sm"
                  value={order.productName}
                  readOnly
                />
              </div>

              <div>
                <label htmlFor="orderedQuantity" className="block text-sm font-medium text-gray-700">
                  Ordered Quantity
                </label>
                <input
                  type="number"
                  id="orderedQuantity"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-600 sm:text-sm"
                  value={order.quantity}
                  readOnly
                />
              </div>

              <div>
                <label htmlFor="receivedQuantity" className="block text-sm font-medium text-gray-700">
                  Received Quantity*
                </label>
                <input
                  type="number"
                  id="receivedQuantity"
                  name="receivedQuantity"
                  min="0"
                  max={order.quantity}
                  value={entryData.receivedQuantity}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                  Size/Variant
                </label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  value={entryData.size}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={entryData.condition}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="good">Good</option>
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={entryData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiCheck className="-ml-1 mr-2 h-4 w-4" />
                Confirm Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderEntryModal;