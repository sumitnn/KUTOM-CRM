import { useState } from "react";

import { toast } from "react-toastify";
import {  useUpdatePasswordMutation } from "../../features/auth/authApi";


const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

  const toggleVisibility = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {

      await updatePassword({
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }).unwrap();

      toast.success("Password updated successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to change password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full p-6 bg-base-100 shadow-xl rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Current Password</span>
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={show.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="input input-bordered w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility("current")}
                className="absolute right-2 top-2/4 -translate-y-2/4 text-sm text-gray-500"
              >
                {show.current ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">New Password</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={show.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="input input-bordered w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility("new")}
                className="absolute right-2 top-2/4 -translate-y-2/4 text-sm text-gray-500"
              >
                {show.new ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Confirm New Password</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={show.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="input input-bordered w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility("confirm")}
                className="absolute right-2 top-2/4 -translate-y-2/4 text-sm text-gray-500"
              >
                {show.confirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button className="btn btn-primary w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
