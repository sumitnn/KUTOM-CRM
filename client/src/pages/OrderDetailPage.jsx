import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  FiMapPin,
  FiChevronLeft,
  FiX,
  FiLoader,
  FiAlertCircle
} from "react-icons/fi";
import { useGetAdminProductOrderByIdQuery, useCancelOrderMutation } from "../features/order/orderApi";
import { format, parseISO } from "date-fns";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  ready_for_dispatch: "bg-purple-100 text-purple-800",
  dispatched: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800"
};

const statusIcons = {
  new: <FiBox className="mr-1" />,
  accepted: <FiCheckCircle className="mr-1" />,
  rejected: <FiX className="mr-1" />,
  ready_for_dispatch: <FiPackage className="mr-1" />,
  dispatched: <FiTruck className="mr-1" />,
  delivered: <FiCheckCircle className="mr-1" />,
  cancelled: <FiX className="mr-1" />
};

const OrderDetailPage = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, refetch } = useGetAdminProductOrderByIdQuery(id);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <FiLoader className="animate-spin text-4xl text-indigo-600" />
    </div>
  );

  if (isError) return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <FiAlertCircle className="text-red-600 text-2xl" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load order</h3>
      <p className="text-gray-600 mb-4">Please try again later</p>
      <button
        onClick={refetch}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Retry
      </button>
    </div>
  );

  if (!order) return null;

  const backLink = role === "vendor" ? "/vendor/orders" : "/admin/orders";
  const orderDate = parseISO(order.created_at);
  const expectedDeliveryDate = order.expected_delivery_date ? parseISO(order.expected_delivery_date) : null;

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(id, { note: cancelNote }).unwrap();
      refetch();
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={backLink}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            <FiChevronLeft className="mr-1" />
            Back to {role === "vendor" ? "My Orders" : "Orders"}
          </Link>
          <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Order #{order.id}</h1>
            <div className="mt-2 md:mt-0 flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {statusIcons[order.status]}
                {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
            <p>Order Date: {format(orderDate, 'MMMM d, yyyy')}</p>
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
                    <p><span className="font-medium">Vendor ID:</span> {order.created_for.role_based_id || "N/A"}</p>
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
                    {order.address ? (
                      <>
                        <p>{order.address.street_address || "N/A"}</p>
                        <p>
                          {order.address.city || ""}, 
                          {order.address.state && ` ${order.address.state}`}
                          {order.address.postal_code && ` ${order.address.postal_code}`}
                        </p>
                        <p>{order.address.country || "India"}</p>
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
                        <span className="font-medium">Expected Delivery:</span> {format(expectedDeliveryDate, 'MMMM d, yyyy')}
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
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.product?.name || item.admin_product?.name || "Unknown Product"}
                          </h3>
                          <div className="mt-1 text-sm text-gray-500 space-y-1">
                            <p>SKU: {item.product?.sku || item.admin_product?.sku || "N/A"}</p>
                            {item.product_size && <p>Size: {item.product_size.size} {item.product_size.size_unit}</p>}
                            {item.admin_product_size && <p>Size: {item.admin_product_size.size} {item.admin_product_size.size_unit}</p>}
                            {item.product?.category_name && <p>Category: {item.product.category_name}</p>}
                            {item.product?.brand_name && <p>Brand: {item.product.brand_name}</p>}
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

            {/* Order History */}
            {order.history?.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order History</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {order.history.map((historyItem, idx) => (
                        <li key={historyItem.id}>
                          <div className="relative pb-8">
                            {idx !== order.history.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${statusColors[historyItem.action]}`}>
                                  {statusIcons[historyItem.action]}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-800">
                                    <span className="font-medium">{historyItem.actor?.username || 'System'}</span> changed status to{' '}
                                    <span className="font-medium">{historyItem.action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                                  </p>
                                  {historyItem.notes && (
                                    <p className="text-sm text-gray-500 mt-1">{historyItem.notes}</p>
                                  )}
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  <time dateTime={historyItem.timestamp}>
                                    {format(parseISO(historyItem.timestamp), 'MMM d, yyyy h:mm a')}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
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
                    <p>₹{(parseFloat(order.total_price) - parseFloat(order.transport_charges)).toFixed(2)}</p>
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

            {/* Action Buttons */}
            {(order.status === 'new' && role !== 'admin') && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Actions</h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                  {order.status === 'new' && (
                    <button
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  )}
                  {/* {role === 'admin' && (
                    <>
                      <button
                        onClick={() => navigate(`/${role}/orders/${order.id}/update-status`)}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => navigate(`/${role}/orders/${order.id}/edit`)}
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit Order
                      </button>
                    </>
                  )} */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Transition show={isCancelDialogOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsCancelDialogOpen}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                      <FiX className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Cancel Order #{order.id}
                      </DialogTitle>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                        <div className="mt-4">
                          <label htmlFor="cancel-note" className="block text-sm font-medium text-gray-700 text-left">
                            Reason for cancellation
                          </label>
                          <textarea
                            id="cancel-note"
                            name="cancel-note"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Optional reason for cancellation"
                            value={cancelNote}
                            onChange={(e) => setCancelNote(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <FiLoader className="animate-spin mr-2 h-5 w-5" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Order'
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      onClick={() => setIsCancelDialogOpen(false)}
                      disabled={isCancelling}
                    >
                      Go back
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default OrderDetailPage;