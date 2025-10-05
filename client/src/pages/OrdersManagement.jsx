import React, { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useGetMyOrdersQuery, useUpdateResellerOrderStatusMutation } from "../features/order/orderApi";
import { 
  FiSearch, 
  FiChevronRight, 
  FiRefreshCw, 
  FiFilter, 
  FiTruck, 
  FiPackage, 
  FiCheckCircle, 
  FiX,
  FiMapPin,
  FiDollarSign,
  FiInfo,
  FiCalendar,
  FiFileText,
  FiUser,
  FiClipboard,
  FiBox,
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiHome,
  FiCreditCard,
  FiPercent,
  FiTag,
  FiEye
} from "react-icons/fi";
import { 
  BsBoxSeam, 
  BsClockHistory, 
  BsCheckCircle, 
  BsXCircle, 
  BsExclamationCircle 
} from "react-icons/bs";
import ModalPortal from "../components/ModalPortal";

const statusConfig = {
  pending: {
    color: "bg-blue-100 text-blue-800",
    icon: <BsBoxSeam className="mr-1" />,
    label: "Pending"
  },
  accepted: {
    color: "bg-green-100 text-green-800",
    icon: <BsCheckCircle className="mr-1" />,
    label: "Accepted"
  },
  rejected: {
    color: "bg-red-100 text-red-800",
    icon: <BsXCircle className="mr-1" />,
    label: "Rejected"
  },
  ready_for_dispatch: {
    color: "bg-purple-100 text-purple-800",
    icon: <FiPackage className="mr-1" />,
    label: "Ready for Dispatch"
  },
  dispatched: {
    color: "bg-yellow-100 text-yellow-800",
    icon: <FiTruck className="mr-1" />,
    label: "Dispatched"
  },
  delivered: {
    color: "bg-green-100 text-green-800",
    icon: <FiCheckCircle className="mr-1" />,
    label: "Delivered"
  },
  cancelled: {
    color: "bg-gray-100 text-gray-800",
    icon: <FiX className="mr-1" />,
    label: "Cancelled"
  },
  received: {
    color: "bg-green-100 text-green-800",
    icon: <FiCheckCircle className="mr-1" />,
    label: "Received"
  },
  default: {
    color: "bg-gray-100 text-gray-800",
    icon: <BsBoxSeam className="mr-1" />,
    label: "Unknown"
  }
};

const today = new Date().toISOString().slice(0, 10);

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount));
  };

  const calculateTotalQuantity = () => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const renderReceipt = () => {
    if (!order.receipt) return <p className="text-sm text-gray-500">No receipt provided</p>;
    
    const extension = order.receipt.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <a 
          href={order.receipt} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <FiFileText className="h-4 w-4" />
          <span>View Receipt PDF</span>
        </a>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <div className="mt-2">
          <img 
            src={order.receipt} 
            alt="Order Receipt" 
            className="h-32 w-auto rounded-md border border-gray-200"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiInfo className="text-blue-500" />
            Order Details - #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Order Status & Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                <FiCalendar className="text-blue-600" />
                Order Date
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(order.created_at)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h3 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                <FiClipboard className="text-yellow-600" />
                Order Status
              </h3>
              <p className="text-sm font-semibold capitalize text-gray-900">
                {order.status_display || order.status || "Not specified"}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
                <FiCreditCard className="text-purple-600" />
                Payment Status
              </h3>
              <p className="text-sm font-semibold capitalize text-gray-900">
                {order.payment_status_display || order.payment_status || "Not specified"}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <FiDollarSign className="text-green-600" />
                Total Amount
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.total_price)}
              </p>
            </div>
          </div>

          {/* Buyer & Seller Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiUser className="text-blue-500" />
                Buyer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.username || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.role_based_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.buyer?.address ? 
                      `${order.buyer.address.street_address || ''}, ${order.buyer.address.city || ''}, ${order.buyer.address.state || ''}, ${order.buyer.address.postal_code || ''}, ${order.buyer.address.country || ''}`.trim() || 'N/A' 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiShoppingBag className="text-green-500" />
                Vendor Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.username || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.role || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiPackage className="text-purple-500" />
              Order Items (Total: {calculateTotalQuantity()})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                            <FiBox className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              SKU: {item.product?.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.variant?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">
                        -{formatCurrency(item.discount_amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                        +{formatCurrency(item.gst_amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiDollarSign className="text-green-500" />
              Order Summary
            </h3>
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 lg:w-1/3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FiTag className="text-blue-500" />
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FiPercent className="text-red-500" />
                    Discount:
                  </span>
                  <span className="text-sm font-medium text-red-500">
                    -{formatCurrency(order.discount_amount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FiCreditCard className="text-green-500" />
                    GST Amount:
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    +{formatCurrency(order.gst_amount)}
                  </span>
                </div>
                {parseFloat(order.transport_charges) > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FiTruck className="text-purple-500" />
                      Shipping:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      +{formatCurrency(order.transport_charges)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 mt-2 bg-gray-100 px-2 rounded">
                  <span className="text-sm font-bold text-gray-800">Grand Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiTruck className="text-green-500" />
              Shipping Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Courier Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.courier_name || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tracking Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.tracking_number || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transport Charges</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.transport_charges)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Delivery Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(order.expected_delivery_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiClipboard className="text-blue-500" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.description || 'No description provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Note</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.note || 'No note provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Receipt</p>
                {renderReceipt()}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
      </div>
      </ModalPortal>
  );
};

// Product Details Modal Component
const ProductDetailsModal = ({ order, onClose }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Dummy product details data
  const productDetails = {
    "Watter Bottel": {
      id: 1,
      name: "Watter Bottel",
      description: "High-quality water bottle made from premium materials. BPA-free and durable for everyday use.",
      category: "Bottles",
      brand: "Morgan",
      material: "Stainless Steel",
      capacity: "1 Liter",
      features: ["Leak Proof", "Insulated", "BPA Free", "Easy to Clean"],
      warranty: "2 Years",
      priceRange: "₹400 - ₹500",
      images: [
        "https://via.placeholder.com/400x400?text=Water+Bottle+1",
        "https://via.placeholder.com/400x400?text=Water+Bottle+2"
      ]
    }
  };

  const handleProductClick = (productName) => {
    setSelectedProduct(productDetails[productName] || {
      name: productName,
      description: "Product details not available.",
      category: "Unknown",
      brand: "Unknown",
      features: ["No features listed"],
      priceRange: "Not specified"
    });
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiPackage className="text-purple-500" />
            Product Details - Order #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {selectedProduct ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={selectedProduct.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image"} 
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Brand</p>
                      <p className="font-medium">{selectedProduct.brand}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Material</p>
                      <p className="font-medium">{selectedProduct.material || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Warranty</p>
                      <p className="font-medium">{selectedProduct.warranty || "Not specified"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.features.map((feature, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800">
                      Price Range: <span className="font-bold">{selectedProduct.priceRange}</span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                ← Back to Products List
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Products in this Order</h3>
              {order.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div 
                    className="flex items-center justify-between"
                    onClick={() => handleProductClick(item.product?.name)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FiPackage className="text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.product?.name || "Unknown Product"}</h4>
                        <p className="text-sm text-gray-500">Variant: {item.variant?.name || "Standard"}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div></ModalPortal>
  );
};

const OrdersManagement = ({ role }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [note, setNote] = useState("");
  const [showloading, setshowloading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);

  const { data, error, isLoading, isFetching, refetch } = useGetMyOrdersQuery({
    status: activeTab === "all" ? undefined : activeTab,
    page,
  });

  const [updateOrderStatus] = useUpdateResellerOrderStatusMutation();

  const filteredOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results
      .filter(
        (order) =>
          order.buyer?.username?.toLowerCase().includes(search.toLowerCase()) ||
          order.id.toString().includes(search)
     );
  }, [data, search, visibleCount]);

  const todaysOrders = React.useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter((order) => order.created_at.slice(0, 10) === today);
  }, [data]);

  const hasMore = data && data.next;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.default;
  };

  const handleCancelOrder = async (orderId) => {
    try {
      // await cancelOrder(orderId);
      refetch();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const handleMarkReceived = async () => {
    if (!selectedOrder) return;
    setshowloading(true);
    try {
      await updateOrderStatus({
        orderId: selectedOrder.id,
        status: "received",
        note: note
      }).unwrap();
      
      refetch();
      setShowReceivedModal(false);
      setSelectedOrder(null);
      setNote("");
      setshowloading(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
      setshowloading(false);
    }
  };

  const tabs = [
    { key: "pending", label: "New" },
    { key: "accepted", label: "Accepted" },
    { key: "dispatched", label: "Dispatched" },
    { key: "received", label: "Received" },
    { key: "rejected", label: "Rejected/Cancelled" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-2">View and manage all your orders in one place</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={refetch}
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Today's Orders Section */}
        <section className="mb-10 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <BsBoxSeam className="mr-2 text-indigo-600" />
              Today's Orders
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {todaysOrders.length} orders
            </span>
          </div>
          
          {todaysOrders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No orders placed today.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysOrders.map((order) => {
                const status = getStatusConfig(order.status);
                return (
                  <div 
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer group bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition">
                          #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500">{order.buyer?.username || 'N/A'}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                      </p>
                      <p className="font-semibold text-gray-900">
                        ₹{parseFloat(order.total_price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Received Confirmation Modal */}
        {showReceivedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Product Received
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to mark order #{selectedOrder?.id} as received?
              </p>
              
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  id="note"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about the received products..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
             
                <button
                  onClick={handleMarkReceived}
                  disabled={showloading}
                  className={`px-4 py-2 rounded-md text-white ${
                    showloading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                  }`}
                >
                  {showloading ? "Loading..." : "Confirm Received"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => {
              setShowOrderDetails(false);
              setSelectedOrder(null);
            }} 
          />
        )}

        {/* Product Details Modal */}
        {showProductDetails && selectedOrder && (
          <ProductDetailsModal 
            order={selectedOrder} 
            onClose={() => {
              setShowProductDetails(false);
              setSelectedOrder(null);
            }} 
          />
        )}

        {/* Main Orders Section */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <button 
                className="md:hidden px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              >
                <FiFilter className="mr-2" />
                Filter
              </button>
              
              <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block`}>
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                        }`}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setVisibleCount(10);
                          setPage(1);
                          setIsMobileFilterOpen(false);
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <BsXCircle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</h3>
              <p className="text-gray-600 mb-4">Please try again later</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <BsBoxSeam className="text-gray-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const status = getStatusConfig(order.status);
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.buyer?.username || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ₹{parseFloat(order.total_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center cursor-pointer"
                          >
                            <FiEye className="mr-1" />
                            View Details
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowProductDetails(true);
                            }}
                            className="text-green-600 hover:text-green-900 inline-flex items-center ml-3 cursor-pointer"
                          >
                            <FiPackage className="mr-1" />
                            Products
                          </button>

                          {order.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order.id);
                              }}
                              className="text-red-600 hover:text-red-900 ml-3 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          {(role === 'stockist' || role === 'reseller') && order.status === 'dispatched' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setShowReceivedModal(true);
                              }}
                              className="text-green-600 cursor-pointer hover:text-green-900 ml-3"
                            >
                              Mark Received
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination/Load More */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="px-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isFetching ? (
                  <span className="flex items-center">
                    <FiRefreshCw className="animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  "Load More Orders"
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrdersManagement;