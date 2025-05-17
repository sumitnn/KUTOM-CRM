import React from 'react';

export default function VendorTableRow({ user, onEdit }) {
  return (
    <tr>
      <th>
        <label>
          <input type="checkbox" className="checkbox" />
        </label>
      </th>
      <td>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="mask mask-squircle h-12 w-12">
              <img src={user.avatar} alt={user.name} />
            </div>
          </div>
          <div>
            <div className="font-bold">{user.name}</div>
            <div className="text-sm opacity-50">{user.country}</div>
          </div>
        </div>
      </td>
      <td>
        {user.company}
        <br />
        <span className="badge badge-ghost badge-sm">{user.role}</span>
      </td>
      <td>{user.color}</td>
      <th className="flex gap-3">
        <button className="btn btn-soft btn-secondary" onClick={() => onEdit(user)}>Edit</button>
        <button className="btn btn-soft btn-accent">Delete</button>
      </th>
    </tr>
  );
}
