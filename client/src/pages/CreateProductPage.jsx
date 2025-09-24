import { useState, useEffect, useCallback } from "react";
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
  const [tagInput, setTagInput] = useState("");

  const [product, setProduct] = useState({
    name: "",
    description: "",
    short_description: "",
    brand: "",
    category: "",
    subcategory: "",
    image: null,
    tags: [],
    currency: "USD",
    weight: "",
    weight_unit: "kg",
    dimensions: "",
    product_type: "physical",
    video_url: "",
    warranty: "",
    features: [],
  });

  const [preview, setPreview] = useState(null);
  const [sizes, setSizes] = useState([{ 
    size: "",
    unit: "gram", 
    price: "", 
    quantity: "",
    discount_percentage: "0",
    gst_percentage: "0",
    final_price: "0.00",
    is_default: false,
  }]);

  const [priceTiers, setPriceTiers] = useState([{
    sizeIndex: 0,
    min_quantity: "",
    price: ""
  }]);

  const [images, setImages] = useState([]);
  const [featureInput, setFeatureInput] = useState("");

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: subcategoriesData = [] } = useGetSubcategoriesByCategoryQuery(selectedCategoryId, {
    skip: !selectedCategoryId,
  });

  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];

  // Calculate final price for a single size
  const calculateFinalPrice = useCallback((size) => {
    const price = parseFloat(size.price) || 0;
    const discountPercentage = parseFloat(size.discount_percentage) || 0;
    const gstPercentage = parseFloat(size.gst_percentage) || 0;
    
    // Calculate price after discount
    const priceAfterDiscount = price - (price * discountPercentage / 100);
    
    // Calculate GST amount on discounted price
    const gstAmount = priceAfterDiscount * gstPercentage / 100;
    
    // Final price = discounted price + GST
    const finalPrice = priceAfterDiscount + gstAmount;
    
    return finalPrice.toFixed(2);
  }, []);

  // Calculate final prices only when specific fields change
  useEffect(() => {
    // Check if any size has price, discount or GST values that need calculation
    const needsUpdate = sizes.some(size => {
      const currentFinal = parseFloat(size.final_price) || 0;
      const calculatedFinal = parseFloat(calculateFinalPrice(size)) || 0;
      return currentFinal !== calculatedFinal;
    });

    if (needsUpdate) {
      const updatedSizes = sizes.map(size => ({
        ...size,
        final_price: calculateFinalPrice(size)
      }));
      
      setSizes(updatedSizes);
    }
  }, [sizes, calculateFinalPrice]); // Only recalculate when sizes array changes

  // Add form validation state
  const [formErrors, setFormErrors] = useState({
    sizes: false,
    image: false
  });

  // Validate form whenever sizes or image changes
  useEffect(() => {
    const hasEmptySizes = sizes.some(size => 
      !size.size || !size.price || isNaN(size.price) || parseFloat(size.price) <= 0
    );
    
    setFormErrors({
      sizes: sizes.length === 0 || hasEmptySizes,
      image: !product.image
    });
  }, [sizes, product.image]);

  const currencyOptions = [
    { value: "INR", label: "Indian Rupee (INR)" },
    { value: "USD", label: "US Dollar (USD)" },
  ];

  const weightUnitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "oz", label: "Ounces (oz)" },
  ];

  const productTypeOptions = [
    { value: "physical", label: "Physical Product" },
    { value: "digital", label: "Digital Product" },
    { value: "service", label: "Service" },
    { value: "subscription", label: "Subscription" },
  ];

  // Generate discount percentage options from 0% to 100%
  const discountPercentageOptions = Array.from({ length: 101 }, (_, i) => ({
    value: i.toString(),
    label: `${i}%`
  }));

  // Generate GST percentage options from 0% to 40%
  const gstPercentageOptions = Array.from({ length: 41 }, (_, i) => ({
    value: i.toString(),
    label: `${i}% GST`
  }));

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
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!product.tags.includes(tagInput.trim())) {
        setProduct(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setProduct(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureInputChange = (e) => {
    setFeatureInput(e.target.value);
  };

  const addFeature = (e) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      if (!product.features.includes(featureInput.trim())) {
        setProduct(prev => ({
          ...prev,
          features: [...prev.features, featureInput.trim()]
        }));
      }
      setFeatureInput("");
    }
  };

  const removeFeature = (index) => {
    setProduct(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
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
      size: "",
      unit: "gram", 
      price: "", 
      quantity: "",
      discount_percentage: "0",
      gst_percentage: "0",
      final_price: "0.00",
      is_default: false,
    }]);
  };

  const removeSize = (index) => {
    if (sizes.length > 1) {
      setSizes(prev => prev.filter((_, i) => i !== index));
      // Adjust sizeIndex for price tiers
      setPriceTiers(prev => prev.map(tier => ({
        ...tier,
        sizeIndex: tier.sizeIndex > index ? tier.sizeIndex - 1 : tier.sizeIndex
      })).filter(tier => tier.sizeIndex !== index));
    } else {
      toast.warning("At least one size is required");
    }
  };

  const addPriceTier = (sizeIndex) => {
    setPriceTiers(prev => [...prev, { 
      sizeIndex,
      min_quantity: "",
      price: ""
    }]);
  };

  const removePriceTier = (index) => {
    setPriceTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const hasEmptySizes = sizes.some(size => 
      !size.size || !size.price || isNaN(size.price) || parseFloat(size.price) <= 0
    );
    
    if (hasEmptySizes || sizes.length === 0) {
      toast.error("Please fill all required size fields");
      return;
    }
    
    if (!product.image) {
      toast.error("Main image is required");
      return;
    }

    try {
      const formData = new FormData();
      
      // Add basic product info
      Object.entries(product).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === 'tags' || key === 'features') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      // Add sizes as JSON
      formData.append('sizes', JSON.stringify(sizes));

      // Add price tiers as JSON
      formData.append('price_tiers', JSON.stringify(priceTiers));

      // Add main image
      if (product.image) {
        formData.append('image', product.image);
      }

      // Add additional images
      images.forEach((img) => {
        formData.append('additional_images', img.file);
      });

      await createProduct(formData).unwrap();
      toast.success("Product created successfully!");
      navigate("/vendor/products");
    } catch (err) {
      toast.error(err.data?.message || "Failed to create product");
      console.error("Product creation error:", err);
    }
  };

  // Check if form is valid
  const isFormValid = !formErrors.sizes && !formErrors.image && 
    product.name && product.description && product.short_description && 
    product.brand && product.category;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-extrabold text-gray-900">Create New Product</h2>
          <button
            onClick={() => navigate("/vendor/products")}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 w-full md:w-auto cursor-pointer"
          >
            Back to All Products
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-extrabold text-gray-800 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Product Name*</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={product.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Brand*</label>
                <select
                  name="brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
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
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Currency*</label>
                <select
                  name="currency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={product.currency}
                  onChange={handleChange}
                  required
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Product Type*</label>
                <select
                  name="product_type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={product.product_type}
                  onChange={handleChange}
                  required
                >
                  {productTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Short Description*</label>
                <textarea
                  name="short_description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={product.short_description}
                  onChange={handleChange}
                  required
                  maxLength={450}
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Description*</label>
                <textarea
                  name="description"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={product.description}
                  onChange={handleChange}
                  required
                  maxLength={2000}
                />
              </div>

              {/* Tags Field */}
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                      >
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={addTag}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Add tags to help customers find your product</p>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Category*</label>
                <select
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
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
                <label className="block text-sm font-bold text-gray-700">Subcategory</label>
                <select
                  name="subcategory"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500  focus:outline-none text-sm md:text-base cursor-pointer"
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

          {/* Product Specifications Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Weight</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="weight"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                    value={product.weight}
                    onChange={handleChange}
                    placeholder="Product weight"
                  />
                  <select
                    name="weight_unit"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:border-blue-500  focus:outline-none text-sm md:text-base cursor-pointer"
                    value={product.weight_unit}
                    onChange={handleChange}
                  >
                    {weightUnitOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Dimensions</label>
                <input
                  type="text"
                  name="dimensions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                  value={product.dimensions}
                  onChange={handleChange}
                  placeholder="e.g., 10x5x2 cm"
                />
              </div>
              
             
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Warranty Information</label>
                <input
                  type="text"
                  name="warranty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                  value={product.warranty}
                  onChange={handleChange}
                  placeholder="e.g., 1 year manufacturer warranty"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Product Video URL</label>
                <input
                  type="url"
                  name="video_url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:ring-blue-500 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                  value={product.video_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/embed/example"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Product Features</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {product.features.map((feature, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-1.5 inline-flex text-green-400 hover:text-green-600 focus:outline-none"
                      >
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={featureInput}
                    onChange={handleFeatureInputChange}
                    onKeyDown={addFeature}
                    placeholder="Type a feature and press Enter"
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-1  focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 font-bold">Add key features ,hit enter button To add more..</p>
              </div>
            </div>
          </div>

          {/* Product Sizes & Pricing Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
              <h3 className="text-lg font-bold text-gray-800">Product Sizes & Pricing*</h3>
              <button
                type="button"
                onClick={addSize}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold  hover:bg-blue-700 w-full md:w-auto cursor-pointer"
              >
                + Add Size
              </button>
            </div>
            
            {formErrors.sizes && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm font-bold rounded">
                Please fill all required size fields (size name and price)
              </div>
            )}
            
            <div className="space-y-4">
              {sizes.map((size, index) => (
                <div key={index} className="border-3 border-cyan-700 rounded-lg p-3 md:p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Size*</label>
                      <input
                        type="text"
                        placeholder="Medium"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1  focus:ring-blue-500 text-sm"
                        value={size.size}
                        onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Unit*</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1  focus:outline-none focus:ring-blue-500 text-sm cursor-pointer"
                        value={size.unit}
                        onChange={(e) => handleSizeChange(index, "unit", e.target.value)}
                        required
                      >
                        <option value="gram">Gram</option>
                        <option value="kg">Kilogram</option>
                        <option value="ml">ML</option>
                        <option value="litre">Litre</option>
                        <option value="pcs">Pieces</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700"> Actual Price (₹)*</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1  focus:outline-none focus:ring-blue-500 text-sm"
                        value={size.price}
                        onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                        placeholder="Product price"
                        required
                      />
                    </div>
                  </div>

                  {/* Discount and GST fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Discount %</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1  focus:outline-none focus:ring-blue-500 text-sm cursor-pointer"
                        value={size.discount_percentage}
                        onChange={(e) => handleSizeChange(index, "discount_percentage", e.target.value)}
                      >
                        {discountPercentageOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">GST %</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1  focus:outline-none focus:ring-blue-500 text-sm cursor-pointer"
                        value={size.gst_percentage}
                        onChange={(e) => handleSizeChange(index, "gst_percentage", e.target.value)}
                      >
                        {gstPercentageOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Final Price (₹)</label>
                      <div className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm">
                        {size.final_price || "0.00"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Tiers for this size */}
                  <div className="mt-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <h4 className="text-xs md:text-sm font-bold text-gray-700">Bulk Pricing Tiers</h4>
                      <button
                        type="button"
                        onClick={() => addPriceTier(index)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-extrabold hover:bg-blue-200 w-full sm:w-auto cursor-pointer"
                      >
                        + Add Tier
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {priceTiers.filter(tier => tier.sizeIndex === index).map((tier, tierIndex) => (
                        <div key={tierIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="block text-md font-bold text-gray-500">Min Quantity*</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full h-10 px-2 py-1 border border-gray-300 rounded-md focus:ring-1  focus:outline-none focus:ring-blue-500 text-xs"
                              value={tier.min_quantity}
                              onChange={(e) => handlePriceTierChange(
                                priceTiers.findIndex(t => t.sizeIndex === index && t.min_quantity === tier.min_quantity),
                                "min_quantity",
                                e.target.value
                              )}
                              required
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="block text-md font-bold text-gray-500">Price (₹)*</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className="w-full h-10 px-2 py-1 border border-gray-300 rounded-md focus:ring-1  focus:outline-none focus:ring-blue-500 text-xs"
                              value={tier.price}
                              onChange={(e) => handlePriceTierChange(
                                priceTiers.findIndex(t => t.sizeIndex === index && t.min_quantity === tier.min_quantity),
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
                                priceTiers.findIndex(t => t.sizeIndex === index && t.min_quantity === tier.min_quantity)
                              )}
                              className="px-2 py-1 h-10 bg-red-100 text-red-700 rounded-md text-md font-bold hover:bg-red-200 w-full cursor-pointer"
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
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs md:text-sm font-bold hover:bg-red-700 cursor-pointer"
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Images</h3>
            
            {formErrors.image && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 font-bold text-sm rounded">
                Main image is required
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Main Image */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">Main Image*</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex">
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1  focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
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
                <label className="block text-sm font-bold text-gray-700">Additional Images (Max 5)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex">
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1  focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                      Choose Files
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImagesChange}
                      multiple
                      disabled={images.length >= 5}
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {images.length} / 5 images selected
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={img.preview}
                        alt={`Preview ${index}`}
                        className="w-full h-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 cursor-pointer"
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

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/vendor/products")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-1  focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
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