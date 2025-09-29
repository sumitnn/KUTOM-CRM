import { useEffect, useState, useCallback } from "react";
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
    video_url: "",
    warranty: "",
    features: []
  });

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

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [preview, setPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({
    sizes: false,
    image: false
  });

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
  }, [sizes, calculateFinalPrice]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.product_detail?.name || "",
        description: product.product_detail?.description || "",
        short_description: product.product_detail?.short_description || "",
        brand: product.product_detail?.brand || "",
        category: product.product_detail?.category || "",
        subcategory: product.product_detail?.subcategory || "",
        tags: product.product_detail?.tags || [],
        currency: product.product_detail?.currency || "INR",
        weight: product.product_detail?.weight || "",
        weight_unit: product.product_detail?.weight_unit || "kg",
        dimensions: product.product_detail?.dimensions || "",
        product_type: product.product_detail?.product_type || "physical",
        video_url: product.product_detail?.video_url || "",
        warranty: product.product_detail?.warranty || "",
        features: product.product_detail?.features || []
      });

      setSelectedCategoryId(product.product_detail?.category || "");
      
      // Set sizes from variants
      if (product.variants_detail && product.variants_detail.length > 0) {
        const sizesData = product.variants_detail.map(variant => {
          // Get the first price object (assuming there's at least one)
          const priceData = variant.product_variant_prices && variant.product_variant_prices.length > 0 
            ? variant.product_variant_prices[0] 
            : {};
          
          // Extract unit from variant name or use default
          let unit = "gram";
          const sizeName = variant.name || "";
          
          // Try to extract unit from size name
          if (sizeName.includes("kg") || sizeName.toLowerCase().includes("kilo")) {
            unit = "kg";
          } else if (sizeName.includes("ml")) {
            unit = "ml";
          } else if (sizeName.includes("l") || sizeName.toLowerCase().includes("litre")) {
            unit = "litre";
          } else if (sizeName.includes("pcs") || sizeName.toLowerCase().includes("piece")) {
            unit = "pcs";
          }
          // Otherwise, use the default "gram"
          
          return {
            id: variant.id,
            size: variant.name,
            unit: unit,
            price: priceData.price || "0.00",
            quantity: "",
            discount: priceData.discount ? priceData.discount.toString() : "0",
            gst_percentage: priceData.gst_percentage ? priceData.gst_percentage.toString() : "0",
            final_price: priceData.actual_price || "0.00",
            is_default: variant.is_default || false,
          };
        });
        setSizes(sizesData);
        
        // Set price tiers from bulk prices
        const tiers = [];
        product.variants_detail.forEach((variant, sizeIndex) => {
          if (variant.bulk_prices?.length > 0) {
            variant.bulk_prices.forEach(tier => {
              tiers.push({
                id: tier.id,
                sizeIndex,
                sizeId: variant.id,
                min_quantity: tier.max_quantity?.toString() || tier.min_quantity?.toString() || "",
                price: tier.price,
              });
            });
          }
        });
        setPriceTiers(tiers);
      }

      if (product.product_detail?.images) {
        setExistingImages(product.product_detail.images);
        const featuredImage = product.product_detail.images.find(img => img.is_featured);
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
      discount: "0",
      gst_percentage: "0",
      final_price: "0.00",
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
          if (key === 'tags' || key === 'features') {
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
                      <label className="block text-xs md:text-sm font-bold text-gray-700"> Actual Price (₹)*</label>
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

                  {/* Discount and GST fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">Discount %</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
                         value={String(size.discount ?? "")}  
                        onChange={(e) => handleSizeChange(index, "discount", e.target.value)}
                      >
                        {discountPercentageOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs md:text-sm font-bold text-gray-700">GST %</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
                        value={String(size.gst_percentage ?? "")}
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
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                                value={tier.min_quantity}
                                onChange={(e) => handlePriceTierChange(tierIdx, "min_quantity", e.target.value)}
                                placeholder="Minimum quantity"
                                required
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="block text-md font-bold text-gray-500">Price (₹)*</label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                                value={tier.price}
                                onChange={(e) => handlePriceTierChange(tierIdx, "price", e.target.value)}
                                placeholder="Tier price"
                                required
                              />
                            </div>
                            
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removePriceTier(tierIdx)}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-bold hover:bg-red-200 w-full cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={size.is_default}
                        onChange={(e) => handleSizeChange(index, "is_default", e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      Set as default size
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 cursor-pointer"
                    >
                      Remove Size
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Images Section */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Images*</h3>
            
            {formErrors.image && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm font-bold rounded">
                Main image is required
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Image Upload */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Main Product Image</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Main product preview"
                        className="mx-auto h-40 object-contain rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null);
                          setFormData(prev => ({ ...prev, image: null }));
                        }}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500">
                          <span>Upload main image</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                            required={!preview && existingImages.length === 0}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Additional Images (Max 5)</h4>
                
                {/* Existing Images */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.image}
                        alt={`Product ${image.id}`}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 cursor-pointer"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {image.is_featured && (
                        <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* New Images */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {newImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.preview}
                        alt={`New image ${index}`}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 cursor-pointer"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="w-8 h-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500">
                        <span>Add more images</span>
                        <input
                          type="file"
                          multiple
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImagesChange}
                          disabled={existingImages.length + newImages.length >= 5}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {5 - existingImages.length - newImages.length} images remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6">
            <button
              type="button"
              onClick={() => navigate(`/${role}/products`)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 w-full sm:w-auto cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isUpdating}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
            >
              {isUpdating ? (
                <span className="flex items-center justify-center">
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Updating...
                </span>
              ) : (
                'Update Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;