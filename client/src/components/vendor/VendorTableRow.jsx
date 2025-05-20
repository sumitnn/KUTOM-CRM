import React from 'react';

// {
//   name: 'Yancy Tear',
//   country: 'Brazil',
//   company: 'Wyman-Ledner',
//   role: 'Community Outreach Specialist',
//   color: 'Indigo',
//   avatar: 'https://img.daisyui.com/images/profile/demo/5@94.webp',
// },

export default function VendorTableRow({ user, onEdit }) {
  return (
    <tr>
      <th>
        {user.id}
      </th>
      <td>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="mask mask-squircle h-12 w-12">
              {user.profile? <img src={user.profile} alt={user.username} />:<img src="https://img.daisyui.com/images/profile/demo/5@94.webp" alt={user.name} />}
              
            </div>
          </div>
          
        </div>
      </td>
      <td>
      {user?.username || "No Name"}
        
      </td>
      <td>{user.email}</td>
      <td>{user?.city || "Null"}</td>
      <td>{user?.state || "Null"}</td>
      <th className="flex gap-3">
        <button className="btn btn-soft btn-secondary" onClick={() => onEdit(user)}>Edit</button>
        <button className="btn btn-soft btn-accent">Delete</button>
      </th>
    </tr>
  );
}
