import { useState } from 'react';
import { FiMapPin, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import ModalPortal from '../ModalPortal';

const AddressModal = ({ address, onClose, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    street: address?.street || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setEditMode(false);
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <div className="flex items-center space-x-2">
            <FiMapPin className="text-blue-500" />
            <h3 className="text-lg font-semibold">Shipping Address</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          {editMode ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save Address
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-gray-800"><span className="font-medium">Street:</span> {address?.street}</p>
                <p className="text-gray-800"><span className="font-medium">City:</span> {address?.city}</p>
                <p className="text-gray-800"><span className="font-medium">State:</span> {address?.state}</p>
                <p className="text-gray-800"><span className="font-medium">Postal Code:</span> {address?.postalCode}</p>
                <p className="text-gray-800"><span className="font-medium">Country:</span> {address?.country}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <FiEdit2 className="mr-2" /> Edit Address
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default AddressModal;