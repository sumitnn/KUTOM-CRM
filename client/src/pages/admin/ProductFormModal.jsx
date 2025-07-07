import { useState, useEffect } from 'react';
import { FiX, FiSave, FiUpload, FiImage, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ProductFormModal = ({ product, onClose, onSave, mode = 'admin-edit' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    brand: '',
    category: '',
    subcategory: '',
    product_type: 'physical',
    status: 'draft',
    weight: '',
    weight_unit: 'kg',
    dimensions: '',
    shipping_info: '',
    warranty: '',
    features: [],
    images: []
  });
  const [newFeature, setNewFeature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        brand: product.brand || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        product_type: product.product_type || 'physical',
        status: product.status || 'draft',
        weight: product.weight || '',
        weight_unit: product.weight_unit || 'kg',
        dimensions: product.dimensions || '',
        shipping_info: product.shipping_info || '',
        warranty: product.warranty || '',
        features: product.features || [],
        images: product.images || []
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureAdd = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleFeatureRemove = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleImageUpload = (e) => {
    // In a real app, you would upload to your server here
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Date.now(),
      image: URL.createObjectURL(file),
      alt_text: '',
      is_featured: false,
      is_default: false
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const handleImageRemove = (id) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };

  const handleSetFeatured = (id) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({
        ...img,
        is_featured: img.id === id,
        is_default: img.id === id
      }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, you would call your API here
      // await updateProduct(product.id, formData);
      
      toast.success('Product updated successfully');
      onSave();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'admin-edit' ? 'Edit Product' : 'View Product'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <label htmlFor="short_description" className="block text-sm font-medium text-gray-700">
                    Short Description
                  </label>
                  <textarea
                    id="short_description"
                    name="short_description"
                    rows={2}
                    value={formData.short_description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={mode === 'view'}
                  />
                </div>
              </div>

              {/* Categorization */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Categorization</h3>
                
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    Brand*
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category*
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <label htmlFor="product_type" className="block text-sm font-medium text-gray-700">
                    Product Type*
                  </label>
                  <select
                    id="product_type"
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={mode === 'view'}
                  >
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Shipping Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Weight
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      disabled={mode === 'view'}
                    />
                    <select
                      id="weight_unit"
                      name="weight_unit"
                      value={formData.weight_unit}
                      onChange={handleChange}
                      className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-50 text-gray-700 sm:text-sm rounded-r-md"
                      disabled={mode === 'view'}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">
                    Dimensions (L-W-H)
                  </label>
                  <input
                    type="text"
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    placeholder="e.g. 10-5-2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={mode === 'view'}
                  />
                </div>

                <div>
                  <label htmlFor="shipping_info" className="block text-sm font-medium text-gray-700">
                    Shipping Info
                  </label>
                  <input
                    type="text"
                    id="shipping_info"
                    name="shipping_info"
                    value={formData.shipping_info}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="warranty" className="block text-sm font-medium text-gray-700">
                    Warranty
                  </label>
                  <input
                    type="text"
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Features</h3>
              <div className="mt-4">
                <div className="flex">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add a feature"
                    disabled={mode === 'view'}
                  />
                  <button
                    type="button"
                    onClick={handleFeatureAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={mode === 'view'}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {feature}
                      {mode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => handleFeatureRemove(feature)}
                          className="ml-1.5 inline-flex text-blue-500 hover:text-blue-700 focus:outline-none"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Images</h3>
              <div className="mt-4">
                {mode !== 'view' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Upload Images
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              onChange={handleImageUpload}
                              accept="image/*"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.image}
                        alt={image.alt_text || 'Product image'}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      {image.is_featured && (
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                      {mode !== 'view' && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity rounded-md">
                          <button
                            type="button"
                            onClick={() => handleSetFeatured(image.id)}
                            className="p-1 bg-white rounded-full text-green-600 hover:bg-green-100"
                            title="Set as featured"
                          >
                            <FiImage size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImageRemove(image.id)}
                            className="p-1 bg-white rounded-full text-red-600 hover:bg-red-100"
                            title="Remove image"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            {mode !== 'view' && (
              <div className="flex justify-end space-x-3 border-t pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="-ml-1 mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;