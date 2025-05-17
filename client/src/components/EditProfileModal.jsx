import React, { useState } from 'react';

export  const EditProfileModal = ({ admin, onClose, onSave }) => {
  const [formData, setFormData] = useState(admin);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70  z-50">
      <div className="modal-box w-full max-w-2xl">
        <h3 className="font-bold text-lg">Edit Profile</h3>
        <div className="py-4 space-y-3">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="input input-bordered w-full" />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input input-bordered w-full" />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="input input-bordered w-full" />
          <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="textarea textarea-bordered w-full" />
        </div>
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};
