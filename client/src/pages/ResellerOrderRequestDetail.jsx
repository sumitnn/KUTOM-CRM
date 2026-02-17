// OrderRequestDetailPage.jsx
import { useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiClock, 
  FiCheckCircle, 
  FiX, 
  FiUser, 
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiAlertCircle,
  FiTag,
  FiLayers,
  FiInfo,
  FiImage,
  FiShoppingBag
} from "react-icons/fi";
import { 
  useGetResellerOrderRequestByIdQuery,
  useUpdateResellerOrderRequestStatusMutation 
} from "../features/order/orderRequest";
import { toast } from "react-toastify";

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

const ResellerOrderRequestDetail = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { 
    data: orderRequest, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetResellerOrderRequestByIdQuery(id);

  const [updateStatus] = useUpdateResellerOrderRequestStatusMutation();

  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(newStatus);
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(`Order request ${newStatus.toLowerCase()} successfully!`);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${newStatus.toLowerCase()} order request`);
    } finally {
      setActionLoading(null);
    }
  };

  const canCancel = role === 'reseller' && orderRequest?.status === 'pending';
  const canApproveReject = role === 'stockist' && orderRequest?.status === 'pending';

  const handleProductChange = (index) => {
    setSelectedProductIndex(index);
    setSelectedImageIndex(0); // Reset image index when changing product
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Suspense fallback={<div>Loading...</div>}>
          <Spinner />
        </Suspense>
      </div>
    );
  }

  if (isError || !orderRequest) {
    return (
      <div className="px-4 py-8">
        <Suspense fallback={<div>Error loading...</div>}>
          <ErrorMessage message={error?.data?.message || "Failed to load order request details"} />
        </Suspense>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: FiClock },
      approved: { color: 'text-green-600 bg-green-50 border-green-200', icon: FiCheckCircle },
      rejected: { color: 'text-red-600 bg-red-50 border-red-200', icon: FiX },
      cancelled: { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: FiX }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(orderRequest.status);
  const StatusIcon = statusConfig.icon;

  const selectedItem = orderRequest.items?.[selectedProductIndex];
  const selectedProduct = selectedItem?.product;

  return (
    <div className="py-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-circle hover:bg-gray-100 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Request Details</h1>
            <p className="text-sm text-gray-600 mt-1">Request ID: {orderRequest.request_id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="font-medium capitalize">{orderRequest.status}</span>
          </div>
        </div>
      </div>

      {/* Product Selection Tabs */}
      {orderRequest.items?.length > 1 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {orderRequest.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleProductChange(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  selectedProductIndex === index
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiPackage className="w-4 h-4" />
                <span className="font-medium">{item.product?.name}</span>
                <span className="text-sm bg-gray-200 px-2 py-0.5 rounded-full">
                  Qty: {item.quantity}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-8">
          {/* Product Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <FiPackage className="w-6 h-6 text-blue-600" />
                Product Details
              </h2>
              {orderRequest.items?.length > 1 && (
                <span className="text-sm text-gray-500">
                  Product {selectedProductIndex + 1} of {orderRequest.items.length}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                  {selectedProduct?.images?.length > 0 ? (
                    <img 
                      src={selectedProduct.images[selectedImageIndex]?.image} 
                      alt={selectedProduct.images[selectedImageIndex]?.alt_text || selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {selectedProduct?.images?.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer ${
                          selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img 
                          src={image.image} 
                          alt={image.alt_text}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct?.name}</h3>
                  <p className="text-gray-600">{selectedProduct?.short_description}</p>
                </div>

                {/* Selected Variant Info */}
                {selectedItem?.variant && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-blue-700">Selected Variant</label>
                    <p className="font-semibold text-blue-900">{selectedItem.variant}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">SKU</label>
                    <p className="font-semibold">{selectedProduct?.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Type</label>
                    <p className="font-semibold capitalize">{selectedProduct?.product_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Weight</label>
                    <p className="font-semibold">{selectedProduct?.weight} {selectedProduct?.weight_unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dimensions</label>
                    <p className="font-semibold">{selectedProduct?.dimensions}</p>
                  </div>
                </div>

                {/* Order Quantity Info */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-green-700">Order Quantity</label>
                      <p className="text-2xl font-bold text-green-700">{selectedItem?.quantity}</p>
                    </div>
                    <div className="text-right">
                      <label className="text-sm font-medium text-green-700">Unit Price</label>
                      <p className="text-xl font-bold text-green-700">₹{selectedItem?.unit_price}</p>
                    </div>
                  </div>
                </div>

                {/* Brand and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <FiShoppingBag className="w-4 h-4" />
                      Brand
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {selectedProduct?.brand?.logo && (
                        <img 
                          src={selectedProduct.brand.logo} 
                          alt={selectedProduct.brand.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <span className="font-semibold">{selectedProduct?.brand?.name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <FiLayers className="w-4 h-4" />
                      Category
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-semibold">{selectedProduct?.category?.main_category_name} → {selectedProduct?.category?.name}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedProduct?.tags?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <FiTag className="w-4 h-4" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map(tag => (
                        <span key={tag.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {selectedProduct?.features?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <FiInfo className="w-4 h-4" />
                      Features
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.features.map((feature, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full Description */}
            {selectedProduct?.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Full Description</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedProduct.description}</p>
              </div>
            )}
          </div>

          {/* Order Items Card - Shows all items with quick view */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FiDollarSign className="w-6 h-6 text-green-600" />
              All Order Items
            </h2>
            
            <div className="space-y-4">
              {orderRequest.items?.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                    selectedProductIndex === index 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleProductChange(index)}
                >
                  <div className="flex items-center gap-4">
                    {item.product?.images?.[0] && (
                      <img 
                        src={item.product.images[0].image} 
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.product?.name}</h4>
                      <p className="text-sm text-gray-600">Variant: {item.variant}</p>
                      <p className="text-sm text-gray-600">SKU: {item.product?.sku}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{item.unit_price} × {item.quantity}</p>
                    <p className="text-lg font-bold text-green-600">₹{item.total_price}</p>
                    <p className="text-sm text-gray-600">
                      GST: {item.gst_percentage}% | Discount: {item.discount_percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Requester Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FiUser className="w-6 h-6 text-purple-600" />
              Requester Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {orderRequest.requested_by?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{orderRequest.requested_by?.username}</p>
                  <p className="text-sm text-gray-600">{orderRequest.requested_by?.role_based_id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="font-semibold">{orderRequest.requested_by?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="font-semibold">{orderRequest.requested_by?.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="font-semibold capitalize">{orderRequest.requested_by?.role}</p>
                </div>
                
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FiDollarSign className="w-6 h-6 text-green-600" />
              Order Summary
            </h2>
            
            <div className="space-y-4">
              {orderRequest.items?.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.product?.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity} × ₹{item.unit_price}</p>
                  </div>
                  <span className="font-semibold">₹{item.total_price}</span>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{orderRequest.total_amount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Currency</span>
                  <span>{selectedProduct?.currency || 'INR'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Request Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FiCalendar className="w-6 h-6 text-orange-600" />
              Request Timeline
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Created</span>
                <span className="text-sm font-semibold">
                  {new Date(orderRequest.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Last Updated</span>
                <span className="text-sm font-semibold">
                  {new Date(orderRequest.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FiInfo className="w-6 h-6 text-gray-600" />
              Request Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Request Type</span>
                <span className="font-semibold capitalize">{orderRequest.requestor_type} → {orderRequest.target_type}</span>
              </div>
            
            </div>
          </div>

          {/* Actions Card */}
          {(canCancel || canApproveReject) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                {canApproveReject && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={actionLoading}
                      className="btn btn-success w-full gap-2 hover:scale-105 transition-transform"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      {actionLoading === 'approved' ? 'Approving...' : 'Approve Request'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={actionLoading}
                      className="btn btn-error w-full gap-2 hover:scale-105 transition-transform"
                    >
                      <FiX className="w-4 h-4" />
                      {actionLoading === 'rejected' ? 'Rejecting...' : 'Reject Request'}
                    </button>
                  </>
                )}
                {canCancel && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={actionLoading}
                    className="btn btn-warning w-full gap-2 hover:scale-105 transition-transform"
                  >
                    <FiX className="w-4 h-4" />
                    {actionLoading === 'cancelled' ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notes Card */}
          {orderRequest.note && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Notes</h2>
              <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{orderRequest.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResellerOrderRequestDetail;