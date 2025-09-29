import React from 'react';

export default function KycConfirmationModal({ 
  onConfirm, 
  onCancel, 
  isLoading 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-extrabold mb-4">Confirm KYC Completion</h3>
        <p className="mb-6 font-bold text-gray-500">Are you sure you want to mark this  KYC as completed?</p>
        <div className="flex justify-end gap-3">
          <button 
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}