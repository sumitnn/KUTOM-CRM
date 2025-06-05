import React from 'react';
import StatCard from "../../components/StatCard";
import ChartDashboard from '../../components/ChartDashboard';

import { useGetOrderSummaryQuery } from '../../features/order/orderApi';
import { useGetProductStatsQuery } from '../../features/product/productApi';
import { useGetWalletQuery } from '../../features/walletApi';

const AdminDashboard = () => {
  const { data: orderSummary, isLoading: orderLoading } = useGetOrderSummaryQuery();
  const { data: productStats, isLoading: productLoading } = useGetProductStatsQuery();
  const { data: walletData, isLoading: walletLoading } = useGetWalletQuery();

  const totalProducts = productStats?.total ?? 0;
  const totalOrders = orderSummary?.statusCounts?.All ?? 0;
  const pendingOrders = orderSummary?.statusCounts?.Pending ?? 0;
  const walletBalance = walletData?.balance ?? 0;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts.toLocaleString(),
      description: "Fetched from DB",
      color: "primary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-8 w-8 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: "Fetched from DB",
      color: "secondary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-8 w-8 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: "Orders Request",
      value: pendingOrders.toLocaleString(),
      description: "Pending Orders from Resellers",
      color: "accent",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-8 w-8 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    {
      title: "Wallet",
      value: `₹${walletBalance.toLocaleString()}`,
      description: `${walletData?.pending ?? 0} Transactions Pending`,
      color: "secondary",
      avatar: "https://img.daisyui.com/images/profile/demo/anakeen@192.webp",
    },
  ];

  if (orderLoading || productLoading || walletLoading) return <div>Loading admin dashboard...</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px]">
        {stats.map((stat, index) => (
          <div key={index} className="w-full">
            <div className="stats shadow w-full">
              <StatCard {...stat} />
            </div>
          </div>
        ))}
      </div>
      <ChartDashboard />
    </>
  );
};

export default AdminDashboard;
