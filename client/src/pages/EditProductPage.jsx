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
  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  
  const { data: product, isLoading, isError } = useGetProductByIdQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: subcategoriesData = [] } = useGetSubcategoriesByCategoryQuery(selectedCategoryId, {
    skip: !selectedCategoryId,
  });
  
  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];

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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    brand: "",
    category: "",
    subcategory: "",
    image: null,
    tags: [],
    currency: "INR",
    weight: "",
    weight_unit: "kg",
    dimensions: "",
    product_type: "physical",
    shipping_info: "",
    video_url: "",
    warranty: "",
    content_embeds: "",
    features: []
  });

  const [sizes, setSizes] = useState([{ 
    size: "",
    unit: "gram", 
    price: "", 
    quantity: "",
    is_default: false,
  }]);

  const [priceTiers, setPriceTiers] = useState([{
    sizeIndex: 0,
    min_quantity: "",
    price: ""
  }]);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [preview, setPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({
    sizes: false,
    image: false
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        short_description: product.short_description || "",
        brand: product.brand?.id || product.brand || "",
        category: product.category?.id || product.category || "",
        subcategory: product.subcategory?.id || product.subcategory || "",
        tags: product.tags ? extractTagNames(product.tags) : [],
        currency: product.currency || "INR",
        weight: product.weight || "",
        weight_unit: product.weight_unit || "kg",
        dimensions: product.dimensions || "",
        product_type: product.product_type || "physical",
        shipping_info: product.shipping_info || "",
        video_url: product.video_url || "",
        warranty: product.warranty || "",
        content_embeds: product.content_embeds || "",
        features: product.features || []
      });

      setSelectedCategoryId(product.category?.id || product.category || "");
      
      if (product.sizes) {
        setSizes(product.sizes.map(size => ({
          id: size.id,
          size: size.size,
          unit: size.unit,
          price: size.price,
          quantity: size.quantity,
          is_default: size.is_default,
        })));

        const tiers = [];
        product.sizes.forEach((size, sizeIndex) => {
          if (size.price_tiers?.length > 0) {
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
        setExistingImages(product.images);
        const featuredImage = product.images.find(img => img.is_featured);
        if (featuredImage) {
          setPreview(featuredImage.image);
        }
      }
    }
  }, [product]);

  // Validate form
  useEffect(() => {
    const hasEmptySizes = sizes.length === 0 || sizes.some(size => 
      !size.size || !size.price || isNaN(size.price) || parseFloat(size.price) <= 0
    );
    
    const hasNoImage = !preview && existingImages.length === 0 && !formData.image;
    
    setFormErrors({
      sizes: hasEmptySizes,
      image: hasNoImage
    });
  }, [sizes, preview, existingImages, formData.image]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'category') {
      setSelectedCategoryId(value);
      setFormData(prev => ({ ...prev, subcategory: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error("You can upload a maximum of 5 images");
      return;
    }
    
    if (files.length > 0) {
      const uploadedImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setNewImages(prev => [...prev, ...uploadedImages]);
    }
  };

  const removeExistingImage = (imageId) => {
    setRemovedImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    
    const removedImage = existingImages.find(img => img.id === imageId);
    if (removedImage?.is_featured) {
      setPreview(null);
    }
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
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
      if (!formData.features.includes(featureInput.trim())) {
        setFormData(prev => ({
          ...prev,
          features: [...prev.features, featureInput.trim()]
        }));
      }
      setFeatureInput("");
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
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
      is_default: false,
    }]);
  };

  const removeSize = (index) => {
    if (sizes.length > 1) {
      const sizeToRemove = sizes[index];
      setPriceTiers(prev => prev.filter(tier => 
        tier.sizeIndex !== index && tier.sizeId !== sizeToRemove?.id
      ));
      setSizes(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.warning("At least one size is required");
    }
  };

  const addPriceTier = (sizeIndex) => {
    const sizeId = sizes[sizeIndex]?.id;
    setPriceTiers(prev => [...prev, { 
      sizeIndex,
      sizeId,
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
    if (sizes.length === 0) {
      toast.error("At least one product size is required");
      return;
    }

    const hasInvalidSizes = sizes.some(size => 
      !size.size || !size.price || isNaN(size.price) || parseFloat(size.price) <= 0
    );
    
    if (hasInvalidSizes) {
      toast.error("Please fill all required size fields (size name and price)");
      return;
    }
    
    if (!preview && existingImages.length === 0 && !formData.image) {
      toast.error("Main image is required");
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add basic product info
      Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        if (key === 'tags') {
          // Extract tag names if they are objects
          const tagNames = value.map(tag => typeof tag === 'object' ? tag.name : tag);
          formDataToSend.append(key, JSON.stringify(tagNames));
        } else if (key === 'features') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      }
    });

      // Add sizes as JSON
      formDataToSend.append('sizes', JSON.stringify(sizes));

      // Add price tiers as JSON
      formDataToSend.append('price_tiers', JSON.stringify(priceTiers));
      formDataToSend.append('tags', JSON.stringify(extractTagNames(formData.tags)));

      // Add removed image IDs
      removedImageIds.forEach(id => {
        formDataToSend.append('removed_images', id);
      });

      // Add main image if changed
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Add new additional images
      newImages.forEach(img => {
        formDataToSend.append('additional_images', img.file);
      });

      await updateProduct({ id, data: formDataToSend }).unwrap();
      toast.success("Product updated successfully!");
      navigate(`/${role}/products`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to update product");
      console.error("Product update error:", err);
    }
  };

  // Check if form is valid
  const isFormValid = !formErrors.sizes && !formErrors.image && 
    formData.name && formData.description && formData.short_description && 
    formData.brand && formData.category;
  const extractTagNames = (tags) => {
  return tags.map(tag => typeof tag === 'object' ? tag.name : tag);
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
          <h2 className="text-2xl font-extrabold text-gray-900">Edit Product</h2>
          <button
            onClick={() => navigate(`/${role}/products`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 w-full md:w-auto cursor-pointer"
          >
            Back to Products
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Brand*</label>
                <select
                  name="brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Currency*</label>
                <select
                  name="currency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={formData.currency}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={formData.product_type}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.short_description}
                  onChange={handleChange}
                  required
                  maxLength={450}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.short_description.length}/450 characters
                </p>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Description*</label>
                <textarea
                  name="description"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              {/* Tags Field */}
              <div className="space-y-1 md:col-span-2">
  <label className="block text-sm font-bold text-gray-700">Tags</label>
  <div className="flex flex-wrap gap-2 items-center">
    {formData.tags.map((tag, index) => (
      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
        {typeof tag === 'object' ? tag.name : tag}
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
      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Subcategory</label>
                <select
                  name="subcategory"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Product weight"
                  />
                  <select
                    name="weight_unit"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base cursor-pointer"
                    value={formData.weight_unit}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g., 10x5x2 cm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Shipping Information</label>
                <input
                  type="text"
                  name="shipping_info"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.shipping_info}
                  onChange={handleChange}
                  placeholder="e.g., Free shipping, Special handling"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Warranty Information</label>
                <input
                  type="text"
                  name="warranty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.warranty}
                  onChange={handleChange}
                  placeholder="e.g., 1 year manufacturer warranty"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Product Video URL</label>
                <input
                  type="url"
                  name="video_url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.video_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/embed/example"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Content Embeds</label>
                <textarea
                  name="content_embeds"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm md:text-base"
                  value={formData.content_embeds}
                  onChange={handleChange}
                  placeholder="HTML or iframe code for embedded content"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Product Features</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {formData.features.map((feature, index) => (
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
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Add key features or selling points of the product</p>
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
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 w-full md:w-auto cursor-pointer"
              >
                + Add Size
              </button>
            </div>
            
            {formErrors.sizes && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm font-bold rounded">
                {sizes.length === 0 
                  ? "At least one product size is required" 
                  : "Please fill all required size fields (size name and price)"}
              </div>
            )}
            
            <div className="space-y-4">
              {sizes.map((size, index) => (
                <div key={size.id || index} className="border-3 border-cyan-700 rounded-lg p-3 md:p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Size*</label>
                      <input
                        type="text"
                        placeholder="Medium"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                        value={size.size}
                        onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Unit*</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
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
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Actual Price (₹)*</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                        value={size.price}
                        onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                        placeholder="Product price"
                        required
                      />
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
                      {priceTiers.filter(tier => tier.sizeIndex === index || tier.sizeId === size.id).map((tier, tierIndex) => {
                        const tierKey = tier.id || `${tier.sizeIndex}-${tier.min_quantity}-${tierIndex}`;
                        const tierIdx = priceTiers.findIndex(t => 
                          (t.id && tier.id && t.id === tier.id) ||
                          (t.sizeIndex === tier.sizeIndex && t.min_quantity === tier.min_quantity)
                        );

                        return (
                          <div key={tierKey} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="block text-md font-bold text-gray-500">Min Quantity*</label>
                              <input
                                type="number"
                                min="1"
                                className="w-full h-10 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs"
                                value={tier.min_quantity}
                                onChange={(e) => handlePriceTierChange(tierIdx, "min_quantity", e.target.value)}
                                required
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="block text-md font-bold text-gray-500">Price (₹)*</label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="w-full h-10 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs"
                                value={tier.price}
                                onChange={(e) => handlePriceTierChange(tierIdx, "price", e.target.value)}
                                required
                              />
                            </div>
                            
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removePriceTier(tierIdx)}
                                className="px-2 py-1 h-10 bg-red-100 text-red-700 rounded-md text-md font-bold hover:bg-red-200 w-full cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  {formData.image && (
                    <span className="text-sm text-gray-500 truncate max-w-xs">{formData.image.name}</span>
                  )}
                </div>
                {(preview || (existingImages.length > 0 && existingImages.some(img => img.is_featured))) && (
                  <div className="mt-2">
                    <img
                      src={preview || existingImages.find(img => img.is_featured)?.image}
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
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                      Choose Files
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImagesChange}
                      multiple
                      disabled={existingImages.length + newImages.length >= 5}
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {existingImages.length + newImages.length} / 5 images selected
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {/* Existing images */}
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative aspect-square">
                      <img
                        src={img.image}
                        alt={`Preview ${img.id}`}
                        className="w-full h-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* New images */}
                  {newImages.map((img, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={img.preview}
                        alt={`New Preview ${index}`}
                        className="w-full h-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
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
              onClick={() => navigate(`/${role}/products`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !isFormValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
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