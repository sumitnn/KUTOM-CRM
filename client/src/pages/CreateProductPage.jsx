import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCreateProductMutation } from "../features/product/productApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import {
  useGetCategoriesQuery,
  useGetSubcategoriesByCategoryQuery,
} from '../features/category/categoryApi';

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [product, setProduct] = useState({
    name: "",
    short_description: "",
    description: "",
    brand: "",
    category: "",
    subcategory: "",
    tags: [],
    is_featured: false,
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [sizes, setSizes] = useState([{ 
    id: 1,
    name: "",
    size: "",
    unit: "g", 
    price: "", 
    cost_price: "",
    quantity: "", 
    is_default: false,
  }]);

  const [priceTiers, setPriceTiers] = useState([{
    id: 1,
    sizeIndex: 0,
    min_quantity: "",
    price: ""
  }]);

  const [images, setImages] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: subcategoriesData = [] } = useGetSubcategoriesByCategoryQuery(selectedCategoryId, {
    skip: !selectedCategoryId,
  });

  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSizeChange = (index, field, value) => {
    setSizes(prev => prev.map((size, i) => 
      i === index ? { ...size, [field]: value } : size
    ));
  };

  const handlePriceTierChange = (index, field, value) => {
    setPriceTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  const addSize = () => {
    setSizes(prev => [...prev, { 
      id: Date.now(),
      name: "",
      size: "",
      unit: "g", 
      price: "", 
      cost_price: "",
      quantity: "", 
      is_default: false,
    }]);
  };

  const removeSize = (index) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
    setPriceTiers(prev => prev.filter(tier => tier.sizeIndex !== index));
  };

  const addPriceTier = (sizeIndex) => {
    setPriceTiers(prev => [...prev, { 
      id: Date.now(),
      sizeIndex,
      min_quantity: "",
      price: ""
    }]);
  };

  const removePriceTier = (index) => {
    setPriceTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e) => {
    if (['Enter', 'Tab', ','].includes(e.key)) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !product.tags.includes(newTag)) {
        setProduct(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setProduct(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      Object.entries(product).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === 'tags') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      sizes.forEach((size, index) => {
        formData.append(`sizes[${index}][size]`, size.size);
        formData.append(`sizes[${index}][unit]`, size.unit);
        formData.append(`sizes[${index}][price]`, size.price);
        formData.append(`sizes[${index}][cost_price]`, size.cost_price || '');
        formData.append(`sizes[${index}][quantity]`, size.quantity);
        formData.append(`sizes[${index}][is_default]`, size.is_default);
      });

      priceTiers.forEach((tier, index) => {
        formData.append(`price_tiers[${index}][size_index]`, tier.sizeIndex);
        formData.append(`price_tiers[${index}][min_quantity]`, tier.min_quantity);
        formData.append(`price_tiers[${index}][price]`, tier.price);
      });

      if (product.image) {
        formData.append('image', product.image);
      }

      images.forEach((img, index) => {
        formData.append(`additional_images[${index}]`, img.file);
      });

      await createProduct(formData).unwrap();
      toast.success("Product created successfully!");
      navigate("/vendor/products");
    } catch (err) {
      toast.error(err.data?.message || "Failed to create product");
      console.error("Product creation error:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Create New Product</h2>
          <button
            onClick={() => navigate("/vendor/products")}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full md:w-auto"
          >
            Back to All Products
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Product Name*</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={product.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Brand*</label>
                <select
                  name="brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={product.brand}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Short Description*</label>
                <input
                  type="text"
                  name="short_description"
                  maxLength="160"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={product.short_description}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{product.short_description.length}/160 characters</p>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Full Description*</label>
                <textarea
                  name="description"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={product.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Category*</label>
                <select
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={product.category}
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedCategoryId(e.target.value);
                    setProduct(prev => ({ ...prev, subcategory: "" }));
                  }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                <select
                  name="subcategory"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={product.subcategory}
                  onChange={handleChange}
                  disabled={!product.category}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Sizes & Pricing Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Product Sizes & Pricing</h3>
              <button
                type="button"
                onClick={addSize}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 w-full md:w-auto"
              >
                + Add Size
              </button>
            </div>
            
            <div className="space-y-4">
              {sizes.map((size, index) => (
                <div key={size.id} className="border rounded-lg p-3 md:p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">Size*</label>
                      <input
                        type="text"
                        placeholder="e.g., 500"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        value={size.size}
                        onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">Unit*</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        value={size.unit}
                        onChange={(e) => handleSizeChange(index, "unit", e.target.value)}
                        required
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">Price (₹)*</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        value={size.price}
                        onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">Cost Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        value={size.cost_price}
                        onChange={(e) => handleSizeChange(index, "cost_price", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-medium text-gray-700">Quantity*</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        value={size.quantity}
                        onChange={(e) => handleSizeChange(index, "quantity", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`default-size-${size.id}`}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={size.is_default}
                        onChange={(e) => {
                          handleSizeChange(index, "is_default", e.target.checked);
                          if (e.target.checked) {
                            setSizes(prev => prev.map((s, i) => 
                              i === index ? s : { ...s, is_default: false }
                            ));
                          }
                        }}
                      />
                      <label htmlFor={`default-size-${size.id}`} className="block text-xs md:text-sm text-gray-700">
                        Default size
                      </label>
                    </div>
                  </div>
                  
                  {/* Price Tiers for this size */}
                  <div className="mt-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <h4 className="text-xs md:text-sm font-medium text-gray-700">Bulk Pricing Tiers</h4>
                      <button
                        type="button"
                        onClick={() => addPriceTier(index)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 w-full sm:w-auto"
                      >
                        + Add Tier
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {priceTiers.filter(tier => tier.sizeIndex === index).map((tier) => (
                        <div key={tier.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="block text-xs text-gray-500">Min Quantity*</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs"
                              value={tier.min_quantity}
                              onChange={(e) => handlePriceTierChange(
                                priceTiers.findIndex(t => t.id === tier.id),
                                "min_quantity",
                                e.target.value
                              )}
                              required
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="block text-xs text-gray-500">Price (₹)*</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs"
                              value={tier.price}
                              onChange={(e) => handlePriceTierChange(
                                priceTiers.findIndex(t => t.id === tier.id),
                                "price",
                                e.target.value
                              )}
                              required
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removePriceTier(
                                priceTiers.findIndex(t => t.id === tier.id)
                              )}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 w-full"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {sizes.length > 1 && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs md:text-sm font-medium hover:bg-red-700"
                      >
                        Remove Size
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Main Image */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Main Image*</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex">
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                      required
                    />
                  </label>
                  {product.image && (
                    <span className="text-sm text-gray-500 truncate max-w-xs">{product.image.name}</span>
                  )}
                </div>
                {preview && (
                  <div className="mt-2">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 rounded-lg object-cover border"
                    />
                  </div>
                )}
              </div>
              
              {/* Additional Images */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Additional Images</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex">
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Choose Files
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImagesChange}
                      multiple
                    />
                  </label>
                </div>
                
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square">
                      <img
                        src={img.preview}
                        alt={`Preview ${img.id}`}
                        className="w-full h-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(images.findIndex(i => i.id === img.id))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tags & Status Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 inline-flex text-blue-400 hover:text-blue-600"
                      >
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type tag and press enter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <p className="text-xs text-gray-500">Press enter or comma(,) to add tags</p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="is_featured"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={product.is_featured}
                  onChange={handleChange}
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Show Product To Others
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/vendor/products")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductPage;