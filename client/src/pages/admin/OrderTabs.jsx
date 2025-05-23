import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import { fetchAdminOrders } from "../../api/OrderApi";

const tabs = [
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' }
];

const OrderTabs = ({ onViewUserOrders }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const getOrders = async () => {
      try {
        const data = await fetchAdminOrders(activeTab);
        const orderList = Array.isArray(data) ? data : data.results || [];
        setOrders(orderList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    getOrders();
  }, [activeTab]);
 

  return (
    <div>
      <div className="tabs tabs-boxed justify-center mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${activeTab === key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
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
