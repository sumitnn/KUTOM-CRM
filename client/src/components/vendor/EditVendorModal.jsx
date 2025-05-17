import React, { useState } from 'react';

export default function EditVendorModal({ vendor, onClose, onSave }) {
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
        <h2 className="text-lg font-bold mb-4">Edit Vendor</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Name"
            required
          />
          <input
            type="text"
            name="email"
            value={form.email}
            disabled
            className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
          />
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Company"
          />
          <input
            type="text"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Role"
          />
          <input
            type="text"
            name="color"
            value={form.color}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Favorite Color"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
