// CreateCustomerPurchase.jsx
import { useState, useEffect, useRef } from "react";
import { 
  useCreateCustomerPurchaseMutation,
  useGetCustomerPurchaseVaraiantListQuery,
  useGetCustomerPurchasesProductListQuery,
  useLazySearchCustomersQuery,
  useGetVariantBuyingPriceQuery
} from "../../features/customerpurchase/customerPurchaseApi";
import { useGetStatesQuery, useGetDistrictsQuery } from "../../features/location/locationApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Error caught by boundary:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const CreateCustomerPurchase = ({ role }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector(state => state.auth);
  
  const [createPurchase, { isLoading: isCreating }] = useCreateCustomerPurchaseMutation();
  const [triggerSearch, { data: searchedCustomers, isLoading: isSearching }] = useLazySearchCustomersQuery();

  // State for tracking price fetching per product
  const [fetchingPriceFor, setFetchingPriceFor] = useState(null);

  // Form state for customer info
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    district: "",
    postal_code: "",
    payment_method: "",
    transaction_id: "",
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Multiple products state
  const [products, setProducts] = useState([
    {
      id: Date.now(), // temporary unique id
      product: "",
      variant: "",
      quantity: 1,
      price_per_unit: "",
      selling_price: "",
      total: 0
    }
  ]);

  // Store price data for each variant
  const [priceDataMap, setPriceDataMap] = useState({});

  // UI state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [productErrors, setProductErrors] = useState({});

  // Refs
  const searchTimeoutRef = useRef(null);

  // API hooks with error handling
  const { data: statesData, error: statesError } = useGetStatesQuery();
  const [selectedStateId, setSelectedStateId] = useState("");
  const { data: districtsData, error: districtsError } = useGetDistrictsQuery(selectedStateId, {
    skip: !selectedStateId,
  });

  const { data: productsData, isLoading: isLoadingProducts, error: productsError } = useGetCustomerPurchasesProductListQuery();
  
  // Fetch price for variant when selected
  const { data: priceData, isLoading: isLoadingPrice } = useGetVariantBuyingPriceQuery(
    { 
      variantId: fetchingPriceFor,  
      role: role || 'admin' 
    },
    { 
      skip: !fetchingPriceFor || !currentUser?.id 
    }
  );

  // Handle price data when it arrives
  useEffect(() => {
    if (priceData && fetchingPriceFor) {
      if (priceData.success) {
        // Store price data in map
        setPriceDataMap(prev => ({
          ...prev,
          [fetchingPriceFor]: priceData
        }));

        // Update the product that triggered this fetch
        setProducts(prev => prev.map(product => {
          if (product.variant === fetchingPriceFor) {
            return {
              ...product,
              price_per_unit: priceData.actual_price
            };
          }
          return product;
        }));

        // Clear product error for this variant
        setProductErrors(prev => {
          const newErrors = { ...prev };
          Object.keys(newErrors).forEach(key => {
            if (key.includes(`price_${fetchingPriceFor}`)) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
      } else {
        toast.error(priceData.error || "Failed to fetch price");
        setProductErrors(prev => ({
          ...prev,
          [`price_${fetchingPriceFor}`]: 'Price not available for this variant'
        }));
      }
      setFetchingPriceFor(null);
    }
  }, [priceData, fetchingPriceFor]);

  // Handle API errors
  useEffect(() => {
    if (statesError) {
      console.error("States API error:", statesError);
      toast.error("Failed to load states");
    }
    if (districtsError) {
      console.error("Districts API error:", districtsError);
    }
    if (productsError) {
      console.error("Products API error:", productsError);
      toast.error("Failed to load products");
    }
  }, [statesError, districtsError, productsError]);

  // Filter featured products safely
  const featuredProducts = productsData?.results || [];

  // Debounced customer search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (customerSearch.trim().length > 2 && !selectedCustomer) {
        triggerSearch(customerSearch.trim()).catch(error => {
          console.error("Search error:", error);
          toast.error("Failed to search customers");
        });
        setShowCustomerDropdown(true);
      } else if (customerSearch.trim().length === 0) {
        setShowCustomerDropdown(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [customerSearch, triggerSearch, selectedCustomer]);

  // Event handlers
  const handleCustomerSelect = (customer) => {
    if (!customer) return;
    
    setSelectedCustomer(customer);
    setCustomerSearch(customer.full_name || "");
    setShowCustomerDropdown(false);
    
    setFormData(prev => ({
      ...prev,
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      district: customer.district || "",
      postal_code: customer.postal_code || ""
    }));

    if (customer.state) {
      setSelectedStateId(customer.state);
    }
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setFormData(prev => ({
      ...prev,
      full_name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      district: "",
      postal_code: ""
    }));
  };

  const handleSearchFocus = () => {
    if (customerSearch.trim().length > 2 && searchedCustomers && searchedCustomers.length > 0 && !selectedCustomer) {
      setShowCustomerDropdown(true);
    }
  };

  // Product handlers
  const addProduct = () => {
    setProducts(prev => [
      ...prev,
      {
        id: Date.now(),
        product: "",
        variant: "",
        quantity: 1,
        price_per_unit: "",
        selling_price: "",
        total: 0
      }
    ]);
  };

  const removeProduct = (productId) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      // Clean up errors for removed product
      setProductErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.includes(productId)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    } else {
      toast.warning("At least one product is required");
    }
  };

  const handleProductChange = (productId, field, value) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updatedProduct = { ...product, [field]: value };
        
        // If product changed, reset variant and price
        if (field === 'product') {
          updatedProduct.variant = "";
          updatedProduct.price_per_unit = "";
          updatedProduct.selling_price = "";
          updatedProduct.total = 0;
        }
        
        // If variant changed, fetch price
        if (field === 'variant' && value) {
          setFetchingPriceFor(value);
        }
        
        // Calculate total when quantity or selling price changes
        if (field === 'quantity' || field === 'selling_price') {
          const quantity = parseFloat(updatedProduct.quantity) || 0;
          const sellingPrice = parseFloat(updatedProduct.selling_price) || 0;
          updatedProduct.total = quantity * sellingPrice;
        }
        
        return updatedProduct;
      }
      return product;
    }));

    // Clear error for this field
    setProductErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${productId}_${field}`];
      return newErrors;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'full_name' && value !== selectedCustomer?.full_name) {
      setSelectedCustomer(null);
      if (value.trim().length > 2) {
        setShowCustomerDropdown(true);
      }
    }

    if (name === 'state') {
      setSelectedStateId(value);
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    const prodErrors = {};
    
    // Validate customer info
    if (!formData.full_name?.trim()) errors.full_name = "Full name is required";
    
    // Validate each product
    products.forEach((product, index) => {
      if (!product.product) prodErrors[`${product.id}_product`] = "Product is required";
      if (!product.variant) prodErrors[`${product.id}_variant`] = "Variant is required";
      if (!product.quantity || product.quantity < 1) prodErrors[`${product.id}_quantity`] = "Valid quantity is required";
      if (!product.price_per_unit || parseFloat(product.price_per_unit) <= 0) {
        prodErrors[`${product.id}_price`] = "Valid buying price is required";
      }
      if (!product.selling_price || parseFloat(product.selling_price) <= 0) {
        prodErrors[`${product.id}_selling`] = "Valid selling price is required";
      }
    });
    
    setFormErrors(errors);
    setProductErrors(prodErrors);
    
    return Object.keys(errors).length === 0 && Object.keys(prodErrors).length === 0;
  };

  // Calculations
  const calculateSubtotal = () => {
    return products.reduce((sum, product) => {
      return sum + (parseFloat(product.total) || 0);
    }, 0).toFixed(2);
  };

  const calculateTotalCost = () => {
    return products.reduce((sum, product) => {
      const quantity = parseFloat(product.quantity) || 0;
      const buyingPrice = parseFloat(product.price_per_unit) || 0;
      return sum + (quantity * buyingPrice);
    }, 0).toFixed(2);
  };

  const calculateTotalProfit = () => {
    const revenue = parseFloat(calculateSubtotal()) || 0;
    const cost = parseFloat(calculateTotalCost()) || 0;
    return (revenue - cost).toFixed(2);
  };

  const calculateProfitPercentage = () => {
    const cost = parseFloat(calculateTotalCost()) || 0;
    const profit = parseFloat(calculateTotalProfit()) || 0;
    
    if (cost === 0) return "0.00";
    return ((profit / cost) * 100).toFixed(2);
  };

  // Form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    // Prepare data for API
    const purchaseData = {
      ...formData,
      items: products.map(({ id, total, ...product }) => ({
        ...product,
        total_price: total
      }))
    };

    try {
      await createPurchase(purchaseData).unwrap();
      toast.success("Customer purchase created successfully!");
      navigate(`/${role}/customer-purchases`);
    } catch (error) {
      console.error("Create purchase error:", error);
      const errorMessage = error?.data?.message || error?.data?.detail || "Failed to create purchase";
      toast.error(errorMessage);
      
      if (error?.data) {
        const backendErrors = {};
        Object.keys(error.data).forEach(key => {
          if (key in formData) {
            backendErrors[key] = Array.isArray(error.data[key]) ? error.data[key][0] : error.data[key];
          }
        });
        setFormErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isCreating || isSubmitting;

  // Safe data access for rendering
  const safeSearchedCustomers = Array.isArray(searchedCustomers) ? searchedCustomers : [];
  const safeStates = Array.isArray(statesData) ? statesData : [];
  const safeDistricts = Array.isArray(districtsData) ? districtsData : [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 cursor-default">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Create Customer Purchase
            </h1>
            <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
              Record a new customer purchase with multiple products
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">New Purchase Order</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Customer Information Section */}
              <section className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-800">Customer Information</h3>
                </div>
                
                {/* Customer Search */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🔍 Search Existing Customer
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={handleSearchFocus}
                      className="w-full px-4 py-3 text-base border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                      placeholder="Type customer name, phone, or email to search..."
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Customer Dropdown */}
                    {showCustomerDropdown && !selectedCustomer && (
                      <div className="absolute z-20 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {isSearching ? (
                          <div className="px-4 py-3 text-sm text-gray-500 flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            <span>Searching customers...</span>
                          </div>
                        ) : safeSearchedCustomers.length > 0 ? (
                          safeSearchedCustomers.map((customer, index) => (
                            <div
                              key={customer.id || index}
                              onClick={() => handleCustomerSelect(customer)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-semibold text-gray-900">{customer.full_name}</div>
                              <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
                                {customer.phone && <span>📞 {customer.phone}</span>}
                                {customer.email && <span>✉️ {customer.email}</span>}
                                {customer.city && <span>🏙️ {customer.city}</span>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            {customerSearch.trim().length > 2 ? "No customers found" : "Type at least 3 characters to search"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    {selectedCustomer ? "Customer selected ✓" : "Search for existing customers or enter new customer details below"}
                  </p>
                </div>
                
                {/* Customer Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Full Name *", name: "full_name", type: "text", placeholder: "Enter customer full name", colSpan: "md:col-span-2 lg:col-span-3" },
                    { label: "Phone Number", name: "phone", type: "tel", placeholder: "Enter phone number" },
                    { label: "Email Address", name: "email", type: "email", placeholder: "Enter email address" },
                    { label: "Address", name: "address", type: "text", placeholder: "Enter complete address", colSpan: "md:col-span-2 lg:col-span-3" },
                    { label: "City", name: "city", type: "text", placeholder: "Enter city" },
                    { label: "State", name: "state", type: "select", options: safeStates },
                    { label: "District", name: "district", type: "select", options: safeDistricts, disabled: !selectedStateId },
                    { label: "Postal Code", name: "postal_code", type: "text", placeholder: "Enter postal code" },
                  ].map((field) => (
                    <div key={field.name} className={field.colSpan || ""}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          disabled={field.disabled}
                          className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer bg-white ${
                            formErrors[field.name] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select {field.label.split(' ')[0]}</option>
                          {field.options?.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            formErrors[field.name] ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder={field.placeholder}
                          required={field.label.includes('*')}
                        />
                      )}
                      {formErrors[field.name] && (
                        <p className="text-red-500 text-xs mt-1">{formErrors[field.name]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Products Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-800">Products</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Another Products</span>
                  </button>
                </div>

                {/* Products List */}
                {products.map((product, index) => (
                  <div key={product.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 relative">
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    
                    <div className="text-sm font-semibold text-gray-600 mb-3">Product #{index + 1}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Product Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Product *
                        </label>
                        <select
                          value={product.product}
                          onChange={(e) => handleProductChange(product.id, 'product', e.target.value)}
                          className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer bg-white ${
                            productErrors[`${product.id}_product`] ? 'border-red-300' : 'border-gray-200'
                          }`}
                          disabled={isLoadingProducts}
                        >
                          <option value="">Select Product</option>
                          {featuredProducts.map((p) => (
                            <option key={p.rolebaseproductid} value={p.rolebaseproductid}>
                              {p.name} - ₹{p.price}
                            </option>
                          ))}
                        </select>
                        {productErrors[`${product.id}_product`] && (
                          <p className="text-red-500 text-xs mt-1">{productErrors[`${product.id}_product`]}</p>
                        )}
                      </div>

                      {/* Variant Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Variant *
                        </label>
                        <VariantDropdown
                          productId={product.product}
                          value={product.variant}
                          onChange={(value) => handleProductChange(product.id, 'variant', value)}
                          error={productErrors[`${product.id}_variant`]}
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(product.id, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            productErrors[`${product.id}_quantity`] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                        {productErrors[`${product.id}_quantity`] && (
                          <p className="text-red-500 text-xs mt-1">{productErrors[`${product.id}_quantity`]}</p>
                        )}
                      </div>

                      {/* Buying Price */}
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Buying Price (₹) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={product.price_per_unit}
                            onChange={(e) => handleProductChange(product.id, 'price_per_unit', e.target.value)}
                            step="0.01"
                            min="0"
                            className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 pr-12 ${
                              productErrors[`${product.id}_price`] ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="0.00"
                            disabled={true}
                          />
                          {fetchingPriceFor === product.variant && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        {productErrors[`${product.id}_price`] ? (
                          <p className="text-red-500 text-xs mt-1">{productErrors[`${product.id}_price`]}</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-fetched from variant
                          </p>
                        )}
                      </div>

                      {/* Selling Price */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={product.selling_price}
                          onChange={(e) => handleProductChange(product.id, 'selling_price', e.target.value)}
                          step="0.01"
                          min="0"
                          className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            productErrors[`${product.id}_selling`] ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="0.00"
                        />
                        {productErrors[`${product.id}_selling`] && (
                          <p className="text-red-500 text-xs mt-1">{productErrors[`${product.id}_selling`]}</p>
                        )}
                      </div>

                      {/* Item Total */}
                      <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Item Total:</span>
                        <span className="text-lg font-bold text-blue-600">₹{product.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Price Breakdown for this product */}
                    {priceDataMap[product.variant] && (
                      <div className="mt-3 bg-green-50 border-2 border-green-200 rounded-xl p-3">
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Base Price:</span>
                            <div className="font-semibold">₹{priceDataMap[product.variant].price}</div>
                          </div>
                          {priceDataMap[product.variant].discount > 0 && (
                            <div>
                              <span className="text-gray-600">Discount:</span>
                              <div className="font-semibold text-green-600">{priceDataMap[product.variant].discount}%</div>
                            </div>
                          )}
                          {priceDataMap[product.variant].gst_percentage > 0 && (
                            <div>
                              <span className="text-gray-600">GST:</span>
                              <div className="font-semibold">{priceDataMap[product.variant].gst_percentage}%</div>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Final Price:</span>
                            <div className="font-semibold text-blue-600">₹{priceDataMap[product.variant].actual_price}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </section>

              {/* Financial Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">💰 Financial Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Cost", value: `₹${calculateTotalCost()}`, color: "text-blue-600" },
                    { label: "Total Revenue", value: `₹${calculateSubtotal()}`, color: "text-green-600" },
                    { 
                      label: "Total Profit", 
                      value: `₹${calculateTotalProfit()}`,
                      color: calculateTotalProfit() >= 0 ? "text-green-600" : "text-red-600"
                    },
                    { 
                      label: "Profit %", 
                      value: `${calculateProfitPercentage()}%`,
                      color: calculateProfitPercentage() >= 0 ? "text-green-600" : "text-red-600"
                    }
                  ].map((item, index) => (
                    <div key={index} className="text-center bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                      <p className="text-sm font-semibold text-gray-600 mb-1">{item.label}</p>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer bg-white"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="upi">📱 UPI</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    name="transaction_id"
                    value={formData.transaction_id || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter transaction ID"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                    placeholder="Additional notes or comments about this purchase..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 cursor-pointer py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin cursor-pointer rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Purchase...</span>
                    </div>
                  ) : (
                    "✅ Create Purchase"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Variant Dropdown Component
const VariantDropdown = ({ productId, value, onChange, error }) => {
  const { data: variantsData, isLoading: isLoadingVariants } = useGetCustomerPurchaseVaraiantListQuery(productId, {
    skip: !productId,
  });

  const safeVariants = Array.isArray(variantsData?.results) ? variantsData.results : [];

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer bg-white ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}
        disabled={!productId || isLoadingVariants}
      >
        <option value="">Select Variant</option>
        {safeVariants.map((variant) => (
          <option key={variant.id} value={variant.id}>
            {variant.name}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {isLoadingVariants && (
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-2"></div>
          Loading variants...
        </div>
      )}
    </div>
  );
};

export default CreateCustomerPurchase;