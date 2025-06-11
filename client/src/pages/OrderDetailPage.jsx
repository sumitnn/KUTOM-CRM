import React from "react";
import { FiPackage, FiCalendar, FiCreditCard, FiTruck, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";

const OrderDetailPage = () => {
  // Dummy data - replace with API data later
  const order = {
    id: "ORD-123456",
    date: "2023-06-15",
    status: "Delivered",
    paymentMethod: "Credit Card",
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States"
    },
    items: [
      {
        id: "1",
        name: "Premium Wireless Headphones",
        price: 199.99,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
        total: 199.99
      },
      {
        id: "2",
        name: "Smart Watch Series 5",
        price: 249.99,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
        total: 499.98
      }
    ],
    subtotal: 699.97,
    shipping: 0.00,
    tax: 69.99,
    total: 769.96
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            to="/orders" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Order Details</h1>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Order #{order.id}</h2>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  <p>Placed on {new Date(order.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="flex items-center text-sm text-gray-700 mb-2">
                <FiCreditCard className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <span>Payment method: {order.paymentMethod}</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <FiCheckCircle className="flex-shrink-0 mr-2 h-5 w-5 text-green-500" />
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
            {order.items.map((item) => (
              <div key={item.id} className="p-6 flex">
                <div className="flex-shrink-0">
                  <img
                    src={item.image}
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
                    <p className="text-base font-medium text-gray-900">₹{item.total.toFixed(2)}</p>
                    <p className="mt-1 text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                  </div>
                </div>
              </div>
            ))}
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
                <p>₹{order.subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <p>Shipping</p>
                <p>₹{order.shipping.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <p>Tax</p>
                <p>₹{order.tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 pt-4 border-t border-gray-200">
                <p>Total</p>
                <p>₹{order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;