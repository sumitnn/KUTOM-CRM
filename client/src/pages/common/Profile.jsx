import React, { useState } from 'react';
import {EditProfileModal} from "../../components/EditProfileModal"

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const [admin, setAdmin] = useState({
    name: 'Sumit Nautiyal',
    email: 'admin@example.com',
    phone: '+91 9876543210',
    address: 'Dehradun, Uttarakhand, India',
    avatar: 'https://i.pravatar.cc/150?img=5',
    wallet: 12050.75,
    totalEarnings: 80000,
    totalVendors: 35,
  });

  const handleSave = (updatedData) => {
    setAdmin(updatedData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-base-100 shadow-xl rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="avatar">
          <div className="w-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src={admin.avatar} alt="Admin" />
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold">{admin.name}</h2>
          <p className="text-sm opacity-70">{admin.email}</p>
          <p className="text-sm opacity-70">{admin.phone}</p>
          <p className="mt-2 badge badge-primary">Administrator</p>
        </div>
        <button onClick={() => setIsEditing(true)} className="btn btn-outline btn-sm">
          Edit Profile
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-200 shadow-md">
          <div className="card-body">
            <h2 className="text-sm opacity-70">Wallet Balance</h2>
            <p className="text-2xl font-bold text-success">₹{admin.wallet.toLocaleString()}</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-md">
          <div className="card-body">
            <h2 className="text-sm opacity-70">Total Earnings</h2>
            <p className="text-2xl font-bold text-primary">₹{admin.totalEarnings.toLocaleString()}</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-md">
          <div className="card-body">
            <h2 className="text-sm opacity-70">Total Vendors</h2>
            <p className="text-2xl font-bold text-accent">{admin.totalVendors}</p>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input input-bordered w-full" value={admin.name} readOnly />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input input-bordered w-full" value={admin.email} readOnly />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input input-bordered w-full" value={admin.phone} readOnly />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea className="textarea textarea-bordered w-full" value={admin.address} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && <EditProfileModal admin={admin} onClose={() => setIsEditing(false)} onSave={handleSave} />}
    </div>
  );
}
