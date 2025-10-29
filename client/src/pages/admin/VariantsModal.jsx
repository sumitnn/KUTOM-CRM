// components/modals/VariantsModal.jsx
import React, { useState } from "react";
import { FiX, FiEdit, FiDollarSign, FiPackage, FiTrendingUp } from "react-icons/fi";
import { toast } from "react-toastify";
import ModalPortal from "../../components/ModalPortal";
import VariantCommissionModal from "./VariantCommissionModal";

const VariantsModal = ({ product, isOpen, onClose, onUpdatePrice, onUpdateCommission }) => {
    const [editingPrice, setEditingPrice] = useState(null);
    const [prices, setPrices] = useState({
        admin_price: "",
        stockist_price: "",
        reseller_price: ""
    });
    const [commissionModalOpen, setCommissionModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);

    if (!isOpen || !product) return null;

    // Get variant details with proper pricing data
    const getVariantDetails = () => {
        const variants = [];
        
        product.variants_detail?.forEach(variant => {
            const inventory = product.inventories?.find(inv => inv.variant === variant.id);
            const commission = product.commission?.find(comm => comm.variant === variant.id);
            const variantPrice = variant.product_variant_prices?.[0];
            
            variants.push({
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                is_active: variant.is_active,
                inventory: inventory,
                commission: commission,
                // Use variant-specific prices from product_variant_prices
                price: variantPrice?.actual_price || "0.00",
                stockist_price: variantPrice?.stockist_price || "0.00",
                reseller_price: variantPrice?.reseller_price || "0.00",
                variant_data: variant
            });
        });
        
        return variants;
    };

    const variants = getVariantDetails();

    const handleSavePrice = (variant) => {
        // Validate prices
        if (!prices.admin_price || prices.admin_price <= 0) {
            toast.error("Please enter a valid admin price");
            return;
        }
        if (!prices.stockist_price || prices.stockist_price <= 0) {
            toast.error("Please enter a valid stockist price");
            return;
        }
        if (!prices.reseller_price || prices.reseller_price <= 0) {
            toast.error("Please enter a valid reseller price");
            return;
        }

        

        onUpdatePrice(variant.id, {
            admin_price: parseFloat(prices.admin_price),
            stockist_price: parseFloat(prices.stockist_price),
            reseller_price: parseFloat(prices.reseller_price)
        });
        setEditingPrice(null);
        setPrices({
            admin_price: "",
            stockist_price: "",
            reseller_price: ""
        });
    };

    const openPriceEdit = (variant) => {
        setEditingPrice(variant.id);
        setPrices({
            admin_price: variant.price || "",
            stockist_price: variant.stockist_price || "",
            reseller_price: variant.reseller_price || ""
        });
    };

    const openCommissionModal = (variant) => {
        setSelectedVariant(variant);
        setCommissionModalOpen(true);
    };

    const getVariantPriceDisplay = (variant) => {
        return {
            admin: `₹${variant.price || '0'}`,
            stockist: `₹${variant.stockist_price || '0'}`,
            reseller: `₹${variant.reseller_price || '0'}`
        };
    };

    return (
        <ModalPortal>
            <div className="modal modal-open">
                <div className="modal-box max-w-6xl max-h-[95vh] overflow-y-auto p-0">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Product Variants</h3>
                                <p className="text-gray-600 mt-1">{product.product_detail?.name}</p>
                                <p className="text-sm text-gray-500">SKU: {product.product_detail?.sku}</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="btn btn-ghost btn-circle hover:bg-gray-100 transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {variants.length === 0 ? (
                            <div className="text-center py-12">
                                <FiPackage className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Variants Found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    This product doesn't have any variants configured. Variants will appear here once they are added to the product.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {variants.map((variant) => {
                                    const pricesDisplay = getVariantPriceDisplay(variant);
                                    const isLowStock = variant.inventory?.total_quantity < 10;
                                    const isOutOfStock = variant.inventory?.total_quantity === 0;
                                    
                                    return (
                                        <div key={variant.id} className="card bg-base-100 shadow-lg border border-gray-200">
                                            <div className="card-body p-6">
                                                {/* Variant Header */}
                                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="font-bold text-xl text-gray-900">{variant.name}</h4>
                                                            <div className="flex gap-2">
                                                                <span className={`badge badge-lg ${
                                                                    variant.is_active ? 'badge-success' : 'badge-error'
                                                                }`}>
                                                                    {variant.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                                <span className="badge badge-lg badge-outline">
                                                                    ID: {variant.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Variant Details */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-gray-600">SKU:</span>
                                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                                    {variant.sku}
                                                                </code>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-gray-600">Stock:</span>
                                                                <span className={`badge badge-lg ${
                                                                    isOutOfStock ? 'badge-error' : 
                                                                    isLowStock ? 'badge-warning' : 'badge-success'
                                                                }`}>
                                                                    {variant.inventory?.total_quantity || 0} units
                                                                </span>
                                                            </div>
                                                            {variant.inventory?.batch_number && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-600">Batch:</span>
                                                                    <span>{variant.inventory.batch_number}</span>
                                                                </div>
                                                            )}
                                                            {variant.inventory?.expiry_date && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-600">Expiry:</span>
                                                                    <span>{variant.inventory.expiry_date}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 flex-wrap justify-end">
                                                        <button
                                                            onClick={() => openPriceEdit(variant)}
                                                            className="btn btn-outline btn-primary btn-sm lg:btn-md"
                                                        >
                                                            <FiEdit className="mr-2" />
                                                            Edit Prices
                                                        </button>
                                                        <button
                                                            onClick={() => openCommissionModal(variant)}
                                                            className={`btn btn-sm lg:btn-md ${
                                                                variant.commission ? 'btn-success' : 'btn-primary'
                                                            }`}
                                                        >
                                                            <FiTrendingUp className="mr-2" />
                                                            {variant.commission ? 'Edit Commission' : 'Set Commission'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Price Display */}
                                                <div className="mb-4">
                                                    <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <FiDollarSign className="text-green-500" />
                                                        Current Pricing
                                                    </h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                                            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                                                                Admin Price
                                                            </div>
                                                            <div className="font-bold text-xl text-blue-700">
                                                                {pricesDisplay.admin}
                                                            </div>
                                                            <div className="text-xs text-blue-500 mt-1">
                                                                Actual Price
                                                            </div>
                                                        </div>
                                                        <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                                                            <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
                                                                Stockist Price
                                                            </div>
                                                            <div className="font-bold text-xl text-green-700">
                                                                {pricesDisplay.stockist}
                                                            </div>
                                                            <div className="text-xs text-green-500 mt-1">
                                                                Distributor Price
                                                            </div>
                                                        </div>
                                                        <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                                                            <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">
                                                                Reseller Price
                                                            </div>
                                                            <div className="font-bold text-xl text-purple-700">
                                                                {pricesDisplay.reseller}
                                                            </div>
                                                            <div className="text-xs text-purple-500 mt-1">
                                                                Retailer Price
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Price Edit Form */}
                                                {editingPrice === variant.id && (
                                                    <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                                        <h5 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                                                            <FiEdit className="text-blue-500" />
                                                            Edit Prices for {variant.name}
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700">Admin Price (₹)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={prices.admin_price}
                                                                    onChange={(e) => setPrices(prev => ({...prev, admin_price: e.target.value}))}
                                                                    className="input input-bordered input-lg bg-white"
                                                                    placeholder="Enter admin price"
                                                                    disabled={true}
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700">Stockist Price (₹)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={prices.stockist_price}
                                                                    onChange={(e) => setPrices(prev => ({...prev, stockist_price: e.target.value}))}
                                                                    className="input input-bordered input-lg bg-white"
                                                                    placeholder="Enter stockist price"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700">Reseller Price (₹)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={prices.reseller_price}
                                                                    onChange={(e) => setPrices(prev => ({...prev, reseller_price: e.target.value}))}
                                                                    className="input input-bordered input-lg bg-white"
                                                                    placeholder="Enter reseller price"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 flex-wrap">
                                                            <button
                                                                onClick={() => handleSavePrice(variant)}
                                                                className="btn btn-primary btn-lg"
                                                            >
                                                                Save Prices
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingPrice(null)}
                                                                className="btn btn-ghost btn-lg"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Commission Info */}
                                                {variant.commission && (
                                                    <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                                                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <FiTrendingUp className="text-orange-500" />
                                                            Commission Details
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                                            <div className="bg-white p-3 rounded-lg border">
                                                                <div className="text-xs text-orange-600 font-semibold uppercase mb-1">
                                                                    Type
                                                                </div>
                                                                <div className="font-medium text-gray-900">
                                                                    {variant.commission.commission_type_display}
                                                                </div>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border">
                                                                <div className="text-xs text-orange-600 font-semibold uppercase mb-1">
                                                                    Reseller
                                                                </div>
                                                                <div className="font-medium text-gray-900">
                                                                    {variant.commission.reseller_commission_value}
                                                                    {variant.commission.commission_type === 'percentage' ? '%' : '₹'}
                                                                </div>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border">
                                                                <div className="text-xs text-orange-600 font-semibold uppercase mb-1">
                                                                    Stockist
                                                                </div>
                                                                <div className="font-medium text-gray-900">
                                                                    {variant.commission.stockist_commission_value}
                                                                    {variant.commission.commission_type === 'percentage' ? '%' : '₹'}
                                                                </div>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-lg border">
                                                                <div className="text-xs text-orange-600 font-semibold uppercase mb-1">
                                                                    Admin
                                                                </div>
                                                                <div className="font-medium text-gray-900">
                                                                    {variant.commission.admin_commission_value}
                                                                    {variant.commission.commission_type === 'percentage' ? '%' : '₹'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Variant Commission Modal */}
                    <VariantCommissionModal
                        variant={selectedVariant}
                        product={product}
                        isOpen={commissionModalOpen}
                        onClose={() => setCommissionModalOpen(false)}
                        onSave={onUpdateCommission}
                    />
                </div>
            </div>
        </ModalPortal>
    );
};

export default VariantsModal;