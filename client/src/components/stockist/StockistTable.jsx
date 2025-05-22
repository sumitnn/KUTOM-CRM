import { useState } from 'react';
import StockistTableRow from './StockistTableRow';
import EditStockistModal from './EditStockistModal';

export default function StockistTable({ stockist, onEdit, onDelete }) {
  const [selectedStockist, setSelectedStockist] = useState(null);

  const handleEditClick = (stockist) => {
    setSelectedStockist(stockist);
  };

  const handleUpdateStockist = (updatedStockist) => {
    onEdit(updatedStockist.id, updatedStockist);
    setSelectedStockist(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Stockist Id</th>
              <th>Profile</th>
              <th>UserName</th>
              <th>Email</th>
              <th>City</th>
              <th>State</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stockist.map((user) => (
              <StockistTableRow
                key={user.id}
                user={user}
                onEdit={handleEditClick}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selectedStockist && (
        <EditStockistModal
          stockist={selectedStockist}
          onClose={() => setSelectedStockist(null)}
          onSave={handleUpdateStockist}
        />
      )}
    </>
  );
}
