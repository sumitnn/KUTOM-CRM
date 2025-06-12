import React from 'react';

export default function StockistResellerCard({ user, onView }) {
  const address = user.street_address 
    ? `${user.street_address}, ${user.city}, ${user.postal_code}`
    : 'Address not available';

  return (
    <div className="card bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className="card-body p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="avatar">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              {user.user?.profile_picture ? (
                <img 
                  src={user.user.profile_picture} 
                  alt={user.user.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                user.user?.full_name?.charAt(0) || 'U'
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="card-title text-lg font-semibold truncate">
              {user.user?.full_name || 'No Name'}
            </h2>
            <p className="text-sm text-gray-500 truncate">{user.user?.email}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600">{address}</span>
          </div>
          {user.is_primary && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Primary Address
            </span>
          )}
        </div>

        <div className="card-actions">
          <button 
            className="btn btn-primary btn-sm w-full bg-gradient-to-r from-blue-500 to-purple-500 border-none text-white hover:from-blue-600 hover:to-purple-600"
            onClick={() => onView(user)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}