import { useState, useEffect } from 'react';
import { fetchAdminOrders } from "../../api/OrderApi";

const UnapprovedOrdersTable = ({ onViewUserOrders }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const getPendingOrders = async () => {
      const data = await fetchAdminOrders('forwarded');
      const orderList = Array.isArray(data) ? data : data.results || [];
      setOrders(orderList);
    };
    getPendingOrders();
  }, []);

  // Approve/Reject handlers will hit your backend API in a real app
  const handleApprove = (id) => alert(`Approve order ${id}`);
  const handleReject = (id) => alert(`Reject order ${id}`);

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
            orders?.map((order) => {
              const { id, reseller, total_price, items } = order;
              const user = {
                name: reseller.name,
                profile: reseller.avatar || 'https://i.pravatar.cc/150',
              };
              const firstItem = items[0] || {};

              return (
                <tr key={id}>
                  <td className="flex items-center gap-3">
                    <img src={user.profile} className="w-10 h-10 rounded-full" />
                    <span>{user.name}</span>
                  </td>
                  <td>{firstItem.product?.name}</td>
                  <td>{firstItem.quantity}</td>
                  <td>{firstItem.price}</td>
                  <td className="flex gap-2">
                    <button onClick={() => handleApprove(id)} className="btn btn-success btn-sm">
                      Approve
                    </button>
                    <button onClick={() => handleReject(id)} className="btn btn-error btn-sm">
                      Reject
                    </button>
                    <button
                      onClick={() => onViewUserOrders(order.items)}
                      className="btn btn-info btn-sm"
                    >
                      View All
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UnapprovedOrdersTable;
