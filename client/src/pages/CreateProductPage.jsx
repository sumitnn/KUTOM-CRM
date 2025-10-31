import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCreateProductMutation } from "../features/product/productApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import {
  useGetCategoriesQuery,
  useGetSubcategoriesByCategoryQuery,
} from '../features/category/categoryApi';
import {
  FiPlus,
  FiTrash2,
  FiUpload,
  FiImage,
  FiDollarSign,
  FiTag,
  FiPackage,
  FiSettings,
  FiArrowLeft,
  FiCheck,
  FiAlertCircle
} from "react-icons/fi";

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [activeSection, setActiveSection] = useState("basic");

  const [product, setProduct] = useState({
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

  // Calculate final price for a single size
  const calculateFinalPrice = useCallback((size) => {
    const price = parseFloat(size.price) || 0;
    const discountPercentage = parseFloat(size.discount_percentage) || 0;
    const gstPercentage = parseFloat(size.gst_percentage) || 0;
    
    const priceAfterDiscount = price - (price * discountPercentage / 100);
    const gstAmount = priceAfterDiscount * gstPercentage / 100;
    const finalPrice = priceAfterDiscount + gstAmount;
    
    return finalPrice.toFixed(2);
  }, []);

  // Calculate final bulk price for price tiers
  const calculateFinalBulkPrice = useCallback((tier) => {
    const price = parseFloat(tier.price) || 0;
    const discountPercentage = parseFloat(tier.discount_percentage) || 0;
    const gstPercentage = parseFloat(tier.gst_percentage) || 0;
    
    const priceAfterDiscount = price - (price * discountPercentage / 100);
    const gstAmount = priceAfterDiscount * gstPercentage / 100;
    const finalBulkPrice = priceAfterDiscount + gstAmount;
    
    return finalBulkPrice.toFixed(2);
  }, []);

  // Initialize priceTiers with calculated final_bulk_price
  const [priceTiers, setPriceTiers] = useState(() => [{
    sizeIndex: 0,
    min_quantity: "",
    price: "",
    discount_percentage: "0",
    gst_percentage: "0",
    final_bulk_price: "0.00"
  }].map(tier => ({
    ...tier,
    final_bulk_price: calculateFinalBulkPrice(tier)
  })));

  const [images, setImages] = useState([]);
  const [featureInput, setFeatureInput] = useState("");

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: subcategoriesData = [] } = useGetSubcategoriesByCategoryQuery(selectedCategoryId, {
    skip: !selectedCategoryId,
  });

  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];

  // Update sizes final prices
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

  // Update price tiers when they change - FIXED VERSION
  const updatePriceTiersWithCalculations = useCallback((tiers) => {
    return tiers.map(tier => ({
      ...tier,
      final_bulk_price: calculateFinalBulkPrice(tier)
    }));
  }, [calculateFinalBulkPrice]);

  const [formErrors, setFormErrors] = useState({
    sizes: false,
    image: false
  });

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
    setPriceTiers(prev => {
      const updatedTiers = prev.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      );
      return updatePriceTiersWithCalculations(updatedTiers);
    });
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
      setPriceTiers(prev => {
        const updatedTiers = prev.map(tier => ({
          ...tier,
          sizeIndex: tier.sizeIndex > index ? tier.sizeIndex - 1 : tier.sizeIndex
        })).filter(tier => tier.sizeIndex !== index);
        return updatePriceTiersWithCalculations(updatedTiers);
      });
    } else {
      toast.warning("At least one size is required");
    }
  };

  const addPriceTier = (sizeIndex) => {
    setPriceTiers(prev => {
      const newTier = { 
        sizeIndex,
        min_quantity: "",
        price: "",
        discount_percentage: "0",
        gst_percentage: "0",
        final_bulk_price: "0.00"
      };
      return updatePriceTiersWithCalculations([...prev, newTier]);
    });
  };

  const removePriceTier = (index) => {
    setPriceTiers(prev => {
      const updatedTiers = prev.filter((_, i) => i !== index);
      return updatePriceTiersWithCalculations(updatedTiers);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      Object.entries(product).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === 'tags' || key === 'features') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      formData.append('sizes', JSON.stringify(sizes));
      formData.append('price_tiers', JSON.stringify(priceTiers));

      if (product.image) {
        formData.append('image', product.image);
      }

      images.forEach((img) => {
        formData.append('additional_images', img.file);
      });

      await createProduct(formData).unwrap();
      toast.success("🎉 Product created successfully!");
      navigate("/vendor/products");
    } catch (err) {
      toast.error(err.data?.message || "Failed to create product");
      console.error("Product creation error:", err);
    }
  };

  const isFormValid = !formErrors.sizes && !formErrors.image && 
    product.name && product.description && product.short_description && 
    product.brand && product.category;

  // Navigation sections
  const sections = [
    { id: "basic", label: "Basic Info", icon: FiPackage },
    { id: "categories", label: "Categories", icon: FiTag },
    { id: "specs", label: "Specifications", icon: FiSettings },
    { id: "pricing", label: "Pricing", icon: FiDollarSign },
    { id: "images", label: "Images", icon: FiImage }
  ];

  return (
    <div className="min-h-screen ">
      <div className="max-w-8xl mx-auto py-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <button
                onClick={() => navigate("/vendor/products")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer group"
              >
                <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">Back to Products</span>
              </button>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create New Product
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Fill in the details to add a new product to your catalog
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {isFormValid ? 'Ready to create' : 'Complete all required fields'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sizes.length} size{sizes.length !== 1 ? 's' : ''} • {images.length} image{images.length !== 1 ? 's' : ''}
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
                        value={product.name}
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
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Currency <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="currency"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                        value={product.currency}
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
                        value={product.product_type}
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
                        value={product.short_description}
                        onChange={handleChange}
                        placeholder="Brief description of the product"
                        required
                        maxLength={450}
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {product.short_description.length}/450 characters
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
                        value={product.description}
                        onChange={handleChange}
                        placeholder="Detailed product description"
                        required
                        maxLength={2000}
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {product.description.length}/2000 characters
                      </div>
                    </div>

                    {/* Tags Field */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">Product Tags</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {product.tags.map((tag, index) => (
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
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Subcategory</label>
                      <select
                        name="subcategory"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer disabled:opacity-50"
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
                          value={product.weight}
                          onChange={handleChange}
                          placeholder="Product weight"
                        />
                        <select
                          name="weight_unit"
                          className="w-32 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                          value={product.weight_unit}
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
                        value={product.dimensions}
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
                        value={product.warranty}
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
                        value={product.video_url}
                        onChange={handleChange}
                        placeholder="https://youtube.com/embed/example"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">Product Features</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {product.features.map((feature, index) => (
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
                      <p className="text-red-700 font-semibold">Please fill all required size fields (size name and price)</p>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {sizes.map((size, index) => (
                      <div key={index} className="border-2 border-blue-200 rounded-2xl p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Size (Variant) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g.Color,Size,Name"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                              value={size.size}
                              onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Variant Unit Type <span className="text-red-500">*</span>
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
                              Base Price (₹) <span className="text-red-500">*</span>
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
                              value={size.discount_percentage}
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
                              value={size.gst_percentage}
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
                            {priceTiers.filter(tier => tier.sizeIndex === index).map((tier, tierIndex) => {
                              const globalTierIndex = priceTiers.findIndex(t => t.sizeIndex === index && t.min_quantity === tier.min_quantity && t.price === tier.price);
                              return (
                                <div key={tierIndex} className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-4 bg-white rounded-xl border border-gray-200">
                                  <div className="space-y-2 lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                      Min Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      value={tier.min_quantity}
                                      onChange={(e) => handlePriceTierChange(globalTierIndex, "min_quantity", e.target.value)}
                                      required
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                      Final Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      value={tier.price}
                                      onChange={(e) => handlePriceTierChange(globalTierIndex, "price", e.target.value)}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">Discount %</label>
                                    <select
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                                      value={tier.discount_percentage}
                                      onChange={(e) => handlePriceTierChange(globalTierIndex, "discount_percentage", e.target.value)}
                                    >
                                      {discountPercentageOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">GST %</label>
                                    <select
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 cursor-pointer"
                                      value={tier.gst_percentage}
                                      onChange={(e) => handlePriceTierChange(globalTierIndex, "gst_percentage", e.target.value)}
                                    >
                                      {gstPercentageOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">Selling Price (₹)</label>
                                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-gray-900 text-center">
                                      ₹{tier.final_bulk_price || "0.00"}
                                    </div>
                                  </div>

                                  <div className="lg:col-span-6 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removePriceTier(globalTierIndex)}
                                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-all duration-300 cursor-pointer"
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
                        
                        {sizes.length > 1 && (
                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeSize(index)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 cursor-pointer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Remove Size
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images Section */}
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
                            required
                          />
                        </label>
                      </div>
                      {preview && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-32 h-32 rounded-xl object-cover border-2 border-primary shadow-lg"
                          />
                        </div>
                      )}
                      {product.image && (
                        <p className="text-sm text-gray-600 font-semibold">
                          Selected: {product.image.name}
                        </p>
                      )}
                    </div>
                    
                    {/* Additional Images */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700">
                        Additional Images
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-primary transition-all duration-300">
                        <label className={`cursor-pointer block ${images.length >= 5 ? 'opacity-50' : ''}`}>
                          <div className="text-center">
                            <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <span className="text-lg font-semibold text-primary">Choose Files</span>
                              <p className="text-sm text-gray-500 mt-1">
                                {images.length}/5 images selected
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImagesChange}
                            multiple
                            disabled={images.length >= 5}
                          />
                        </label>
                      </div>
                      
                      {images.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Image Previews:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map((img, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={img.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 rounded-lg object-cover border shadow-sm group-hover:shadow-md transition-all duration-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-300 cursor-pointer shadow-lg"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/vendor/products")}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-5 h-5" />
                        Create Product
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
                <h4 className="text-lg font-bold text-gray-900 mb-4">Creation Progress</h4>
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
                  <div className={`flex items-center gap-3 ${product.name ? 'text-green-600' : 'text-gray-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Product Name</span>
                  </div>
                  <div className={`flex items-center gap-3 ${product.brand ? 'text-green-600' : 'text-gray-400'}`}>
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Brand</span>
                  </div>
                  <div className={`flex items-center gap-3 ${product.category ? 'text-green-600' : 'text-gray-400'}`}>
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

              {/* Tips Card */}
              <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <h4 className="text-lg font-bold text-blue-900 mb-3">💡 Quick Tips</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Use clear, high-quality images</li>
                  <li>• Add multiple size options</li>
                  <li>• Set competitive bulk pricing</li>
                  <li>• Include detailed descriptions</li>
                  <li>• Add relevant tags for search</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProductPage;