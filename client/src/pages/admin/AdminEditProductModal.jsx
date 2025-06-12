import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiSearch, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
const AdminEditProductModal = ({ product, onClose, onSave }) => {
    const [editedProduct, setEditedProduct] = useState({ ...product });
  
    useEffect(() => {
      setEditedProduct({ ...product });
    }, [product]);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setEditedProduct(prev => ({ ...prev, [name]: value }));
    };
  
    const handleVariantChange = (variantId, field, value) => {
      setEditedProduct(prev => ({
        ...prev,
        variants: prev.variants.map(variant =>
          variant.id === variantId ? { ...variant, [field]: field === 'price' || field === 'stock' ? Number(value) : value } : variant
        )
      }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(editedProduct);
    };
  
    return (
      <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          
          {/* Modal container */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 z-50 relative">
            <form onSubmit={handleSubmit}>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Product</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={editedProduct.name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">Vendor</label>
                      <input
                        type="text"
                        id="vendor"
                        name="vendor"
                        value={editedProduct.vendor}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={editedProduct.category}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Home">Home</option>
                    </select>
                  </div>
  
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Variants</h4>
                    <div className="space-y-4">
                      {editedProduct.variants.map((variant) => (
                        <div key={variant.id} className="border border-gray-200 rounded-md p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Variant ID: {variant.id}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(variant).map(([key, value]) => (
                              key !== 'id' && (
                                <div key={key}>
                                  <label htmlFor={`${variant.id}-${key}`} className="block text-sm font-medium text-gray-700 capitalize">
                                    {key}
                                  </label>
                                  <input
                                    type={typeof value === 'number' ? 'number' : 'text'}
                                    id={`${variant.id}-${key}`}
                                    value={value}
                                    onChange={(e) => handleVariantChange(variant.id, key, e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    min={key === 'price' || key === 'stock' ? 0 : undefined}
                                    step={key === 'price' ? 0.01 : undefined}
                                    required
                                  />
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
};
  

export default AdminEditProductModal;