// ProfileReviewModal.jsx
import React from 'react';

export default function ProfileReviewModal({ vendor, onClose, onApprove, onReject }) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h3 className="font-bold text-lg">Review Vendor Profile</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Personal Information</h4>
            <p><strong>Name:</strong> {vendor.full_name}</p>
            <p><strong>Email:</strong> {vendor.email}</p>
            <p><strong>Phone:</strong> {vendor.phone}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Business Information</h4>
            <p><strong>Business Name:</strong> {vendor.business_name}</p>
            <p><strong>Business Type:</strong> {vendor.business_type}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Address</h4>
            <p>{vendor.address}</p>
            <p>{vendor.city}, {vendor.state} {vendor.pincode}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Documents</h4>
            {vendor.documents?.length > 0 ? (
              vendor.documents.map(doc => (
                <a 
                  key={doc.id} 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="link link-primary block"
                >
                  {doc.type}
                </a>
              ))
            ) : (
              <p>No documents uploaded</p>
            )}
          </div>
        </div>
        
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-error" onClick={onReject}>
            Reject
          </button>
          <button className="btn btn-success" onClick={onApprove}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}