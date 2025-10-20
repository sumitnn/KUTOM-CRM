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
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiImage,
  FiPackage,
  FiTag,
  FiSettings,
  FiDollarSign,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiEdit3
} from "react-icons/fi";

const EditProductPage = ({ role = "vendor" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [activeSection, setActiveSection] = useState("basic");
  
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
    const discountPercentage = parseFloat(size.discount_percentage || size.discount || 0);
    const gstPercentage = parseFloat(size.gst_percentage) || 0;
    
    const priceAfterDiscount = price - (price * discountPercentage / 100);
    const gstAmount = priceAfterDiscount * gstPercentage / 100;
    const finalPrice = priceAfterDiscount + gstAmount;
    
    return finalPrice.toFixed(2);
  }, []);

  const currencyOptions = [
    { value: "INR", label: "Indian Rupee (₹)" },
    { value: "USD", label: "US Dollar ($)" },
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

  const discountPercentageOptions = Array.from({ length: 101 }, (_, i) => ({
    value: i.toString(),
    label: `${i}%`
  }));

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

  // Calculate final prices
  useEffect(() => {
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

  // Initialize form data
  useEffect(() => {
    if (product) {
      const productDetail = product.product_detail;
      setFormData({
        name: productDetail?.name || "",
        description: productDetail?.description || "",
        short_description: productDetail?.short_description || "",
        brand: productDetail?.brand || "",
        category: productDetail?.category || "",
        subcategory: productDetail?.subcategory || "",
        tags: productDetail?.tags || [],
        currency: productDetail?.currency || "INR",
        weight: productDetail?.weight || "",
        weight_unit: productDetail?.weight_unit || "kg",
        dimensions: productDetail?.dimensions || "",
        product_type: productDetail?.product_type || "physical",
        video_url: productDetail?.video_url || "",
        warranty: productDetail?.warranty || "",
        features: productDetail?.features || []
      });

      setSelectedCategoryId(productDetail?.category || "");
      
      // Set sizes from variants
      if (product.variants_detail && product.variants_detail.length > 0) {
        const sizesData = product.variants_detail.map(variant => {
          const priceData = variant.product_variant_prices && variant.product_variant_prices.length > 0 
            ? variant.product_variant_prices[0] 
            : {};
          
          let unit = "gram";
          const sizeName = variant.name || "";
          
          if (sizeName.includes("kg") || sizeName.toLowerCase().includes("kilo")) {
            unit = "kg";
          } else if (sizeName.includes("ml")) {
            unit = "ml";
          } else if (sizeName.includes("l") || sizeName.toLowerCase().includes("litre")) {
            unit = "litre";
          } else if (sizeName.includes("pcs") || sizeName.toLowerCase().includes("piece")) {
            unit = "pcs";
          }
          
          return {
            id: variant.id,
            size: variant.name,
            unit: unit,
            price: priceData.price || "0.00",
            quantity: "",
            discount_percentage: priceData.discount ? priceData.discount.toString() : "0",
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
                min_quantity: tier.max_quantity?.toString() || "",
                price: tier.price,
              });
            });
          }
        });
        setPriceTiers(tiers);
      }

      if (productDetail?.images) {
        setExistingImages(productDetail.images);
        const featuredImage = productDetail.images.find(img => img.is_featured);
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
      discount_percentage: "0",
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
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === 'tags' || key === 'features') {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      formDataToSend.append('sizes', JSON.stringify(sizes));
      formDataToSend.append('price_tiers', JSON.stringify(priceTiers));

      removedImageIds.forEach(id => {
        formDataToSend.append('removed_images', id);
      });

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      newImages.forEach(img => {
        formDataToSend.append('additional_images', img.file);
      });

      await updateProduct({ id, data: formDataToSend }).unwrap();
      toast.success("🎉 Product updated successfully!");
      navigate(`/${role}/products`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to update product");
      console.error("Product update error:", err);
    }
  };

  const isFormValid = !formErrors.sizes && !formErrors.image && 
    formData.name && formData.description && formData.short_description && 
    formData.brand && formData.category;

  // Navigation sections
  const sections = [
    { id: "basic", label: "Basic Info", icon: FiPackage },
    { id: "categories", label: "Categories", icon: FiTag },
    { id: "specs", label: "Specifications", icon: FiSettings },
    { id: "pricing", label: "Pricing", icon: FiDollarSign },
    { id: "images", label: "Images", icon: FiImage }
  ];

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 flex items-center justify-center">
      <div className="text-center">
        <div className="loading loading-spinner text-primary loading-lg mb-4"></div>
        <p className="text-gray-600 text-lg">Loading product details...</p>
      </div>
    </div>
  );
  
  if (isError) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Failed to load product</h2>
        <p className="text-gray-600 mb-4">Please try again later</p>
        <button 
          onClick={() => navigate(`/${role}/products`)}
          className="btn btn-primary cursor-pointer"
        >
          Back to Products
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ">
      <div className="max-w-8xl mx-auto py-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <button
                onClick={() => navigate(`/${role}/products`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer group"
              >
                <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">Back to Products</span>
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <FiEdit3 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Edit Product
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Update your product details and pricing
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {isFormValid ? 'Ready to update' : 'Complete all required fields'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sizes.length} size{sizes.length !== 1 ? 's' : ''} • {existingImages.length + newImages.length} image{(existingImages.length + newImages.length) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-gray-200/50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                      activeSection === section.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              {(activeSection === "basic" || activeSection === "all") && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 bg-gradient-to-b from-primary to-primary/70 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="brand"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
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
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Currency <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="currency"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                        value={formData.currency}
                        onChange={handleChange}
                        required
                      >
                        {currencyOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Product Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="product_type"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                        value={formData.product_type}
                        onChange={handleChange}
                        required
                      >
                        {productTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Short Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="short_description"
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none"
                        value={formData.short_description}
                        onChange={handleChange}
                        placeholder="Brief description of the product"
                        required
                        maxLength={450}
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {formData.short_description.length}/450 characters
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        rows={5}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Detailed product description"
                        required
                        maxLength={2000}
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {formData.description.length}/2000 characters
                      </div>
                    </div>

                    {/* Tags Field */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">Product Tags</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(index)}
                              className="text-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={addTag}
                            placeholder="Type a tag and press Enter"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Add tags to help customers find your product</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {(activeSection === "categories" || activeSection === "all") && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Categories</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="category"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                        value={formData.category}
                        onChange={(e) => {
                          handleChange(e);
                          setSelectedCategoryId(e.target.value);
                          setFormData(prev => ({ ...prev, subcategory: "" }));
                        }}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Subcategory</label>
                      <select
                        name="subcategory"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer disabled:opacity-50"
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
              )}

              {/* Product Specifications Section */}
              {(activeSection === "specs" || activeSection === "all") && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Product Specifications</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Weight</label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          name="weight"
                          min="0"
                          step="0.01"
                          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="Product weight"
                        />
                        <select
                          name="weight_unit"
                          className="w-32 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                          value={formData.weight_unit}
                          onChange={handleChange}
                        >
                          {weightUnitOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Dimensions</label>
                      <input
                        type="text"
                        name="dimensions"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        value={formData.dimensions}
                        onChange={handleChange}
                        placeholder="e.g., 10x5x2 cm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Warranty Information</label>
                      <input
                        type="text"
                        name="warranty"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        value={formData.warranty}
                        onChange={handleChange}
                        placeholder="e.g., 1 year manufacturer warranty"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Product Video URL</label>
                      <input
                        type="url"
                        name="video_url"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                        value={formData.video_url}
                        onChange={handleChange}
                        placeholder="https://youtube.com/embed/example"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">Product Features</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {formData.features.map((feature, index) => (
                          <span key={index} className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                            {feature}
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="text-green-400 hover:text-green-600 transition-colors cursor-pointer"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={featureInput}
                            onChange={handleFeatureInputChange}
                            onKeyDown={addFeature}
                            placeholder="Type a feature and press Enter"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Add key features, hit Enter to add more</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Sizes & Pricing Section */}
              {(activeSection === "pricing" || activeSection === "all") && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">Product Sizes & Pricing</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addSize}
                      className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Size
                    </button>
                  </div>
                  
                  {formErrors.sizes && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-700 font-semibold">
                        {sizes.length === 0 
                          ? "At least one product size is required" 
                          : "Please fill all required size fields (size name and price)"}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {sizes.map((size, index) => (
                      <div key={size.id || index} className="border-2 border-blue-200 rounded-2xl p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Size <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Medium, 500g, 1L"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                              value={size.size}
                              onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Unit <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
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
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Actual Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                              value={size.price}
                              onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        {/* Discount and GST fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Discount %</label>
                            <select
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                              value={String(size.discount_percentage || size.discount || "0")}
                              onChange={(e) => handleSizeChange(index, "discount_percentage", e.target.value)}
                            >
                              {discountPercentageOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">GST %</label>
                            <select
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                              value={String(size.gst_percentage || "0")}
                              onChange={(e) => handleSizeChange(index, "gst_percentage", e.target.value)}
                            >
                              {gstPercentageOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Final Price (₹)</label>
                            <div className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900">
                              ₹{size.final_price || "0.00"}
                            </div>
                          </div>
                        </div>
                        
                        {/* Price Tiers for this size */}
                        <div className="mt-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <h4 className="text-lg font-semibold text-gray-800">Bulk Pricing Tiers</h4>
                            <button
                              type="button"
                              onClick={() => addPriceTier(index)}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-all duration-300 cursor-pointer"
                            >
                              <FiPlus className="w-4 h-4" />
                              Add Tier
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {priceTiers.filter(tier => tier.sizeIndex === index || tier.sizeId === size.id).map((tier, tierIndex) => {
                              const tierKey = tier.id || `${tier.sizeIndex}-${tier.min_quantity}-${tierIndex}`;
                              const tierIdx = priceTiers.findIndex(t => 
                                (t.id && tier.id && t.id === tier.id) ||
                                (t.sizeIndex === tier.sizeIndex && t.min_quantity === tier.min_quantity)
                              );

                              return (
                                <div key={tierKey} className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-gray-200">
                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                      Min Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      value={tier.min_quantity}
                                      onChange={(e) => handlePriceTierChange(tierIdx, "min_quantity", e.target.value)}
                                      placeholder="Minimum quantity"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                      Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      value={tier.price}
                                      onChange={(e) => handlePriceTierChange(tierIdx, "price", e.target.value)}
                                      placeholder="Tier price"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="lg:col-span-2 flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => removePriceTier(tierIdx)}
                                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all duration-300 cursor-pointer"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                      Remove Tier
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                          <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={size.is_default}
                              onChange={(e) => handleSizeChange(index, "is_default", e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            Set as default size
                          </label>
                          
                          {sizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSize(index)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 cursor-pointer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Remove Size
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Images Section */}
              {(activeSection === "images" || activeSection === "all") && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 bg-gradient-to-b from-pink-500 to-pink-400 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Product Images</h3>
                  </div>
                  
                  {formErrors.image && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-700 font-semibold">Main image is required</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Main Image */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700">
                        Main Image <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-primary transition-all duration-300">
                        {preview ? (
                          <div className="text-center">
                            <img
                              src={preview}
                              alt="Main product preview"
                              className="mx-auto h-48 object-contain rounded-xl shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPreview(null);
                                setFormData(prev => ({ ...prev, image: null }));
                              }}
                              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 cursor-pointer"
                            >
                              Change Image
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="text-center">
                              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <span className="text-lg font-semibold text-primary">Click to upload</span>
                                <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
                              </div>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                              required={!preview && existingImages.length === 0}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Images */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700">
                        Additional Images
                      </label>
                      
                      {/* Existing Images */}
                      {existingImages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Current Images:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {existingImages.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.image}
                                  alt={`Product ${image.id}`}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary transition-all duration-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(image.id)}
                                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 cursor-pointer shadow-lg"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                                {image.is_featured && (
                                  <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                    Main
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Images */}
                      {newImages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">New Images:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {newImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image.preview}
                                  alt={`New image ${index}`}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-green-200 group-hover:border-green-400 transition-all duration-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 cursor-pointer shadow-lg"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Button */}
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-primary transition-all duration-300">
                        <label className={`cursor-pointer block ${existingImages.length + newImages.length >= 5 ? 'opacity-50' : ''}`}>
                          <div className="text-center">
                            <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <span className="text-lg font-semibold text-primary">Add More Images</span>
                              <p className="text-sm text-gray-500 mt-1">
                                {existingImages.length + newImages.length}/5 images selected
                              </p>
                            </div>
                          </div>
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
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/${role}/products`)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isUpdating}
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating Product...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" />
                        Update Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar - Quick Navigation & Progress */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Progress Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Edit Progress</h4>
                <div className="space-y-4">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        activeSection === section.id
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        activeSection === section.id ? 'bg-white' : 'bg-gray-400'
                      }`}></div>
                      <span className="font-semibold text-sm">{section.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirements Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Requirements</h4>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 ${formData.name ? 'text-green-600' : 'text-gray-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Product Name</span>
                  </div>
                  <div className={`flex items-center gap-3 ${formData.brand ? 'text-green-600' : 'text-gray-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Brand</span>
                  </div>
                  <div className={`flex items-center gap-3 ${formData.category ? 'text-green-600' : 'text-gray-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Category</span>
                  </div>
                  <div className={`flex items-center gap-3 ${!formErrors.sizes ? 'text-green-600' : 'text-red-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Pricing & Sizes</span>
                  </div>
                  <div className={`flex items-center gap-3 ${!formErrors.image ? 'text-green-600' : 'text-red-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Main Image</span>
                  </div>
                </div>
              </div>

              {/* Product Preview Card */}
              <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <h4 className="text-lg font-bold text-blue-900 mb-3">📱 Quick Preview</h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span className="font-semibold">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product?.product_detail?.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product?.product_detail?.status_display || 'Draft'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">SKU:</span>
                    <span className="font-mono">{product?.product_detail?.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Created:</span>
                    <span>{new Date(product?.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage;