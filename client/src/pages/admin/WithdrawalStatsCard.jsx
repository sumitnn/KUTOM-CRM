// features/withdrawal/WithdrawalStatsCard.jsx
import React from 'react';
import { useGetWithdrawalsQuery } from './withdrawalApi';

const statusColors = {
  pending: 'bg-yellow-400',
  approved: 'bg-green-400',
  rejected: 'bg-red-400',
};

const WithdrawalStatsCard = () => {
  const { data: pendingData } = useGetWithdrawalsQuery({ status: 'pending', page_size: 1 });
  const { data: approvedData } = useGetWithdrawalsQuery({ status: 'approved', page_size: 1 });
  const { data: rejectedData } = useGetWithdrawalsQuery({ status: 'rejected', page_size: 1 });

  const stats = [
    { name: 'Pending', value: pendingData?.count || 0, color: statusColors.pending },
    { name: 'Approved', value: approvedData?.count || 0, color: statusColors.approved },
    { name: 'Rejected', value: rejectedData?.count || 0, color: statusColors.rejected },
  ];

  const total = stats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Withdrawal Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.name}>
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                <span>{stat.name}</span>
                <span>
                  {stat.value} ({total > 0 ? Math.round((stat.value / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${stat.color}`}
                  style={{ width: `${total > 0 ? (stat.value / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {stats.reduce((acc, stat, index) => {
                const prevPercent = acc.reduce((sum, s) => sum + (s.value / total) * 100, 0);
                const percent = (stat.value / total) * 100;
                
                if (percent === 0) return acc;
                
                return [
                  ...acc,
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke={stat.color}
                    strokeWidth="10"
                    strokeDasharray={`${percent} ${100 - percent}`}
                    strokeDashoffset={-prevPercent}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                ];
              }, [])}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalStatsCard;