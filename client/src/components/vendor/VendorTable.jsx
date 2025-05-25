import React, { useEffect, useState } from 'react';
import VendorTableRow from './VendorTableRow';
import EditVendorModal from './EditVendorModal';
import ViewVendorModal from './ViewVendorModal';

export default function VendorTable({ vendors, onEdit, onDelete }) {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [viewVendor, setViewVendor] = useState(null);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  const filtered = vendors
    .filter((v) => v.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const nameA = a.username?.toLowerCase() || '';
      const nameB = b.username?.toLowerCase() || '';
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  const visibleVendors = filtered.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && visibleCount < filtered.length) loadMore();
  };

  return (
    <>
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <input
          type="text"
          className="input input-bordered w-full md:w-64"
          placeholder="Search by email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setSortAsc(!sortAsc)}
        >
          Sort by Username ({sortAsc ? 'A-Z' : 'Z-A'})
        </button>
      </div>

      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-xl shadow" onScroll={handleScroll}>
        <table className="table table-zebra">
          <thead>
            <tr className='font-bold text-[#1F7A8C] text-md'>
              <th>Vendor Id</th>
              <th>Profile</th>
              <th>Username</th>
              <th>Email</th>
              <th>City</th>
              <th>State</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleVendors.map((user) => (
              <VendorTableRow
                key={user.id}
                user={user}
                onEdit={() => setSelectedVendor(user)}
                onDelete={onDelete}
                onView={() => setViewVendor(user)}
              />
            ))}
          </tbody>
        </table>

        {visibleCount < filtered.length && (
          <div className="text-center mt-4">
            <button className="btn btn-outline" onClick={loadMore}>
              View More
            </button>
          </div>
        )}
      </div>

      {selectedVendor && (
        <EditVendorModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onSave={(data) => {
            onEdit(data.id, data);
            setSelectedVendor(null);
          }}
        />
      )}

      {viewVendor && (
        <ViewVendorModal user={viewVendor} onClose={() => setViewVendor(null)} />
      )}
    </>
  );
}
