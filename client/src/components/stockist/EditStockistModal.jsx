import React, { useState } from 'react';

export default function EditStockistModal({ vendor, onClose, onSave }) {
  const [form, setForm] = useState({ ...vendor });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">Edit Stockist Details</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="userName"
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="UserName"
            required
          />
          <input
            id="Email"
            type="text"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder='Email'
            className="input input-bordered w-full"
          />
          
          <input
            id="Role"
            type="text"
            name="role"
            value={form.role}
            disabled
            className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
            
          />
         
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}
