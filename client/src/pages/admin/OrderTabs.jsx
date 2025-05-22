import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import { useGetAdminOrdersQuery } from '../../features/order/orderApi';
import Pagination from '../../components/common/Pagination';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'approved', label: 'Approved' },
];

const PAGE_SIZE = 6;

const OrderTabs = ({ onViewUserOrders, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const { data, error, isLoading } = useGetAdminOrdersQuery({ filter: activeTab, page });
  const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const orders = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="tabs tabs-boxed justify-center my-10">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${activeTab === key ? 'tab-active text-fuchsia-600' : ''}`}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            <span className="font-bold text-xl">{label}</span>
          </button>
        ))}
      </div>

      {/* Order Content */}
      {isLoading ? (
        <p className="text-center">Loading orders...</p>
      ) : error ? (
        <p className="text-center text-red-500">Failed to load orders.</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewUserOrders={onViewUserOrders}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-10">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};

export default OrderTabs;
