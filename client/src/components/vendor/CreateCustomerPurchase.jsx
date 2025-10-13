import { useState, useEffect } from "react";
import { 
  useCreateCustomerPurchaseMutation,
  useGetCustomerPurchaseVaraiantListQuery,
  useGetCustomerPurchasesProductListQuery 
} from "../../features/customerpurchase/customerPurchaseApi";
import { useGetStatesQuery, useGetDistrictsQuery } from "../../features/location/locationApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateCustomerPurchase = ({ role }) => {
  const navigate = useNavigate();
  const [createPurchase, { isLoading: isCreating }] = useCreateCustomerPurchaseMutation();
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    district: "",
    postal_code: "",
    product: "",
    variant: "",
    quantity: 1,
    price_per_unit: "",
    payment_method: "",
    transaction_id: "",
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Location data
  const { data: statesData } = useGetStatesQuery();
  const [selectedStateId, setSelectedStateId] = useState("");
  const { data: districtsData } = useGetDistrictsQuery(selectedStateId, {
    skip: !selectedStateId,
  });

  // Product and variant data
  const { data: productsData, isLoading: isLoadingProducts } = useGetCustomerPurchasesProductListQuery();
  const [selectedProductId, setSelectedProductId] = useState("");
  const { data: variantsData, isLoading: isLoadingVariants } = useGetCustomerPurchaseVaraiantListQuery(selectedProductId, {
    skip: !selectedProductId,
  });

  // Filter only featured products
  const featuredProducts = productsData?.results || [];

  // Handle product selection
  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    
    // Find selected product to get price
    const selectedProduct = featuredProducts.find(product => product.rolebaseproductid === productId);
    
    setFormData(prev => ({
      ...prev,
      product: productId,
      variant: "",
      price_per_unit: selectedProduct ? selectedProduct.price : ""
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Prevent multiple submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Basic validation
    if (!formData.full_name || !formData.product || !formData.quantity || !formData.price_per_unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPurchase(formData).unwrap();
      toast.success("Customer purchase created successfully!");
      navigate(`/${role}/customer-purchases`);
    } catch (error) {
      console.error("Create purchase error:", error);
      toast.error(error?.data?.message || "Failed to create purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price_per_unit) || 0;
    return (quantity * price).toFixed(2);
  };

  const isLoading = isCreating || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 px-4 sm:px-6 lg:px-8 cursor-default">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create Customer Purchase
          </h1>
          <p className="mt-1  font-bold text-sm text-gray-600">
            Record a new customer purchase order
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-full overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Customer Information Section */}
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 mb-3 border-b pb-2">
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter customer full name"
                    required
                  />
                </div>

                {/* Phone & Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter complete address"
                  />
                </div>

                {/* City, State, District, Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={(e) => {
                      handleChange(e);
                      setSelectedStateId(e.target.value);
                    }}
                    className="w-full cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select State</option>
                    {statesData?.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={!selectedStateId}
                  >
                    <option value="">Select District</option>
                    {districtsData?.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                Purchase Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleProductChange}
                    className="w-full px-3 cursor-pointer py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                    disabled={isLoadingProducts}
                  >
                    <option value="">Select Product</option>
                    {featuredProducts?.map((product) => (
                      <option key={product.rolebaseproductid} value={product.rolebaseproductid}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingProducts && (
                    <p className="text-xs text-gray-500 mt-1">Loading products...</p>
                  )}
                </div>

                {/* Variant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant
                  </label>
                  <select
                    name="variant"
                    value={formData.variant}
                    onChange={handleChange}
                    className="w-full px-3 cursor-pointer py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={!selectedProductId || isLoadingVariants}
                  >
                    <option value="">Select Variant</option>
                    {variantsData?.results?.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingVariants && (
                    <p className="text-xs text-gray-500 mt-1">Loading variants...</p>
                  )}
                </div>

                {/* Quantity & Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Per Unit (₹) *
                  </label>
                  <input
                    type="number"
                    name="price_per_unit"
                    value={formData.price_per_unit}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50"
                    placeholder="0.00"
                    required
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Price is set automatically based on product selection</p>
                </div>

                {/* Total Price Display */}
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method & Transaction ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-3 cursor-pointer py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    name="transaction_id"
                    value={formData.transaction_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter transaction ID"
                  />
                </div>

                {/* Purchase Date */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                    placeholder="Additional notes or comments..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 cursor-pointer py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all relative"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </div>
                ) : (
                  "Create Purchase"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerPurchase;