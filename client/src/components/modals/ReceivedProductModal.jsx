import { useState } from 'react';
import { FiPackage, FiCheck, FiX } from 'react-icons/fi';
import ModalPortal from '../ModalPortal';

const ReceivedProductModal = ({ order, onClose, onConfirm }) => {
  const [receivedItems, setReceivedItems] = useState(
    order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      receivedQuantity: item.quantity,
      isDamaged: false,
      notes: ''
    }))
  );

  const handleQuantityChange = (id, value) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, receivedQuantity: Math.min(Number(value), item.quantity) }
          : item
      )
    );
  };

  const handleDamageToggle = (id) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isDamaged: !item.isDamaged } : item
      )
    );
  };

  const handleNotesChange = (id, value) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, notes: value } : item
      )
    );
  };

  const handleSubmit = () => {
    onConfirm(receivedItems);
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <div className="flex items-center space-x-2">
            <FiPackage className="text-green-500" />
            <h3 className="text-lg font-semibold">Receive Products - Order #{order.id}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Damaged</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-gray-500">ID: {item.productId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.receivedQuantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isDamaged}
                          onChange={() => handleDamageToggle(item.id)}
                          className="h-4 w-4 text-green-600 rounded"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        placeholder="Any notes..."
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              <FiCheck className="mr-2" /> Confirm Receipt
            </button>
          </div>
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default ReceivedProductModal;