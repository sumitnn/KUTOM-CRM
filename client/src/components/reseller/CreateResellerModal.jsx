import React, { useEffect, useState } from 'react';
import { useGetDistrictsQuery, useGetStatesQuery } from '../../features/location/locationApi';

const CreateResellerModal = ({ onClose, onAddVendor, loading, error }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    state: '',
    district: '',
    is_default_user: false,
  });

  // Fetching states and districts using RTK Query hooks
  const { data: states = [], isLoading: loadingStates } = useGetStatesQuery();
  const { data: districts = [], isLoading: loadingDistricts, refetch: refetchDistricts } = useGetDistrictsQuery(form.state, {
    skip: !form.state, // Avoid fetching districts if state is not selected
  });

  // Trigger district refetch when state changes
  useEffect(() => {
    if (form.state) {
      refetchDistricts();
    }
  }, [form.state, refetchDistricts]);

  // Handle input change for all form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const { confirmPassword, ...resellerData } = form; 
    onAddVendor(resellerData); 
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-center">Create New Reseller</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username input */}
          <input
            name="username"
            type="text"
            placeholder="Username"
            className="input input-bordered w-full"
            value={form.username}
            onChange={handleChange}
            required
          />

          {/* Email input */}
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="input input-bordered w-full"
            value={form.email}
            onChange={handleChange}
            required
          />

          {/* Password input */}
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="input input-bordered w-full"
            value={form.password}
            onChange={handleChange}
            required
          />

          {/* Confirm Password input */}
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            className="input input-bordered w-full"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {/* State dropdown */}
          <select
            name="state"
            className="select select-bordered w-full"
            value={form.state}
            onChange={handleChange}
            required
          >
            <option value="">Select State</option>
            {loadingStates ? (
              <option disabled>Loading states...</option>
            ) : (
              states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))
            )}
          </select>

          {/* District dropdown */}
          <select
            name="district"
            className="select select-bordered w-full"
            value={form.district}
            onChange={handleChange}
            disabled={!form.state}
            required
          >
            <option value="">Select District</option>
            {loadingDistricts ? (
              <option disabled>Loading districts...</option>
            ) : (
              districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))
            )}
          </select>

          {/* Default User checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              name="is_default_user"
              checked={form.is_default_user}
              onChange={handleChange}
            />
            <span className="text-sm text-gray-700">Default User</span>
          </label>

          {/* Display error message if exists */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateResellerModal;
