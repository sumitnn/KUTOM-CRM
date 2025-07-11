import React, { useState } from 'react';

const CreateVendorModal = ({ onClose, onAddVendor, loading, error }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    onAddVendor({ username: form.username, email: form.email, password: form.password });
  };

  return (
    <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Create New Vendor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="username"
            type="text"
            name="username"
            placeholder="Username"
            className="input input-bordered w-full"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            className="input input-bordered w-full"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            className="input input-bordered w-full"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="input input-bordered w-full"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          {error && (
            <p className="text-red-600 mt-1">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-dots loading-xl"></span> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVendorModal;
