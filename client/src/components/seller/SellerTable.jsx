import React,{useState} from 'react';

import SellerTableRow from './SellerTableRow';

import EditSellerModal from './EditSellerModal';
const users = [
    {
      name: 'Hart Hagerty',
      country: 'United States',
      company: 'Zemlak, Daniel and Leannon',
      role: 'Desktop Support Technician',
      color: 'Purple',
      avatar: 'https://img.daisyui.com/images/profile/demo/2@94.webp',
    },
    {
      name: 'Brice Swyre',
      country: 'China',
      company: 'Carroll Group',
      role: 'Tax Accountant',
      color: 'Red',
      avatar: 'https://img.daisyui.com/images/profile/demo/3@94.webp',
    },
    {
      name: 'Marjy Ferencz',
      country: 'Russia',
      company: 'Rowe-Schoen',
      role: 'Office Assistant I',
      color: 'Crimson',
      avatar: 'https://img.daisyui.com/images/profile/demo/4@94.webp',
    },
    {
      name: 'Yancy Tear',
      country: 'Brazil',
      company: 'Wyman-Ledner',
      role: 'Community Outreach Specialist',
      color: 'Indigo',
      avatar: 'https://img.daisyui.com/images/profile/demo/5@94.webp',
    },
  ];
export default function SellerTable() {
    const [selectedVendor, setSelectedVendor] = useState(null);

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
            <th><input type="checkbox" className="checkbox" /></th>
            <th>Name</th>
            <th>Job</th>
            <th>Favorite Color</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <SellerTableRow key={index} user={user} onEdit={handleEditClick} />
          ))}
        </tbody>
      
          </table>
        
      </div>
        {selectedVendor && (
            <EditSellerModal
              vendor={selectedVendor}
              onClose={() => setSelectedVendor(null)}
              onSave={handleUpdateVendor}
            />
          )}</>
  );
}
