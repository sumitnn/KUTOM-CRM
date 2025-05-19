import React from 'react';

const OrderCard = ({ order, onViewUserOrders, isApproved }) => {
  const { user, product, quantity, price } = order;

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
          <p className="text-gray-600">{product}</p>
        </div>
      </div>

      <div className="flex justify-between text-gray-700 font-medium">
        <span>Quantity: {quantity}</span>
        <span>Price: ${price.toFixed(2)}</span>
      </div>

      <div className="flex justify-end space-x-3">
        {!isApproved ? (
          <>
            <button
              className="btn btn-success btn-sm"
              onClick={() => alert(`Approved order ${order.id}`)}
            >
              Approve
            </button>
            <button
              className="btn btn-error btn-sm"
              onClick={() => alert(`Rejected order ${order.id}`)}
            >
              Reject
            </button>
          </>
        ) : null}

        <button
          className="btn btn-info btn-sm"
          onClick={() => onViewUserOrders(order.orders)}
          aria-label={`View all orders for ${user.name}`}
        >
          View All
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
