import { useState, useCallback } from "react";
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
    description: "",
    price: "",
    stock: "",
    discount: "",
    tags: "",
    status: "active",
    category: "",
    subcategory: "",
    brand: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [variants, setVariants] = useState([{ 
    name: "", 
    price: "", 
    quantity: "", 
    image: null, 
    other: "",
    imagePreview: null 
  }]);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: subcategories = [] } = useGetSubcategoriesByCategoryQuery(selectedCategoryId, {
    skip: !selectedCategoryId,
  });
  


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };
  
  const handleVariantImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      setVariants(prev => prev.map((variant, i) => 
        i === index ? { 
          ...variant, 
          image: file,
          imagePreview: URL.createObjectURL(file)
        } : variant
      ));
    }
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { 
      name: "", 
      price: "", 
      quantity: "", 
      image: null, 
      other: "",
      imagePreview: null 
    }]);
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Append main product data
      Object.entries(product).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      // Append variants data
      variants.forEach((variant, index) => {
        formData.append(`variants[${index}][name]`, variant.name);
        formData.append(`variants[${index}][price]`, variant.price);
        formData.append(`variants[${index}][quantity]`, variant.quantity);
        formData.append(`variants[${index}][other]`, variant.other);
        if (variant.image) {
          formData.append(`variants[${index}][image]`, variant.image);
        }
      });

      await createProduct(formData).unwrap();
      toast.success("Product created successfully!");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.data?.message || "Failed to create product");
      console.error("Product creation error:", err);
    }
  };
console.log(brands)
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Product</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand*</label>
                <select
                  name="brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={product.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Pricing & Inventory Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Pricing & Inventory</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)*</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.price}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.discount}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity*</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.stock}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Categories</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                <select
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.category}
                  onChange={(e) => {
                    handleChange(e);
                    setSelectedCategoryId(e.target.value);
                  }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <select
                  name="subcategory"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Product Image Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Main Product Image</h3>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image*</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
                    <span className="text-sm text-gray-500">{product.image.name}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WEBP (Max 5MB)</p>
              </div>
              {preview && (
                <div className="flex-shrink-0">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 rounded-md object-cover border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Product Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
              >
                + Add Variant
              </button>
            </div>
            
            {variants.map((variant, index) => (
              <div key={index} className="border rounded-md p-4 mb-4 bg-white">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name*</label>
                    <input
                      type="text"
                      placeholder="e.g., Size, Color"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={variant.quantity}
                      onChange={(e) => handleVariantChange(index, "quantity", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Attributes</label>
                    <input
                      type="text"
                      placeholder="e.g., Color: Red, Size: XL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={variant.other}
                      onChange={(e) => handleVariantChange(index, "other", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variant Image</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer">
                        <span className="px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Choose File
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleVariantImageChange(index, e)}
                        />
                      </label>
                      {variant.image && (
                        <span className="text-sm text-gray-500">{variant.image.name}</span>
                      )}
                    </div>
                    {variant.imagePreview && (
                      <div className="mt-2">
                        <img
                          src={variant.imagePreview}
                          alt="Variant preview"
                          className="w-16 h-16 rounded-md object-cover border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {variants.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200"
                    >
                      Remove Variant
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tags & Status Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  placeholder="Comma separated tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.tags}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">e.g., electronics, mobile, premium</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={product.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductPage;