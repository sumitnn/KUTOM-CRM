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
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-center py-8">Loading unapproved orders...</p>
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
                  className="bg-white rounded-2xl shadow border border-gray-200 p-5 flex flex-col justify-between min-h-[400px] max-h-[500px] overflow-hidden"
                >
                  {/* Header */}
                  <div className="mb-3">
                    <p className="font-bold text-lg mb-1">Order #{id}</p>
                    <p className="text-sm text-gray-500 capitalize">Status: {status}</p>
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
                          <p className="font-medium text-sm">{user?.username || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 break-words">{user?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{idx === 0 ? 'Reseller' : 'Stockist'}</p>
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
                            <p className="font-semibold">{item.product?.name || 'Unnamed Product'}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm">${item.price}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-2 text-sm font-semibold flex justify-between">
                    <span>Total Qty: {totalQuantity}</span>
                    <span>Total: ${totalPrice}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(id)}
                      className="btn btn-success btn-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(id)}
                      className="btn btn-error btn-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onViewUserOrders(order.items)}
                      className="btn btn-info btn-sm"
                    >
                      View All
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
