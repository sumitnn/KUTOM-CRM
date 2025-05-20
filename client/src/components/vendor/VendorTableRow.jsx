import React from 'react';

export default function VendorTableRow({ user, onEdit, onDelete }) {
  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${user.username || user.email}?`)) {
      onDelete(user.id);
    }
  };

  return (
    <tr>
      <th>{user.id}</th>
      <td>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="mask mask-squircle h-12 w-12">
              <img
                src={user.profile || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
                alt={user.username || user.name}
              />
            </div>
          </div>
        </div>
      </td>
      <td>{user?.username || "No Name"}</td>
      <td>{user.email}</td>
      <td>{user?.city || "Null"}</td>
      <td>{user?.state || "Null"}</td>
      <th className="flex gap-3">
        <button className="btn btn-soft btn-secondary" onClick={() => onEdit(user)}>Edit</button>
        <button className="btn btn-soft btn-accent" onClick={handleDeleteClick}>Delete</button>
      </th>
    </tr>
  );
}
