import { useState } from 'react';
import { useGetAdminOrdersQuery } from '../../features/order/orderApi';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 6;

const TodayOrdersTable = ({ onViewUserOrders }) => {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useGetAdminOrdersQuery({ filter: 'today', page });

  const orders = data?.results || [];
  const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : 1;

  const handleApprove = (id) => alert(`Approve order ${id}`);
  const handleReject = (id) => alert(`Reject order ${id}`);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-center py-8">Loading today orders...</p>
      ) : error ? (
        <p className="text-center text-red-500 py-8">Error loading orders.</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No unapproved orders</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => {
              const { id, reseller, stockist, items = [], status } = order;

              const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
              const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

              return (
                <div
                  key={id}
                  className="bg-white hover:shadow-xl rounded-2xl shadow border border-gray-200 p-5 flex flex-col justify-between min-h-[400px] max-h-[500px] overflow-hidden"
                >
                  {/* Header */}
                  <div className="mb-3">
                    <p className="font-extrabold text-lg mb-1">Order #{id}</p>
                    <p className="text-sm font-bold text-gray-500 capitalize ">Status: <span className='text-blue-600 font-bold'>{status}</span></p>
                  </div>

                  {/* Reseller and Stockist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {[reseller, stockist].map((user, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <img
                          src={user?.profile || 'https://i.pravatar.cc/150'}
                          alt={`${user?.username} profile`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="truncate">
                          <p className="font-bold text-md text-red-500">{user?.username || 'Guest'}</p>
                          <p className="text-sm font-bold text-gray-700 break-words">{user?.email || 'N/A'}</p>
                          <p className="text-md font-bold text-blue-500">{idx === 0 ? 'Reseller' : 'Stockist'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Product Items Scrollable List */}
                  <div className="flex-1 overflow-y-auto border-t pt-2 mb-2 text-sm space-y-2">
                    {items.length === 0 ? (
                      <p className="text-gray-500 italic">No products in this order.</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{item.product?.name || 'Unnamed Product'}</p>
                            <p className="text-sm text-gray-800">Qty: <span className='font-extrabold'>{item.quantity}</span></p>
                          </div>
                          <p className="text-sm font-bold">₹{item.price}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-2 text-sm font-semibold flex justify-between">
                    <span className='font-bold'>Total Qty: {totalQuantity}</span>
                    <span className='font-bold'>Total: ₹ {totalPrice}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleApprove(id)}
                      className="btn btn-success btn-sm font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(id)}
                      className="btn btn-error btn-sm font-bold"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onViewUserOrders(order.items)}
                      className="btn btn-warning btn-sm font-bold"
                    >
                      View History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page}  totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default TodayOrdersTable;
