import { useState, lazy, Suspense, useEffect } from "react";
import { 
  FiX, 
  FiRefreshCw, FiBox, FiInfo, FiCalendar, 
  FiHash, FiClock, FiAlertTriangle, FiChevronLeft,
  FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiUpload, FiImage, FiTrash2, FiEye, FiTruck, FiCheck
} from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import { 
  useCreateReplacementMutation,
  useGetReplacementsQuery,
  useUpdateStatusMutation,
} from "../../features/returned/replacementApi";
import {
  useGetExpiringProductsQuery,
} from "../../features/expiry/expiryApi";
import { useGetVendorActiveProductsQuery, useGetProductSizesQuery } from "../../features/product/productApi";
import { toast } from "react-toastify";
import ModalPortal from "../../components/ModalPortal";

// Lazy-loaded components
const Spinner = lazy(() => import('../../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../../components/common/ErrorMessage'));

const AdminExpiredAndReplacement = (role) => {

  const [activeTab, setActiveTab] = useState(role?.role === "reseller" ? "replacement" : "expiry");
  const [expiryPage, setExpiryPage] = useState(1);
  const [replacementPage, setReplacementPage] = useState(1);
  const pageSize = 10;
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDeliveryDetailsModal, setShowDeliveryDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isReplacementFromExpiry, setIsReplacementFromExpiry] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Form state for replacement request
  const [requestForm, setRequestForm] = useState({
    product: '',
    variant: '',
    batch_number: '',
    quantity: 1,
    reason: '',
    description: '',
    images: [],
    tracker_id: '',
  });

  // API Hooks with is_own=true query param
  const { 
    data: expiryData, 
    isLoading: expiryLoading, 
    error: expiryError,
    refetch: refetchExpiry 
  } = useGetExpiringProductsQuery({ page: expiryPage, pageSize });

  const { 
    data: replacementData, 
    isLoading: replacementLoading, 
    error: replacementError,
    refetch: refetchReplacements 
  } = useGetReplacementsQuery({ 
    page: replacementPage, 
    pageSize,
    is_own: true
  });

  const [createReplacement, { isLoading: creatingReplacement }] = useCreateReplacementMutation();
  const [updateReplacementStatus, { isLoading: updatingStatus }] = useUpdateStatusMutation();
  const { data: activeProducts } = useGetVendorActiveProductsQuery();
  const { data: productSizes } = useGetProductSizesQuery(requestForm.product, {
    skip: !requestForm.product
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const openRequestModal = () => {
    setIsReplacementFromExpiry(false);
    setRequestForm({
      product: '',
      variant: '',
      batch_number: '',
      quantity: 1,
      reason: '',
      description: '',
      images: [],
      tracker_id: ''
    });
    setShowRequestModal(true);
  };

  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const openReplacementRequestModal = (expiryItem) => {
    setSelectedItem(expiryItem);
    setIsReplacementFromExpiry(true);
    
    setRequestForm({
      product: expiryItem.stock_item.product.id || '',
      variant: expiryItem.stock_item.variant.id || '',
      batch_number: expiryItem.batch_number,
      quantity: expiryItem.stock_quantity || 1,
      reason: 'expired',
      description: `Request for replacement of expired product: ${expiryItem.stock_item.product.name} - ${expiryItem.stock_item.variant.name}. Batch: ${expiryItem.batch_number}. Expired on: ${new Date(expiryItem.expiry_date).toLocaleDateString()}`,
      images: [],
      tracker_id: expiryItem.id.toString()
    });
    
    setShowRequestModal(true);
  };

  const openReceiveModal = (item) => {
    setSelectedItem(item);
    setShowReceiveModal(true);
  };

  const openDeliveryDetailsModal = (item) => {
    setSelectedItem(item);
    setShowDeliveryDetailsModal(true);
  };

  const closeModals = () => {
    setShowRequestModal(false);
    setShowDetailsModal(false);
    setShowReceiveModal(false);
    setShowDeliveryDetailsModal(false);
    setSelectedItem(null);
    setIsReplacementFromExpiry(false);
    setSelectedImage(null);
    setRequestForm({
      product: '',
      variant: '',
      batch_number: '',
      quantity: 1,
      reason: '',
      description: '',
      images: [],
      tracker_id: ''
    });
  };

  // Handle mark as received
  const handleMarkAsReceived = async () => {
    try {
      await updateReplacementStatus({
        id: selectedItem.id,
        status: 'received'
      }).unwrap();
      
      toast.success("Product marked as received successfully!");
      refetchReplacements();
      setShowReceiveModal(false);
    } catch (err) {
      toast.error(err.data?.message || "Failed to update status. Please try again.");
    }
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      
      if (!isValidType) {
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, GIF are allowed.`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingImages(true);

    try {
      const uploadedImages = await Promise.all(
        validFiles.map(async (file) => {
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            url: URL.createObjectURL(file),
            file: file
          };
        })
      );

      setRequestForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));

      toast.success(`${uploadedImages.length} image(s) added successfully`);
    } catch (error) {
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (imageId) => {
    setRequestForm(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      Object.keys(requestForm).forEach(key => {
        if (key !== 'images') {
          formData.append(key, requestForm[key]);
        }
      });
      
      requestForm.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image.file);
      });
      
      await createReplacement(formData).unwrap();
      toast.success("Replacement request submitted successfully!");
      refetchReplacements();
      closeModals();
    } catch (err) {
      toast.error(err.data?.message || "Failed to submit request. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      expiring_soon: { color: "bg-yellow-100 text-yellow-800 border border-yellow-200", label: "Expiring Soon" },
      critical: { color: "bg-orange-100 text-orange-800 border border-orange-200", label: "Critical" },
      expired: { color: "bg-red-100 text-red-800 border border-red-200", label: "Expired" },
      pending: { color: "bg-blue-100 text-blue-800 border border-blue-200", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800 border border-green-200", label: "Approved" },
      dispatched: { color: "bg-purple-100 text-purple-800 border border-purple-200", label: "Dispatched" },
      completed: { color: "bg-emerald-100 text-emerald-800 border border-emerald-200", label: "Completed" },
      rejected: { color: "bg-red-100 text-red-800 border border-red-200", label: "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDaysRemainingColor = (days) => {
    if (days <= 15) return "text-red-600 font-bold";
    if (days <= 30) return "text-orange-600 font-semibold";
    return "text-green-600";
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

  // Receive Confirmation Modal
  const ReceiveConfirmationModal = () => (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Receipt
            </h3>
            <button 
              onClick={() => setShowReceiveModal(false)} 
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-center text-gray-600 mb-2">
              Are you sure you have received the product?
            </p>
            <p className="text-center text-sm text-gray-500">
              This action will mark the replacement as completed.
            </p>
          </div>
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button 
              onClick={() => setShowReceiveModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkAsReceived}
              disabled={updatingStatus}
              className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {updatingStatus ? "Confirming..." : "Yes, Received"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );

  // Delivery Details Modal
  const DeliveryDetailsModal = () => (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Details
            </h3>
            <button 
              onClick={() => setShowDeliveryDetailsModal(false)} 
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Courier Name</label>
                <p className="text-sm text-gray-900 mt-1">{selectedItem?.courier_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tracking ID</label>
                <p className="text-sm text-gray-900 mt-1">{selectedItem?.tracking_number || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Batch Number</label>
                <p className="text-sm text-gray-900 mt-1">{selectedItem?.new_batch_number || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Delivery Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedItem?.delivery_date ? new Date(selectedItem.delivery_date).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Note</label>
              <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                {selectedItem?.delivery_note || "No delivery note provided"}
              </p>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200">
            <button 
              onClick={() => setShowDeliveryDetailsModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
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
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          
          {renderPageNumbers()}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 transition-colors cursor-pointer"
          >
            <FiChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderExpiryTable = () => {
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
                      <div className="font-semibold text-gray-900 text-sm">{item.stock_item.product.name}</div>
                      <div className="text-xs text-gray-600">SKU: {item.stock_item.product.sku}</div>
                      <div className="text-xs text-gray-600">Brand: {item.stock_item.product.brand_name}</div>
                      <div className="text-xs text-gray-600">Variant: {item.stock_item.variant.name}</div>
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
                        Mfg: {item.stock_item.manufacture_date}
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
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => openDetailsModal(item)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                      >
                        <FiInfo className="mr-1" /> Details
                      </button>
                      {item.can_request_return && (
                        <button 
                          onClick={() => openReplacementRequestModal(item)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                        >
                          <FaExchangeAlt className="mr-1" /> Request Return
                        </button>
                      )}
                    </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {replacementData?.results?.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(replacementPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">ID: {item.request_id}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
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
                    <div className="space-y-2">
                      {getStatusBadge(item.status)}
                      {item.approved_date && (
                        <div className="text-xs text-gray-500">
                          Approved: {new Date(item.approved_date).toLocaleDateString()}
                        </div>
                      )}
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
                      
                      {/* Show Mark as Received button only for dispatched status */}
                      {item.status === 'dispatched' && (
                        <button 
                          onClick={() => openReceiveModal(item)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                        >
                          <FiCheck className="mr-1" /> Mark Received
                        </button>
                      )}
                      
                      {/* Show Delivery Details button for dispatched and completed status */}
                      {(item.status === 'dispatched' ) && (
                        <button 
                          onClick={() => openDeliveryDetailsModal(item)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm cursor-pointer"
                        >
                          <FiTruck className="mr-1" /> Delivery Info
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
    if (activeTab === "expiry") {
      refetchExpiry();
    } else {
      refetchReplacements();
    }
    toast.success("Data refreshed successfully!");
  };

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-8xl mx-auto ">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Product Expiry & Replacement
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage your expiring products and replacement requests
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
            {activeTab === "replacement" && (
              <button 
                onClick={openRequestModal}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FaExchangeAlt className="mr-2" /> 
                New Request
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-white p-2 mb-8 shadow-sm border border-gray-200">
  
  {/* 👇 Only show Product Expiry tab if user is NOT a reseller */}
  {role.role == "admin" && (
    <button
      className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none cursor-pointer ${
        activeTab === "expiry"
          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
      onClick={() => handleTabChange("expiry")}
    >
      <FiAlertTriangle className="mr-2" />
      Product Expiry
      {expiryLoading && <FiRefreshCw className="ml-2 animate-spin" />}
    </button>
  )}

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


        {/* Content */}
        {activeTab === "expiry" ? renderExpiryTable() : renderReplacementTable()}

        {/* Replacement Request Modal */}
        {showRequestModal && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isReplacementFromExpiry ? "Replacement Request for Expired Product" : "New Replacement Request"}
                  </h3>
                  <button 
                    onClick={closeModals} 
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleRequestSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Product</label>
                      <select
                        value={requestForm.product}
                        onChange={(e) => setRequestForm(prev => ({...prev, product: e.target.value, variant: ''}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer"
                        required
                        disabled={isReplacementFromExpiry}
                      >
                        <option value="">Select a product</option>
                        {activeProducts?.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Variant</label>
                      <select
                        value={requestForm.variant}
                        onChange={(e) => setRequestForm(prev => ({...prev, variant: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer"
                        required
                        disabled={isReplacementFromExpiry || !requestForm.product}
                      >
                        <option value="">Select a variant</option>
                        {productSizes?.map(variant => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                      <input
                        type="text"
                        value={requestForm.batch_number}
                        onChange={(e) => setRequestForm(prev => ({...prev, batch_number: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                        placeholder="Enter batch number"
                        disabled={isReplacementFromExpiry}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        value={requestForm.quantity}
                        onChange={(e) => setRequestForm(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                        min="1"
                        disabled={isReplacementFromExpiry}
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <select
                        value={requestForm.reason}
                        onChange={(e) => setRequestForm(prev => ({...prev, reason: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer"
                        required
                        disabled={isReplacementFromExpiry}
                      >
                        <option value="">Select reason</option>
                        <option value="damaged">Damaged Product</option>
                        <option value="defective">Defective Product</option>
                        <option value="wrong_product">Wrong Product</option>
                        {role.role == "admin" &&
                          <option value="expired">Expired Product</option>}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={requestForm.description}
                        onChange={(e) => setRequestForm(prev => ({...prev, description: e.target.value}))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows="3"
                        placeholder="Please describe the issue in detail..."
                        required
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div className="md:col-span-2 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Upload Images (Optional)
                      </label>
                      
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FiUpload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImages}
                          />
                        </label>
                      </div>

                      {/* Image Preview */}
                      {requestForm.images.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Selected Images ({requestForm.images.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {requestForm.images.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(image.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                  {image.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {uploadingImages && (
                        <div className="flex items-center justify-center py-2">
                          <FiRefreshCw className="w-4 h-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-600">Uploading images...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={closeModals} 
                      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingReplacement || uploadingImages}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {creatingReplacement ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

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
                            <p className="text-lg font-semibold text-gray-900">{selectedItem.stock_item.product.name}</p>
                            <p className="text-sm text-gray-600">Brand: {selectedItem.stock_item.product.brand_name}</p>
                            <p className="text-sm text-gray-600">Variant: {selectedItem.stock_item.variant.name}</p>
                            <p className="text-sm text-gray-600">SKU: {selectedItem.stock_item.product.sku}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Batch Information</h4>
                          <div className="space-y-2">
                            <p className="text-sm">Batch: <strong>{selectedItem.batch_number}</strong></p>
                            <p className="text-sm">Manufacture: {new Date(selectedItem.stock_item.manufacture_date).toLocaleDateString()}</p>
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
                            <p className="text-sm text-gray-600">Status: {selectedItem.stock_item.is_expired ? "Expired" : "Active"}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Actions</h4>
                          <div>
                            {selectedItem.can_request_return && (
                              <button 
                                onClick={() => {
                                  closeModals();
                                  openReplacementRequestModal(selectedItem);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                              >
                                <FaExchangeAlt className="mr-2" /> Request Return
                              </button>
                            )}
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
                            <p className="text-sm">Type: <span className="capitalize">{selectedItem.request_type}</span></p>
                            <p className="text-sm">Status: {getStatusBadge(selectedItem.status)}</p>
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

                      {/* Delivery Information for dispatched/completed status */}
                      {(selectedItem.status === 'dispatched' || selectedItem.status === 'received') && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Delivery Information</h4>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Courier:</span> {selectedItem.courier_name || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Tracking ID:</span> {selectedItem.tracking_number || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">New Batch:</span> {selectedItem.new_batch_number || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Delivery Date:</span> {selectedItem.delivery_date ? new Date(selectedItem.delivery_date).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                            {selectedItem.delivery_note && (
                              <div className="mt-3">
                                <span className="font-medium text-sm">Delivery Note:</span>
                                <p className="text-sm text-gray-600 mt-1">{selectedItem.delivery_note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Receive Confirmation Modal */}
        {showReceiveModal && <ReceiveConfirmationModal />}

        {/* Delivery Details Modal */}
        {showDeliveryDetailsModal && <DeliveryDetailsModal />}

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

export default AdminExpiredAndReplacement;