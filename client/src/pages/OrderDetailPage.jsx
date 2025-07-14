import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiTruck,
  FiPackage,
  FiUser,
  FiFileText,
  FiBox,
  FiHome,
  FiMapPin
} from "react-icons/fi";
import { useGetOrderByIdQuery } from "../features/order/orderApi";

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  ready_for_dispatch: "bg-purple-100 text-purple-800",
  dispatched: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusLabels = {
  new: "New Order",
  accepted: "Accepted",
  rejected: "Rejected",
  ready_for_dispatch: "Ready For Dispatch",
  dispatched: "Dispatched (In Progress)",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const OrderDetailPage = ({ role }) => {
  const { id } = useParams();
  const { data: order, isLoading, isError } = useGetOrderByIdQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  if (isLoading) return <div className="text-center mt-10">Loading order details...</div>;
  if (isError) return <div className="text-center mt-10 text-red-600">Failed to load order.</div>;
  if (!order) return null;

  const backLink = role === "vendor" ? "/vendor/my-sales" : "/admin/my-orders";
  const orderDate = new Date(order.created_at);
  const expectedDeliveryDate = order.expected_delivery_date ? new Date(order.expected_delivery_date) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={backLink}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            <svg
              className="h-5 w-5 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to {role === "vendor" ? "My Sales" : "Orders"}
          </Link>
          <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Order #{order.id}</h1>
            <div className="mt-2 md:mt-0 flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
              {order.receipt && (
                <a 
                  href={order.receipt} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                >
                  <FiFileText className="mr-1" /> View Receipt
                </a>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <FiCalendar className="mr-1.5 h-5 w-5 text-gray-400" />
            <p>Order Date: {orderDate.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer and Vendor Information */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Customer & Vendor Details</h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <FiUser className="mr-2 text-indigo-500" /> Customer Details
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">Name:</span> {order.created_by.username}</p>
                    <p><span className="font-medium">Email:</span> {order.created_by.email}</p>
                    <p><span className="font-medium">Phone:</span> {order.created_by.phone || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <FiUser className="mr-2 text-indigo-500" /> Vendor Details
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">Name:</span> {order.created_for.username}</p>
                    <p><span className="font-medium">Email:</span> {order.created_for.email}</p>
                    <p><span className="font-medium">Vendor ID:</span> {order.created_for.role_based_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiTruck className="mr-2 text-indigo-500" /> Shipping Information
                </h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <FiHome className="mr-2 text-indigo-500" /> Shipping Address
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    {order.created_by.address ? (
                      <>
                        <p>{order.created_by.address.street_address || "N/A"}</p>
                        <p>
                          {order.created_by.address.city || ""}, 
                          {order.created_by.address.state && ` ${order.created_by.address.state}`}
                          {order.created_by.address.postal_code && ` ${order.created_by.address.postal_code}`}
                        </p>
                        <p>{order.created_by.address.country || "India"}</p>
                      </>
                    ) : (
                      <p>No shipping address provided</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <FiMapPin className="mr-2 text-indigo-500" /> Delivery Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">Courier:</span> {order.courier_name || "Not specified"}</p>
                    <p><span className="font-medium">Tracking #:</span> {order.tracking_number || "Not available"}</p>
                    {expectedDeliveryDate && (
                      <p>
                        <span className="font-medium">Expected Delivery:</span> {expectedDeliveryDate.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                    <p><span className="font-medium">Transport Charges:</span> ₹{parseFloat(order.transport_charges).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiPackage className="mr-2 text-indigo-500" /> Order Items
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row">
                    <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                        <FiBox className="text-gray-400 h-10 w-10" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                          <div className="mt-1 text-sm text-gray-500 space-y-1">
                            <p>SKU: {item.product.sku}</p>
                            <p>Size: {item.product_size}</p>
                            <p>Category: {item.product.category_name}</p>
                            <p>Brand: {item.product.brand_name}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-lg font-medium text-gray-900">
                            ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            ₹{parseFloat(item.price).toFixed(2)} × {item.quantity}
                          </p>
                          {parseFloat(item.discount) > 0 && (
                            <p className="mt-1 text-sm text-green-600">
                              Discount: ₹{parseFloat(item.discount).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiCreditCard className="mr-2 text-indigo-500" /> Order Summary
                </h2>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-base text-gray-700">
                    <p>Subtotal</p>
                    <p>₹{parseFloat(order.total_price - order.transport_charges).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-base text-gray-700">
                    <p>Shipping</p>
                    <p>₹{parseFloat(order.transport_charges).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-base text-gray-700">
                    <p>Tax</p>
                    <p>₹0.00</p>
                  </div>
                  <div className="flex justify-between text-base font-medium text-gray-900 pt-4 border-t border-gray-200">
                    <p>Total</p>
                    <p>₹{parseFloat(order.total_price).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            {order.note && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiFileText className="mr-2 text-indigo-500" /> Order Notes
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-700">{order.note}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {order.description && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiFileText className="mr-2 text-indigo-500" /> Description
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-700">{order.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;