import React from 'react';

export default function StockistCard({ user, onEdit, onDelete, onView }) {
  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${user.username || user.email}?`)) {
      onDelete(user.id);
    }
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all">
      <div className="card-body items-center text-center">
        <div className="avatar">
          <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img
              src={user.profile || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
              alt={user.username || "Profile"}
            />
          </div>
        </div>
        <h2 className="card-title mt-3">{user.username || "No Name"}</h2>
        <p className="text-sm text-gray-500">{user.email}</p>
        <p className="text-sm">{user.city || "City"}, {user.state || "State"}</p>
        <div className="card-actions mt-4 flex flex-wrap gap-2 justify-center">
          <button className="btn btn-outline btn-sm" onClick={() => onEdit(user)}>Edit</button>
          <button className="btn btn-outline btn-error btn-sm" onClick={handleDeleteClick}>Delete</button>
          <button className="btn btn-primary btn-sm" onClick={() => onView(user)}>View Details</button>
        </div>
      </div>
    </div>
  );
}
