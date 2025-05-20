import React,{useState} from 'react';
import VendorTableRow from './VendorTableRow';
import EditVendorModal from './EditVendorModal';

export default function VendorTable({vendors,onEdit,onDelete}) {
  const [selectedVendor, setSelectedVendor] = useState(null);
  console.log(vendors);

  const handleEditClick = (vendor) => {
    setSelectedVendor(vendor);
    };
    const handleUpdateVendor = (updatedVendor) => {
        const updatedList = users.map((v) =>
          v.email === updatedVendor.email ? updatedVendor : v
        );
        setVendors(updatedList);
        setSelectedVendor(null);
      };
    return (
      <>
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
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
          {vendors.map((user, index) => (
            <VendorTableRow key={index} user={user} onEdit={handleEditClick} />
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
          )}</>
  );
}
