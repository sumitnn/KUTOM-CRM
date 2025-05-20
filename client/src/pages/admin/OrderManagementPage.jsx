import React, { useState } from 'react';
import UnapprovedOrdersTable from './UnapprovedOrdersTable';
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
      <h1 className="text-4xl font-bold text-center mb-8">Order Request Management</h1>

      {/* Unapproved Orders Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Unapproved Order Requests</h2>
        <UnapprovedOrdersTable onViewUserOrders={handleViewUserOrders} />
      </section>

      {/* Orders Tabs */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Order Requests</h2>
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
