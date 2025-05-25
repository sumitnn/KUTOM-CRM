import React, { useState, useEffect } from 'react';
import StockistCard from './StockistCard';
import EditStockistModal from './EditStockistModal';
import ViewStockistModal from './ViewStockistModal';

export default function StockistCardList({ stockist, onEdit, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  const handleUpdate = (updatedUser) => {
    onEdit(updatedUser.id, updatedUser);
    setEditing(null);
  };

  // Scroll pagination
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.scrollHeight
      ) {
        setVisibleCount((prev) => prev + 3);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter & sort
  const filtered = stockist
    .filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) =>
      sortAsc
        ? (a.username || '').localeCompare(b.username || '')
        : (b.username || '').localeCompare(a.username || '')
    )
    .slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by email"
          className="input input-bordered w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-sm" onClick={() => setSortAsc(!sortAsc)}>
          Sort by Username {sortAsc ? '↑' : '↓'}
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(user => (
          <StockistCard
            key={user.id}
            user={user}
            onEdit={setEditing}
            onDelete={onDelete}
            onView={setViewing}
          />
        ))}
      </div>

      {/* Modals */}
      {editing && (
        <EditStockistModal
          stockist={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
        />
      )}
      {viewing && (
        <ViewStockistModal
          user={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
