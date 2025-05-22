import React from 'react';

const OrderCard = ({ order, onViewUserOrders, isApproved }) => {
  // Assuming order shape: { id, reseller: {name, profile}, items: [{product, quantity, price}], status }
  const user = order.reseller || { name: 'Unknown', profile: 'https://i.pravatar.cc/150' };
  const firstItem = order.items?.[0] || {};
  const productName = firstItem.product?.name || 'N/A';
  const quantity = firstItem.quantity || 0;
  const price = firstItem.price ?? 0;

  return (
    <div className="card bg-white shadow-md rounded-lg p-5 flex flex-col space-y-4 hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-4">
        <img
          src={user.profile}
          alt={user.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg font-semibold">{user.name}</h3>
          <p className="text-gray-600">{productName}</p>
        </div>
      </div>

      <div className="flex justify-between text-gray-700 font-medium">
        <span>Quantity: {quantity}</span>
        <span>Price: ${price}</span>
      </div>

      <div className="flex justify-end space-x-3">
        {!isApproved && (
          <>
            <button
              className="btn btn-success btn-sm"
              onClick={() => alert(`Approved order ${order.id}`)}
              type="button"
            >
              Approve
            </button>
            <button
              className="btn btn-error btn-sm"
              onClick={() => alert(`Rejected order ${order.id}`)}
              type="button"
            >
              Reject
            </button>
          </>
        )}

        <button
          className="btn btn-info btn-sm"
          onClick={() => onViewUserOrders(order.items)}
          aria-label={`View all orders for ${user.name}`}
          type="button"
        >
          View All
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
