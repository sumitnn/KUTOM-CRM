
import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ 
  title, 
  value, 
  bgColor = 'bg-blue-50', 
  textColor = 'text-blue-600',
  borderColor = 'border-blue-100',
  navlink 
}) => (
  <Link to={navlink} className="block h-full group">
    <div className={`${bgColor} ${borderColor} p-5 rounded-xl border-2 shadow-xs hover:shadow-md transition-all duration-200 h-full flex flex-col`}>
      <p className={`text-sm font-extrabold ${textColor} mb-1`}>{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </Link>
);

export default StatCard;