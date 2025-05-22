import React, { useState } from 'react';
import OrderCard from './OrderCard';
import { useGetAdminOrdersQuery } from '../../features/order/orderApi';

const tabs = [
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const OrderTabs = ({ onViewUserOrders }) => {
  const [activeTab, setActiveTab] = useState('all');

  // Pass query param as an object if API expects that
  const { data, error, isLoading } = useGetAdminOrdersQuery({ filter: activeTab });
  
  // data.results is expected to be array of orders
  const orders = Array.isArray(data) ? data : data?.results || [];

  return (
    <div>
      <div className="tabs tabs-boxed justify-center mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${activeTab === key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center">Loading orders...</p>
      ) : error ? (
        <p className="text-center text-red-500">Failed to load orders.</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewUserOrders={onViewUserOrders}
              isApproved={order.status === 'approved'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderTabs;
