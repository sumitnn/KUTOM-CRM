import React from 'react';

export default function ViewResellerModal({ user, onClose }) {
  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4 text-center text-primary">Reseller Details</h3>

        <div className="flex flex-col items-center">
          <div className="avatar mb-4">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={user.profile || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
                alt={user.username || user.name}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
            {/* Personal Info */}
            <div className="bg-base-200 p-4 rounded-xl shadow-md">
              <h4 className="text-lg font-semibold text-accent mb-2">Personal Info</h4>
              <p><span className="font-medium">Username:</span> {user.username || 'N/A'}</p>
              <p><span className="font-medium">Full Name:</span> {user.full_name || 'N/A'}</p>
            </div>

            {/* Contact Info */}
            <div className="bg-base-200 p-4 rounded-xl shadow-md">
              <h4 className="text-lg font-semibold text-accent mb-2">Contact Info</h4>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Phone:</span> {user.phone || 'N/A'}</p>
            </div>

            {/* Location Info */}
            <div className="bg-base-200 p-4 rounded-xl shadow-md col-span-1 sm:col-span-2">
              <h4 className="text-lg font-semibold text-accent mb-2">Address Info</h4>
              <p><span className="font-medium">City:</span> {user.city || 'N/A'}</p>
              <p><span className="font-medium">State:</span> {user.state || 'N/A'}</p>
              <p><span className="font-medium">Pincode:</span> {user.pincode || 'N/A'}</p>
              <p><span className="font-medium">Full Address:</span> {user.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </dialog>
  );
}
