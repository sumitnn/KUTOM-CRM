import React from 'react';

export default function ViewVendorModal({ user, onClose }) {
  if (!user) return null; // Add this check to handle undefined user

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4 text-center text-primary">Vendor Details</h3>

        <div className="flex flex-col items-center">
          <div className="avatar mb-4">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={user.profile?.profile_picture || "https://img.daisyui.com/images/profile/demo/5@94.webp"}
                alt={user.username || 'Vendor'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
            <div className="bg-base-200 p-4 rounded-xl shadow-md">
              <h4 className="text-lg font-semibold text-accent mb-2">Personal Info</h4>
              <p><span className="font-medium">Username:</span> {user.username || 'N/A'}</p>
              <p><span className="font-medium">Full Name:</span> {user.profile?.full_name || 'N/A'}</p>
              <p><span className="font-medium">Date of Birth:</span> {user.profile?.date_of_birth || 'N/A'}</p>
              <p><span className="font-medium">Gender:</span> {user.profile?.gender || 'N/A'}</p>
            </div>

            <div className="bg-base-200 p-4 rounded-xl shadow-md">
              <h4 className="text-lg font-semibold text-accent mb-2">Contact Info</h4>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Phone:</span> {user.profile?.phone || 'N/A'}</p>
              <p><span className="font-medium">WhatsApp:</span> {user.profile?.whatsapp_number || 'N/A'}</p>
            </div>

            <div className="bg-base-200 p-4 rounded-xl shadow-md col-span-1 sm:col-span-2">
              <h4 className="text-lg font-semibold text-accent mb-2">Address Info</h4>
              <p><span className="font-medium">Street:</span> {user.address?.street_address || 'N/A'}</p>
              <p><span className="font-medium">City:</span> {user.address?.city || 'N/A'}</p>
              <p><span className="font-medium">State:</span> {user.address?.state_name || 'N/A'}</p>
              <p><span className="font-medium">District:</span> {user.address?.district_name || 'N/A'}</p>
              <p><span className="font-medium">Postal Code:</span> {user.address?.postal_code || 'N/A'}</p>
              <p><span className="font-medium">Country:</span> {user.address?.country || 'N/A'}</p>
            </div>

            <div className="bg-base-200 p-4 rounded-xl shadow-md col-span-1 sm:col-span-2">
              <h4 className="text-lg font-semibold text-accent mb-2">Bank Details</h4>
              <p><span className="font-medium">Bank UPI:</span> {user.profile?.bank_upi || 'N/A'}</p>
              <p><span className="font-medium">Account Holder:</span> {user.profile?.account_holder_name || 'N/A'}</p>
              <p><span className="font-medium">Bank Name:</span> {user.profile?.bank_name || 'N/A'}</p>
              <p><span className="font-medium">Account Number:</span> {user.profile?.account_number || 'N/A'}</p>
              <p><span className="font-medium">IFSC Code:</span> {user.profile?.ifsc_code || 'N/A'}</p>
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