// components/modals/VariantCommissionModal.jsx
import React, { useState, useEffect } from "react";
import { FiX, FiDollarSign, FiPercent, FiTrendingUp } from "react-icons/fi";
import { toast } from "react-toastify";
import ModalPortal from "../../components/ModalPortal";

const VariantCommissionModal = ({ variant, product, isOpen, onClose, onSave }) => {
    const [commissionData, setCommissionData] = useState({
        commission_type: "flat",
        reseller_commission_value: "0",
        stockist_commission_value: "0",
        admin_commission_value: "0"
    });

    useEffect(() => {
        if (variant && product) {
            // Find commission for this variant
            const variantCommission = product?.commission?.find(comm => comm.variant === variant.id);
            if (variantCommission) {
                setCommissionData({
                    commission_type: variantCommission.commission_type || "flat",
                    reseller_commission_value: variantCommission.reseller_commission_value || "0",
                    stockist_commission_value: variantCommission.stockist_commission_value || "0",
                    admin_commission_value: variantCommission.admin_commission_value || "0"
                });
            } else {
                // Reset to defaults if no commission found
                setCommissionData({
                    commission_type: "flat",
                    reseller_commission_value: "0",
                    stockist_commission_value: "0",
                    admin_commission_value: "0"
                });
            }
        }
    }, [variant, product, isOpen]);

    if (!isOpen || !variant) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert to numbers for validation
        const resellerComm = parseFloat(commissionData.reseller_commission_value);
        const stockistComm = parseFloat(commissionData.stockist_commission_value);
        const adminComm = parseFloat(commissionData.admin_commission_value);
        
        // Validate commission values
        if ([resellerComm, stockistComm, adminComm].some(commission => commission < 0)) {
            toast.error("Commission values cannot be negative");
            return;
        }
        
        
        onSave(variant.id, commissionData);
        onClose();
    };

    const handleCommissionChange = (field, value) => {
        setCommissionData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getVariantPrices = () => {
        // Get prices from variant_data which contains product_variant_prices
        const variantPrice = variant.variant_data?.product_variant_prices?.[0];
        return {
            admin: variantPrice?.actual_price || variant.price || "0.00",
            stockist: variantPrice?.stockist_price || variant.stockist_price || "0.00",
            reseller: variantPrice?.reseller_price || variant.reseller_price || "0.00"
        };
    };

    const prices = getVariantPrices();
    const hasExistingCommission = product?.commission?.find(comm => comm.variant === variant.id);

    return (
        <ModalPortal>
            <div className="modal modal-open">
                <div className="modal-box max-w-lg p-0">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {hasExistingCommission ? "Edit Commission" : "Set Commission"}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    {variant.name} • SKU: {variant.sku}
                                </p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="btn btn-ghost btn-circle hover:bg-gray-100 transition-colors"
                            >
                                <FiX className="text-lg" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Current Pricing Overview */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FiDollarSign className="text-blue-500" />
                                    Current Pricing
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <div className="text-xs text-blue-600 font-semibold uppercase">Admin</div>
                                        <div className="font-bold text-lg text-blue-700">₹{prices.admin}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-green-600 font-semibold uppercase">Stockist</div>
                                        <div className="font-bold text-lg text-green-700">₹{prices.stockist}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-purple-600 font-semibold uppercase">Reseller</div>
                                        <div className="font-bold text-lg text-purple-700">₹{prices.reseller}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Commission Type */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-gray-700">Commission Type</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                            type="radio"
                                            name="commission_type"
                                            value="flat"
                                            checked={commissionData.commission_type === 'flat'}
                                            onChange={(e) => handleCommissionChange('commission_type', e.target.value)}
                                            className="radio radio-primary"
                                            disabled={true}
                                        />
                                        <div className="flex items-center gap-2">
                                            
                                            <span className="font-medium">Flat Amount</span>
                                        </div>
                                    </label>
                                    
                                </div>
                            </div>

                            {/* Commission Inputs */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FiTrendingUp className="text-orange-500" />
                                    Commission Values
                                </h4>
                                
                                {/* Admin Commission */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Admin Commission
                                        <span className="text-xs font-normal text-gray-500 ml-2">
                                            ({commissionData.commission_type === 'percentage' ? '% of sale price' : 'flat amount'})
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                step={commissionData.commission_type === 'percentage' ? "0.01" : "1"}
                                                min="0"
                                                max={commissionData.commission_type === 'percentage' ? "100" : ""}
                                                className="input input-bordered w-full bg-white"
                                                value={commissionData.admin_commission_value}
                                                onChange={(e) => handleCommissionChange('admin_commission_value', e.target.value)}
                                                placeholder={commissionData.commission_type === 'percentage' ? "0.00" : "0"}
                                            />
                                        </div>
                                        <div className="text-sm text-gray-500 font-medium min-w-[60px]">
                                            {commissionData.commission_type === 'percentage' ? '%' : '₹'}
                                        </div>
                                    </div>
                                </div>

                                {/* Stockist Commission */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Stockist Commission
                                        <span className="text-xs font-normal text-gray-500 ml-2">
                                            ({commissionData.commission_type === 'percentage' ? '% of sale price' : 'flat amount'})
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                step={commissionData.commission_type === 'percentage' ? "0.01" : "1"}
                                                min="0"
                                                max={commissionData.commission_type === 'percentage' ? "100" : ""}
                                                className="input input-bordered w-full bg-white"
                                                value={commissionData.stockist_commission_value}
                                                onChange={(e) => handleCommissionChange('stockist_commission_value', e.target.value)}
                                                placeholder={commissionData.commission_type === 'percentage' ? "0.00" : "0"}
                                            />
                                        </div>
                                        <div className="text-sm text-gray-500 font-medium min-w-[60px]">
                                            {commissionData.commission_type === 'percentage' ? '%' : '₹'}
                                        </div>
                                    </div>
                                </div>

                                {/* Reseller Commission */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Reseller Commission
                                        <span className="text-xs font-normal text-gray-500 ml-2">
                                            ({commissionData.commission_type === 'percentage' ? '% of sale price' : 'flat amount'})
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                step={commissionData.commission_type === 'percentage' ? "0.01" : "1"}
                                                min="0"
                                                max={commissionData.commission_type === 'percentage' ? "100" : ""}
                                                className="input input-bordered w-full bg-white"
                                                value={commissionData.reseller_commission_value}
                                                onChange={(e) => handleCommissionChange('reseller_commission_value', e.target.value)}
                                                placeholder={commissionData.commission_type === 'percentage' ? "0.00" : "0"}
                                            />
                                        </div>
                                        <div className="text-sm text-gray-500 font-medium min-w-[60px]">
                                            {commissionData.commission_type === 'percentage' ? '%' : '₹'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Commission Hierarchy Info */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-yellow-600 mt-0.5">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-yellow-700">
                                        <p className="font-semibold">Commission Hierarchy</p>
                                        <p className="mt-1">
                                            Recommended: Admin ≥ Stockist ≥ Reseller commission for proper profit distribution.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-ghost flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                >
                                    {hasExistingCommission ? 'Update Commission' : 'Save Commission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default VariantCommissionModal;