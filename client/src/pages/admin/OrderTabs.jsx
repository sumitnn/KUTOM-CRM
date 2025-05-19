import React, { useState } from 'react';
import OrderCard from './OrderCard';

const mockOrders = [
  {
    id: 101,
    user: { name: 'John Doe', profile: 'https://i.pravatar.cc/150?img=2' },
    product: 'Laptop',
    quantity: 1,
    price: 899,
    approved: true,
    orders: [
      { id: 1101, product: 'Laptop', quantity: 1, price: 899, date: '2025-05-05' },
    ],
  },
  {
    id: 102,
    user: { name: 'Jane Doe', profile: 'https://i.pravatar.cc/150?img=3' },
    product: 'Monitor',
    quantity: 3,
    price: 299,
    approved: false,
    orders: [
      { id: 1102, product: 'Monitor', quantity: 3, price: 299, date: '2025-05-06' },
    ],
  },
  {
    id: 103,
    user: { name: 'Mike Ross', profile: 'https://i.pravatar.cc/150?img=4' },
    product: 'Keyboard',
    quantity: 2,
    price: 99,
    approved: true,
    orders: [
      { id: 1103, product: 'Keyboard', quantity: 2, price: 99, date: '2025-05-07' },
    ],
  },
];

const tabs = [
  { key: 'approved', label: 'Approved' },
  { key: 'unapproved', label: 'Unapproved' },
  { key: 'all', label: 'All' },
];

const OrderTabs = ({ onViewUserOrders }) => {
  const [activeTab, setActiveTab] = useState('approved');

  let filteredOrders;
  if (activeTab === 'approved') {
    filteredOrders = mockOrders.filter((o) => o.approved);
  } else if (activeTab === 'unapproved') {
    filteredOrders = mockOrders.filter((o) => !o.approved);
  } else {
    filteredOrders = mockOrders;
  }

  return (
    <div>
      <div className="tabs tabs-boxed justify-center mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${activeTab === key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(key)}
            aria-selected={activeTab === key}
            role="tab"
          >
            {label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewUserOrders={onViewUserOrders}
              isApproved={order.approved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderTabs;
