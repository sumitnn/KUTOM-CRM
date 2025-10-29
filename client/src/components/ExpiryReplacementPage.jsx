import { useState, lazy, Suspense } from "react";
import { 
  FiX, 
  FiRefreshCw, FiBox, FiInfo, FiCalendar, 
  FiHash, FiClock, FiAlertTriangle, FiChevronLeft,
  FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiEye, FiCheckCircle, FiTruck, FiPackage, FiFileText
} from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import { 
  useGetReplacementsQuery,
  useUpdateStatusMutation
} from "../features/returned/replacementApi";
import {
  useGetExpiringProductsQuery,
} from "../features/expiry/expiryApi";
import { toast } from "react-toastify";
import ModalPortal from "./ModalPortal";

// Lazy-loaded components
const Spinner = lazy(() => import('./common/Spinner'));
const ErrorMessage = lazy(() => import('./common/ErrorMessage'));

const ExpiryReplacementPage = ({ role = "vendor" }) => {
  const [activeTab, setActiveTab] = useState(role === "admin" ? "replacement" : "expiry");
  const [expiryPage, setExpiryPage] = useState(1);
  const [replacementPage, setReplacementPage] = useState(1);
  const pageSize = 10;
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Status update state
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });

  // Delivery details state
  const [deliveryForm, setDeliveryForm] = useState({
    courier_name: '',
    delivery_date: '',
    new_batch_number: '',
    tracking_id: '',
    receipt: null,
    notes: ''
  });

  // API Hooks
  const { 
    data: expiryData, 
    isLoading: expiryLoading, 
    error: expiryError,
    refetch: refetchExpiry 
  } = useGetExpiringProductsQuery({ page: expiryPage, pageSize }, {
    skip: role === "admin"
  });

  const { 
    data: replacementData, 
    isLoading: replacementLoading, 
    error: replacementError,
    refetch: refetchReplacements 
  } = useGetReplacementsQuery({ 
    page: replacementPage, 
    pageSize 
  });

  const [updateStatus, { isLoading: updatingStatus }] = useUpdateStatusMutation();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const openStatusModal = (item) => {
    setSelectedItem(item);
    setStatusForm({
      status: item.status,
      notes: ''
    });
    setShowStatusModal(true);
  };

  const openDeliveryModal = (item) => {
    setSelectedItem(item);
    setDeliveryForm({
      courier_name: '',
      delivery_date: '',
      new_batch_number: '',
      tracking_id: '',
      receipt: null,
      notes: ''
    });
    setShowDeliveryModal(true);
  };

  const openTrackingModal = (item) => {
    setSelectedItem(item);
    setShowTrackingModal(true);
  };

  const closeModals = () => {
    setShowDetailsModal(false);
    setShowStatusModal(false);
    setShowDeliveryModal(false);
    setShowTrackingModal(false);
    setSelectedItem(null);
    setSelectedImage(null);
    setStatusForm({
      status: '',
      notes: ''
    });
    setDeliveryForm({
      courier_name: '',
      delivery_date: '',
      new_batch_number: '',
      tracking_id: '',
      receipt: null,
      notes: ''
    });
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await updateStatus({
        id: selectedItem.id,
        status: statusForm.status,
        notes: statusForm.notes,
        product_id: selectedItem.product,
        batch_number: selectedItem.batch_number,
        variant_id: selectedItem.variant,
        quantity: selectedItem.quantity
      }).unwrap();
      
      toast.success("Status updated successfully!");
      refetchReplacements();
      closeModals();
    } catch (err) {
      toast.error(err.data?.message || "Failed to update status. Please try again.");
    }
  };

  const handleDeliveryUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await updateStatus({
        id: selectedItem.id,
        status: "dispatched",
        notes: deliveryForm.notes,
        courier_name: deliveryForm.courier_name,
        delivery_date: deliveryForm.delivery_date,
        new_batch_number: deliveryForm.new_batch_number,
        tracking_id: deliveryForm.tracking_id,
        receipt: deliveryForm.receipt,
        product_id: selectedItem.product,
        batch_number: selectedItem.batch_number,
        variant_id: selectedItem.variant,
        quantity: selectedItem.quantity
      }).unwrap();
      
      toast.success("Delivery details updated successfully!");
      refetchReplacements();
      closeModals();
    } catch (err) {
      toast.error(err.data?.message || "Failed to update delivery details. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-blue-100 text-blue-800 border border-blue-200", label: "Pending In Review", icon: "⏳" },
      approved: { color: "bg-green-100 text-green-800 border border-green-200", label: "Approved", icon: "✅" },
      in_transit: { color: "bg-orange-100 text-orange-800 border border-orange-200", label: "Return in Processing", icon: "🚚" },
      received: { color: "bg-purple-100 text-purple-800 border border-purple-200", label: "Returned Item Received", icon: "📦" },
      dispatched: { color: "bg-indigo-100 text-indigo-800 border border-indigo-200", label: "Returned Order Dispatched", icon: "✈️" },
      completed: { color: "bg-emerald-100 text-emerald-800 border border-emerald-200", label: "Exchanged Successfully", icon: "🎉" },
      rejected: { color: "bg-red-100 text-red-800 border border-red-200", label: "Rejected", icon: "❌" },
      expiring_soon: { color: "bg-yellow-100 text-yellow-800 border border-yellow-200", label: "Expiring Soon", icon: "⚠️" },
      critical: { color: "bg-orange-100 text-orange-800 border border-orange-200", label: "Critical", icon: "🚨" },
      expired: { color: "bg-red-100 text-red-800 border border-red-200", label: "Expired", icon: "⏰" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${config.color} shadow-sm`}>
        <span className="mr-1.5">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getDaysRemainingColor = (days) => {
    if (days <= 7) return "text-red-600 font-bold";
    if (days <= 30) return "text-orange-600 font-semibold";
    return "text-green-600";
  };

 

  const getStatusButtonConfig = (item) => {
    const status = item.status;
    
    switch (status) {
      case "pending":
        return {
          label: "Update Status",
          onClick: () => openStatusModal(item),
          color: "bg-blue-600 hover:bg-blue-700",
          icon: FiCheckCircle
        };
      case "approved":
        return {
          label: "Add Delivery Details",
          onClick: () => openDeliveryModal(item),
          color: "bg-indigo-600 hover:bg-indigo-700",
          icon: FiTruck
        };
      default:
        return null;
    }
  };

 

  // Image Viewer Modal
  const ImageViewerModal = ({ image, onClose }) => (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-5000 backdrop-blur-sm">
        <div className="relative max-w-4xl max-h-full">
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors cursor-pointer z-10"
          >
            <FiX className="w-6 h-6" />
          </button>
          <img 
            src={image} 
            alt="Preview" 
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </ModalPortal>
  );

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange, data }) => {
    if (!data || !data.pagination || totalPages <= 1) return null;

    const renderPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === i
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            {i}
          </button>
        );
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-gray-200 bg-white gap-4">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.pagination.total)} of {data.pagination.total} results
        </div>
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          
          {renderPageNumbers()}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderExpiryTable = () => {
    if (role === "admin") return null;
    
    if (expiryLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (expiryError) return <ErrorMessage message="Failed to load expiry data" />;

    const totalPages = Math.ceil((expiryData?.pagination?.total || 0) / pageSize);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Info</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expiryData?.results?.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(expiryPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900 text-sm">{item.stock_item?.product?.name}</div>
                      <div className="text-xs text-gray-600">SKU: {item.stock_item?.product?.sku}</div>
                      <div className="text-xs text-gray-600">Brand: {item.stock_item?.product?.brand_name}</div>
                      <div className="text-xs text-gray-600">Variant: {item.stock_item?.variant?.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FiHash className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                          {item.batch_number}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Mfg: {item.stock_item?.manufacture_date}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`text-sm ${getDaysRemainingColor(item.remaining_days)}`}>
                        <FiClock className="inline w-3 h-3 mr-1" />
                        {item.remaining_days} days remaining
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <FiBox className="mr-1 w-3 h-3" /> {item.stock_quantity} units
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => openDetailsModal(item)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <FiInfo className="mr-1" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={expiryPage}
          totalPages={totalPages}
          onPageChange={setExpiryPage}
          data={expiryData}
        />
      </div>
    );
  };

  const renderReplacementTable = () => {
    if (replacementLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (replacementError) return <ErrorMessage message="Failed to load replacement data" />;

    const totalPages = Math.ceil((replacementData?.pagination?.total || 0) / pageSize);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Info</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason & Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Note</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {replacementData?.results?.map((item, index) => {
                const buttonConfig = getStatusButtonConfig(item);
                const showTrackingButton = item.status === "dispatched" || item.status === "completed";
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(replacementPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold">ID: {item.request_id}</div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 text-sm">{item.product_name}</div>
                        <div className="text-xs text-gray-600">{item.variant_name}</div>
                        <div className="text-xs text-gray-600">Batch: {item.batch_number}</div>
                        <div className="text-xs font-medium text-blue-600">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.images && item.images.length > 0 ? (
                          item.images.map((image, imgIndex) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.image}
                                alt={`Evidence ${imgIndex + 1}`}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                              <div className="absolute cursor-pointer inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                                <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4" onClick={() => setSelectedImage(image.image)} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No images</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium capitalize">{item.reason}</div>
                        <div className="text-xs text-gray-600 line-clamp-2">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                        {item.approved_date && (
                          <div className="text-xs text-gray-500">
                            Approved: {new Date(item.approved_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-4">
                        {item.user_notes}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => openDetailsModal(item)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                        >
                          <FiInfo className="mr-1" /> Details
                        </button>
                        
                        {showTrackingButton && (
                          <button 
                            onClick={() => openTrackingModal(item)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                          >
                            <FiFileText className="mr-1" /> Tracking
                          </button>
                        )}
                        
                        {buttonConfig && (
                          <button 
                            onClick={buttonConfig.onClick}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white transition-colors shadow-sm cursor-pointer ${buttonConfig.color}`}
                          >
                            <buttonConfig.icon className="mr-1" /> {buttonConfig.label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={replacementPage}
          totalPages={totalPages}
          onPageChange={setReplacementPage}
          data={replacementData}
        />
      </div>
    );
  };

  const handleRefresh = () => {
    if (activeTab === "expiry" && role !== "admin") {
      refetchExpiry();
    } else {
      refetchReplacements();
    }
    toast.success("Data refreshed successfully!");
  };

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {role === "admin" ? "Product Replacement Request Management" : "Product Expiry & Replacement Management"}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {role === "admin" 
                ? "Manage replacement requests from resellers" 
                : "View expiring products and manage replacement requests"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button 
              onClick={handleRefresh}
              disabled={expiryLoading || replacementLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`mr-2 ${(expiryLoading || replacementLoading) ? 'animate-spin' : ''}`} /> 
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs - Hide tabs for admin since only one tab is available */}
        {role !== "admin" && (
          <div className="flex space-x-1 rounded-lg bg-white p-2 mb-8 shadow-sm border border-gray-200">
            <button
              className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none cursor-pointer ${
                activeTab === "expiry" 
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              onClick={() => handleTabChange("expiry")}
            >
              <FiAlertTriangle className="mr-2" />
              Product Expiry List
              {expiryLoading && <FiRefreshCw className="ml-2 animate-spin" />}
            </button>
            <button
              className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none cursor-pointer ${
                activeTab === "replacement" 
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              onClick={() => handleTabChange("replacement")}
            >
              <FaExchangeAlt className="mr-2" />
              Replacement Requests
              {replacementLoading && <FiRefreshCw className="ml-2 animate-spin" />}
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === "expiry" ? renderExpiryTable() : renderReplacementTable()}

        {/* Details Modal */}
        {showDetailsModal && selectedItem && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeTab === "expiry" ? "Expiry Details" : "Request Details"}
                  </h3>
                  <button 
                    onClick={closeModals} 
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  {activeTab === "expiry" ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Product Information</h4>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-gray-900">{selectedItem.stock_item?.product?.name}</p>
                            <p className="text-sm text-gray-600">Brand: {selectedItem.stock_item?.product?.brand_name}</p>
                            <p className="text-sm text-gray-600">Variant: {selectedItem.stock_item?.variant?.name}</p>
                            <p className="text-sm text-gray-600">SKU: {selectedItem.stock_item?.product?.sku}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Batch Information</h4>
                          <div className="space-y-2">
                            <p className="text-sm">Batch: <strong>{selectedItem.batch_number}</strong></p>
                            <p className="text-sm">Manufacture: {selectedItem.stock_item?.manufacture_date}</p>
                            <p className="text-sm">Expiry: {new Date(selectedItem.expiry_date).toLocaleDateString()}</p>
                            <p className={`text-sm font-semibold ${getDaysRemainingColor(selectedItem.remaining_days)}`}>
                              {selectedItem.remaining_days} days remaining
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Stock Information</h4>
                          <div>
                            <p className="text-lg font-semibold text-blue-600">{selectedItem.stock_quantity} units</p>
                            <p className="text-sm text-gray-600">Status: {selectedItem.stock_item?.is_expired ? "Expired" : "Active"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Current Status</h4>
                          <div className="whitespace-nowrap">
                            {getStatusBadge(selectedItem.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Request Information</h4>
                          <div className="space-y-2">
                            <p className="text-sm">Request ID: <strong>#{selectedItem.request_id}</strong></p>
                            <p className="text-sm whitespace-nowrap">Status: {getStatusBadge(selectedItem.status)}</p>
                            <p className="text-sm">Requested: {new Date(selectedItem.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Product Details</h4>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-gray-900">{selectedItem.product_name}</p>
                            <p className="text-sm text-gray-600">{selectedItem.variant_name}</p>
                            <p className="text-sm text-gray-600">Batch: {selectedItem.batch_number}</p>
                            <p className="text-sm font-medium text-blue-600">Quantity: {selectedItem.quantity}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Images Section */}
                      {selectedItem.images && selectedItem.images.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Uploaded Images</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {selectedItem.images.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.image}
                                  alt={`Evidence ${image.id}`}
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                                  <FiEye className="text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4" onClick={() => setSelectedImage(image.image)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Reason & Description</h4>
                        <div className="space-y-2">
                          <p className="text-sm font-medium capitalize bg-gray-50 px-3 py-2 rounded-lg">{selectedItem.reason}</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {selectedItem.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedItem && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Update Request Status
                  </h3>
                  <button 
                    onClick={closeModals} 
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleStatusUpdate} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Status
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg whitespace-nowrap">
                        {getStatusBadge(selectedItem.status)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        value={statusForm.status}
                        onChange={(e) => setStatusForm(prev => ({...prev, status: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer"
                        required
                      >
                        <option value="">Select new status</option>
                        {selectedItem.status === "pending" && (
                          <>
                            <option value="approved">Approved & Processing</option>
                            <option value="rejected">Rejected (Cancelled)</option>
                          </>
                        )}
                        {selectedItem.status === "in_transit" && (
                          <option value="received">Returned Item Received</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={statusForm.notes}
                        onChange={(e) => setStatusForm(prev => ({...prev, notes: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows="3"
                        placeholder="Add any notes about this status change..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={closeModals} 
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="px-4 whitespace-nowrap py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {updatingStatus ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Delivery Details Modal */}
        {showDeliveryModal && selectedItem && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Delivery Details
                  </h3>
                  <button 
                    onClick={closeModals} 
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleDeliveryUpdate} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Courier Name
                      </label>
                      <input
                        type="text"
                        value={deliveryForm.courier_name}
                        onChange={(e) => setDeliveryForm(prev => ({...prev, courier_name: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter courier company name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        value={deliveryForm.delivery_date}
                        onChange={(e) => setDeliveryForm(prev => ({...prev, delivery_date: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Batch Number
                      </label>
                      <input
                        type="text"
                        value={deliveryForm.new_batch_number}
                        onChange={(e) => setDeliveryForm(prev => ({...prev, new_batch_number: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter new batch number"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking ID
                      </label>
                      <input
                        type="text"
                        value={deliveryForm.tracking_id}
                        onChange={(e) => setDeliveryForm(prev => ({...prev, tracking_id: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter tracking ID"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Receipt (Optional)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setDeliveryForm(prev => ({...prev, receipt: e.target.files[0]}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        accept="image/*,.pdf"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={deliveryForm.notes}
                        onChange={(e) => setDeliveryForm(prev => ({...prev, notes: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows="3"
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={closeModals} 
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="px-4 whitespace-nowrap py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {updatingStatus ? "Updating..." : "Update Delivery"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Tracking Details Modal */}
        {showTrackingModal && selectedItem && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tracking Details
                  </h3>
                  <button 
                    onClick={closeModals} 
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Courier Name
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedItem.courier_name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Tracking ID
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedItem.tracking_number || "Not provided"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Delivery Date
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedItem.delivery_date ? selectedItem.delivery_date : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          New Batch Number
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedItem.new_batch_number || "Not provided"}
                        </p>
                      </div>
                    </div>
                    
                 
                    
                    {selectedItem.delivery_note && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          Delivery Notes
                        </label>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {selectedItem.delivery_note}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button 
                      onClick={closeModals} 
                      className="px-4 py-2 border  border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Image Viewer Modal */}
        {selectedImage && (
          <ModalPortal>
            <ImageViewerModal 
              image={selectedImage} 
              onClose={() => setSelectedImage(null)} 
            />
          </ModalPortal>
        )}
      </div>
    </div>
  );
};

export default ExpiryReplacementPage;