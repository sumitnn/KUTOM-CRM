// ProgressBar.jsx
import React from 'react';

export default function ProgressBar({ percentage }) {
  const getColor = (percent) => {
    if (percent < 30) return 'bg-error';
    if (percent < 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Profile Completion</span>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${getColor(percentage)}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}