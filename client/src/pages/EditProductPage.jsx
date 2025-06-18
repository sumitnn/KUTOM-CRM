import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../features/product/productApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import {
  useGetCategoriesQuery,
  useGetSubcategoriesByCategoryQuery,
} from '../features/category/categoryApi';

const EditProductPage = ({ role = "vendor" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  
  const { data: product, isLoading, isError } = useGetProductByIdQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: subcategoriesData = [] } = useGetSubcategoriesByCategoryQuery(selectedCategoryId, {
    skip: !selectedCategoryId,
  });
  
  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    short_description: "",
    brand: "",
    category: "",
    subcategory: "",
    status: "draft",
    is_featured: false,
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [sizes, setSizes] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [preview, setPreview] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        short_description: product.short_description || "",
        brand: product.brand || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        status: product.status || "draft",
        is_featured: product.is_featured || false,
        tags: product.tags?.map(tag => tag.name) || [],
      });

      setSelectedCategoryId(product.category || "");
      
      if (product.sizes) {
        setSizes(product.sizes.map(size => ({
          id: size.id,
          name: size.name,
          size: size.size,
          unit: size.unit,
          price: size.price,
          cost_price: size.cost_price,
          quantity: size.quantity,
          is_default: size.is_default,
          is_active: size.is_active,
        })));

        // Extract price tiers
        const tiers = [];
        product.sizes.forEach((size, sizeIndex) => {
          if (size.price_tiers && size.price_tiers.length > 0) {
            size.price_tiers.forEach(tier => {
              tiers.push({
                id: tier.id,
                sizeIndex,
                sizeId: size.id,
                min_quantity: tier.min_quantity,
                price: tier.price,
              });
            });
          }
        });
        setPriceTiers(tiers);
      }

      if (product.images) {
        setImages(product.images);
      }
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'category') {
      setSelectedCategoryId(value);
      setFormData(prev => ({ ...prev, subcategory: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
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
      setNewImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index, isNew = false) => {
    if (isNew) {
      setNewImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const imageToRemove = images[index];
      setRemovedImages(prev => [...prev, imageToRemove.id]);
      setImages(prev => prev.filter((_, i) => i !== index));
    }
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
      id: Date.now(), // Temporary ID for new sizes
      name: "",
      size: "",
      unit: "g", 
      price: "", 
      cost_price: "",
      quantity: "", 
      is_default: false,
      is_active: true,
    }]);
  };

  const removeSize = (index) => {
    // Remove price tiers associated with this size
    const sizeToRemove = sizes[index];
    setPriceTiers(prev => prev.filter(tier => 
      tier.sizeIndex !== index && tier.sizeId !== sizeToRemove.id
    ));
    
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const addPriceTier = (sizeIndex) => {
    const sizeId = sizes[sizeIndex]?.id;
    setPriceTiers(prev => [...prev, { 
      id: Date.now(), // Temporary ID for new tiers
      sizeIndex,
      sizeId,
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
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append basic product data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === 'tags') {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      // Append sizes
      sizes.forEach((size, index) => {
        if (size.id) formDataToSend.append(`sizes[${index}][id]`, size.id);
        formDataToSend.append(`sizes[${index}][size]`, size.size);
        formDataToSend.append(`sizes[${index}][unit]`, size.unit);
        formDataToSend.append(`sizes[${index}][price]`, size.price);
        formDataToSend.append(`sizes[${index}][cost_price]`, size.cost_price || '');
        formDataToSend.append(`sizes[${index}][quantity]`, size.quantity);
        formDataToSend.append(`sizes[${index}][is_default]`, size.is_default);
        formDataToSend.append(`sizes[${index}][is_active]`, size.is_active);
      });

      // Append price tiers
      priceTiers.forEach((tier, index) => {
        if (tier.id) formDataToSend.append(`price_tiers[${index}][id]`, tier.id);
        if (tier.sizeId) formDataToSend.append(`price_tiers[${index}][size_id]`, tier.sizeId);
        formDataToSend.append(`price_tiers[${index}][min_quantity]`, tier.min_quantity);
        formDataToSend.append(`price_tiers[${index}][price]`, tier.price);
      });

      // Append removed images
      removedImages.forEach((imgId, index) => {
        formDataToSend.append(`removed_images[${index}]`, imgId);
      });

      // Append main image if changed
      if (mainImage) {
        formDataToSend.append('image', mainImage);
      }

      // Append new additional images
      newImages.forEach((img, index) => {
        formDataToSend.append(`additional_images[${index}]`, img.file);
      });

      await updateProduct({ id, data: formDataToSend }).unwrap();
      toast.success("Product updated successfully!");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.data?.message || "Failed to update product");
      console.error("Product update error:", err);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <span className="loading loading-spinner text-error loading-lg"></span>
    </div>
  );
  
  if (isError) return <p className="text-center mt-10 text-red-500">Failed to load product.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={() => navigate("/admin/products")}
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
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">SKU*</label>
                <input
                  type="text"
                  name="sku"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Brand*</label>
                <select
                  name="brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={formData.brand}
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
                  value={formData.short_description}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{formData.short_description.length}/160 characters</p>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Full Description*</label>
                <textarea
                  name="description"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  value={formData.description}
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
                  value={formData.category}
                  onChange={handleChange}
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
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={!formData.category}
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
                        placeholder="e.g., medium"
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
                      {priceTiers.filter(tier => 
                        tier.sizeIndex === index || tier.sizeId === size.id
                      ).map((tier) => (
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
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`active-size-${size.id}`}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={size.is_active}
                        onChange={(e) => handleSizeChange(index, "is_active", e.target.checked)}
                      />
                      <label htmlFor={`active-size-${size.id}`} className="block text-xs md:text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md text-xs md:text-sm font-medium hover:bg-red-700"
                    >
                      Remove Size
                    </button>
                  </div>
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
                <label className="block text-sm font-medium text-gray-700">Main Image</label>
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
                    />
                  </label>
                  {mainImage && (
                    <span className="text-sm text-gray-500 truncate max-w-xs">{mainImage.name}</span>
                  )}
                </div>
                {(preview || (images.length > 0 && images[0].is_featured)) && (
                  <div className="mt-2">
                    <img
                      src={preview || images.find(img => img.is_featured)?.image}
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
                  {/* Existing images */}
                  {images.filter(img => !removedImages.includes(img.id)).map((img, index) => (
                    <div key={img.id} className="relative aspect-square">
                      <img
                        src={img.image}
                        alt={`Preview ${img.id}`}
                        className="w-full h-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* New images */}
                  {newImages.map((img, index) => (
                    <div key={img.id} className="relative aspect-square">
                      <img
                        src={img.preview}
                        alt={`New Preview ${img.id}`}
                        className="w-full h-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
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
                  {formData.tags.map(tag => (
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
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    name="is_featured"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.is_featured}
                    onChange={handleChange}
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                    Featured Product
                  </label>
                </div>
                
                
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/${role}/products`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;