import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGetOrderByIdQuery} from "../features/order/orderApi";
import {
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
  FiEdit,
} from "react-icons/fi";

const OrderDetailPage = ({ role }) => {
  const { id } = useParams();
  const { data: order, isLoading, isError } = useGetOrderByIdQuery(id);
  const [updateStatus] = useGetOrderByIdQuery(Id);
  const navigate = Navigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleStatusUpdate = async () => {
    if (!status) return;
    
    setIsSubmitting(true);
    try {
      await updateStatus({
        orderId: id,
        status,
        note: status !== "approved" ? reason : undefined,
      }).unwrap();
      setIsModalOpen(false);
      setStatus("");
      setReason("");
      toast.success("Update Order Status successfully!");
      navigate(`/${role}/orders`);

    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to Update Order Status")

    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="text-center mt-10">Loading order details...</p>;
  if (isError) return <p className="text-center mt-10 text-red-600">Failed to load order.</p>;
  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to={`/${role}/orders`}
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
            Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Order Details</h1>
        </div>

        {/* Status Update Button (Visible only for stockist) */}
        {role === "stockist" && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiEdit className="mr-2 h-4 w-4" />
              Update Status
            </button>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Order #{order.id}</h2>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <FiCalendar className="mr-1.5 h-5 w-5 text-gray-400" />
                  <p>
                    Placed on{" "}
                    {new Date(order.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{order.shippingAddress.name || "N/A"}</p>
                <p>{order.shippingAddress.street_address || ""}</p>
                <p>
                  {(order.shippingAddress.city || "")},{" "}
                  {(order.shippingAddress.state || "")}{" "}
                  {(order.shippingAddress.postal_code || "")}
                </p>
                <p>{order.shippingAddress.country || "India"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="flex items-center text-sm text-gray-700 mb-2">
                <FiCreditCard className="mr-2 h-5 w-5 text-gray-400" />
                <span>Payment method: {order.paymentMethod || "N/A"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <FiCheckCircle className="mr-2 h-5 w-5 text-green-500" />
                <span>Paid on {new Date(order.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {order.items.map((item) => {
              const featuredImage =
                item.images?.find((img) => img.is_featured) || item.images?.[0];
              return (
                <div key={item.id} className="p-6 flex">
                  <div className="flex-shrink-0">
                    <img
                      src={featuredImage?.image || "https://via.placeholder.com/80"}
                      alt={item.name}
                      className="w-20 h-20 rounded-md object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/80";
                      }}
                    />
                  </div>
                  <div className="ml-6 flex-1 flex flex-col sm:flex-row">
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-6">
                      <p className="text-base font-medium text-gray-900">
                        ₹{parseFloat(item.total).toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        ₹{parseFloat(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-3">
              <div className="flex justify-between text-base text-gray-700">
                <p>Subtotal</p>
                <p>₹{parseFloat(order.subtotal).toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <p>Shipping</p>
                <p>₹{parseFloat(order.shipping).toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <p>Tax</p>
                <p>₹{parseFloat(order.tax).toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 pt-4 border-t border-gray-200">
                <p>Total</p>
                <p>₹{parseFloat(order.total_price).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Update Order Status</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="">Select status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {status !== "approved" && (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for cancellation
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Enter reason for cancellation"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setStatus("");
                  setReason("");
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={!status || isSubmitting}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (!status || isSubmitting) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;