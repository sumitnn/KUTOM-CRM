import React, { useState } from 'react';
import VendorTableRow from './VendorTableRow';
import EditVendorModal from './EditVendorModal';

export default function VendorTable({ vendors, onEdit, onDelete }) {
  const [selectedVendor, setSelectedVendor] = useState(null);

  const handleEditClick = (vendor) => {
    setSelectedVendor(vendor);
  };

  const handleUpdateVendor = (updatedVendor) => {
    onEdit(updatedVendor.id, updatedVendor);
    setSelectedVendor(null);
  };

  return (
    <>
      <div className="overflow-x-auto my-6">
        <table className="table">
          <thead>
            <tr className='font-extrabold text-[#1F7A8C] text-md'>
              <th>Vendor Id</th>
              <th>Profile</th>
              <th>UserName</th>
              <th>Email</th>
              <th>City</th>
              <th>State</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((user) => (
              <VendorTableRow
                key={user.id}
                user={user}
                onEdit={handleEditClick}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selectedVendor && (
        <EditVendorModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onSave={handleUpdateVendor}
        />
      )}
    </>
  );
}
