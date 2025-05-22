import React,{useState} from 'react';


const OrderCard = ({ order, onViewUserOrders, onApprove, onReject}) => {
  const user = order.reseller || { name: 'Unknown Reseller' };
  const stockist = order.stockist || { name: 'Unknown Stockist' };
  const firstItem = order.items?.[0] || {};
  const productName = firstItem.product?.name || 'N/A';
  const quantity = firstItem.quantity || 0;
  const price = firstItem.price ?? 0;
  const status = order.status?.toLowerCase(); 

  const isDisabled = status === 'approved' || status === 'rejected';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 transition hover:shadow-lg flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Reseller: {user.username}</h3>
          <p className="text-sm font-bold text-gray-500">Stockist: {stockist.username}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium
            ${status === 'approved' ? 'bg-green-500' : 
              status === 'rejected' ? 'bg-red-500' :
              status === 'forward' ? 'bg-blue-500' : 'bg-yellow-500'}`}>
            {status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700 text-sm font-medium">
        <div>Product: <span className="font-semibold text-gray-900">{productName}</span></div>
        <div>Quantity: {quantity}</div>
        <div className='font-bold'>Price: ₹ {price}</div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button
          className="btn btn-success btn-sm"
          onClick={() => onApprove(order.id)}
          disabled={isDisabled}
        >
          Approve
        </button>
        <button
          className="btn btn-error btn-sm"
          onClick={() => onReject(order.id)}
          disabled={isDisabled}
        >
          Reject
        </button>
        <button
          className="btn btn-info btn-sm"
          onClick={() => onViewUserOrders(order.items)}
          disabled={isDisabled}
        >
          View All
        </button>
      </div>
      
    </div>
  );
};

export default OrderCard;
