// RejectReasonModal.jsx
import React, { useState } from 'react';
import ModalPortal from './ModalPortal';

export default function RejectReasonModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(reason);
      onClose();
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
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
            disabled={isSubmitting}
          />
          <div className="modal-action">
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-error"
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Submitting...
                </>
              ) : (
                'Submit Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div></ModalPortal>
  );
}