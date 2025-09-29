// components/stockist/StockistAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGetNotDefaultStockistQuery, useAssignStockistToResellerMutation } from "../features/stockist/StockistApi";

export default function StockistAssignmentModal({ 
    isOpen, 
    onClose, 
    reseller,
    currentStockist 
}) {
    const [selectedStockist, setSelectedStockist] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { 
        data: stockistsData, 
        isLoading: isLoadingStockists, 
        refetch: refetchStockists 
    } = useGetNotDefaultStockistQuery(undefined, {
        skip: !isOpen
    });
    
    const [assignStockist] = useAssignStockistToResellerMutation();
    
    useEffect(() => {
        if (isOpen) {
            refetchStockists();
            if (currentStockist) {
                setSelectedStockist(currentStockist.id);
            } else {
                setSelectedStockist('');
            }
        }
    }, [isOpen, currentStockist, refetchStockists]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStockist) {
            toast.error('Please select a stockist');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await assignStockist({
                resellerId: reseller.id,
                stockistId: selectedStockist
            }).unwrap();
            
            toast.success('Stockist assigned successfully');
            onClose();
        } catch (error) {
            toast.error(error?.data?.message || 'Failed to assign stockist');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => {
        setSelectedStockist('');
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Assign Stockist to Reseller</h3>
                    <button onClick={handleClose} className="btn btn-sm btn-circle">×</button>
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p><strong>Reseller:</strong> {reseller.username}</p>
                    <p><strong>Email:</strong> {reseller.email}</p>
                    {currentStockist && (<>
                        <p className="text-warning mt-2">
                            <strong>Current Stockist:</strong> {currentStockist.username}
                        </p>
                        <p className="text-warning mt-2">
                            ({currentStockist.email || 'N/A'})
                        </p></>
                    )}
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text font-semibold">Select Stockist</span>
                        </label>
                        <select 
                            className="select select-bordered w-full"
                            value={selectedStockist}
                            onChange={(e) => setSelectedStockist(e.target.value)}
                            disabled={isLoadingStockists}
                            required
                        >
                            <option value="">Choose a stockist</option>
                            {stockistsData?.stockists?.map(stockist => (
                                <option key={stockist.id} value={stockist.id}>
                                    {stockist.username} - {stockist.email} 
                                </option>
                            ))}
                        </select>
                        {isLoadingStockists && (
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                                <span className="loading loading-spinner loading-xs mr-2"></span>
                                Loading stockists...
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-action">
                        <button 
                            type="button" 
                            className="btn btn-ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting || !selectedStockist || isLoadingStockists}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-xs mr-2"></span>
                                    Assigning...
                                </>
                            ) : (
                                currentStockist ? 'Update Assignment' : 'Assign Stockist'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}