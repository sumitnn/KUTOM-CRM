// RejectReasonModal.jsx
import React, { useState } from 'react';

export default function RejectReasonModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Provide Rejection Reason</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Enter reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-error">
              Submit Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}