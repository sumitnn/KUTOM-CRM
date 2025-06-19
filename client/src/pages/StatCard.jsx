import React from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiDollarSign, FiShoppingCart, FiTruck, FiCreditCard, FiActivity, FiRefreshCw, FiDownload } from 'react-icons/fi';

const iconMap = {
  "Active Products": <FiBox className="text-xl" />,
  "Requested Products": <FiBox className="text-xl" />,
  "Total Sales": <FiDollarSign className="text-xl" />,
  "Dipatch": <FiTruck className="text-xl" />,
  "Wallet Balance": <FiCreditCard className="text-xl" />,
  "Topup Requests": <FiActivity className="text-xl" />,
  "Last Tranaction": <FiRefreshCw className="text-xl" />,
  "Withdrawals (request)": <FiDownload className="text-xl" />,
};

const StatCard = ({ 
  title, 
  value, 
  bgColor = 'bg-blue-50', 
  textColor = 'text-blue-600',
  borderColor = 'border-blue-100',
  navlink 
}) => (
  <Link to={navlink} className="block h-full group">
    <div className={`${bgColor} ${borderColor} p-5 rounded-xl border hover:border-gray-300 shadow-xs hover:shadow-md transition-all duration-200 h-full flex flex-col`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-bold ${textColor} mb-1`}>{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${textColor} bg-white bg-opacity-50`}>
          {iconMap[title]}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 font-extrabold hover:cursor-pointer animate-pulse">
        View all →
      </div>
    </div>
  </Link>
);

export default StatCard;