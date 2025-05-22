import { useState } from 'react';
import TodayOrdersTable from './TodayOrdersTable';
import OrderTabs from './OrderTabs';
import AdminOrderModal from './AdminOrderModal';

const OrderManagementPage = () => {
  const [userOrders, setUserOrders] = useState(null);

  const handleViewUserOrders = (orders) => {
    setUserOrders(orders);
  };

  const handleCloseModal = () => {
    setUserOrders(null);
  };

  return (
    <div className="px-6 sm:px-6 md:px-8 lg:px-10 py-6 space-y-10">
      <h1 className="text-4xl font-bold text-center mb-8 text-green-400">Orders Management</h1>

      {/* Today Orders Table */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Today's Order Requests</h2>
        <TodayOrdersTable onViewUserOrders={handleViewUserOrders} />
      </section>

      {/* Orders Tabs */}
      <section className='mt-3'>
        <h2 className="text-xl  font-bold my-8">Order Requests</h2>
        <OrderTabs onViewUserOrders={handleViewUserOrders} />
      </section>

      {/* User Orders Modal */}
      {userOrders && (
        <AdminOrderModal orders={userOrders} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default OrderManagementPage;
