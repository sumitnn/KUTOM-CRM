import React, { useState } from 'react';

const mockUnapprovedOrders = [
  {
    id: 1,
    user: { name: 'Alice Smith', profile: 'https://i.pravatar.cc/150?img=1' },
    product: 'Smartphone',
    quantity: 2,
    price: 499,
    orders: [
      { id: 1001, product: 'Smartphone', quantity: 2, price: 499, date: '2025-05-10' },
      { id: 1002, product: 'Smartphone Case', quantity: 1, price: 49, date: '2025-05-09' },
    ],
  },
  {
    id: 2,
    user: { name: 'Bob Johnson', profile: 'https://i.pravatar.cc/150?img=5' },
    product: 'Headphones',
    quantity: 1,
    price: 199,
    orders: [
      { id: 1003, product: 'Headphones', quantity: 1, price: 199, date: '2025-05-08' },
    ],
  },
];

const UnapprovedOrdersTable = ({ onViewUserOrders }) => {
  const [orders, setOrders] = useState(mockUnapprovedOrders);

  const handleApprove = (id) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    alert(`Order ${id} approved`);
  };

  const handleReject = (id) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
    alert(`Order ${id} rejected`);
  };

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
      <table className="table w-full table-zebra">
        <thead className="bg-gray-100">
          <tr>
            <th>User</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price ($)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-500">
                No unapproved orders
              </td>
            </tr>
          ) : (
            orders.map(({ id, user, product, quantity, price, orders: userOrderHistory }) => (
              <tr key={id}>
                <td className="flex items-center gap-3">
                  <img
                    src={user.profile}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-medium">{user.name}</span>
                </td>
                <td>{product}</td>
                <td>{quantity}</td>
                <td>{price.toFixed(2)}</td>
                <td className="flex gap-2">
                  <button
                    onClick={() => handleApprove(id)}
                    className="btn btn-success btn-sm"
                    aria-label={`Approve order ${id}`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(id)}
                    className="btn btn-error btn-sm"
                    aria-label={`Reject order ${id}`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onViewUserOrders(userOrderHistory)}
                    className="btn btn-info btn-sm"
                    aria-label={`View all orders for ${user.name}`}
                  >
                    View All
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UnapprovedOrdersTable;
