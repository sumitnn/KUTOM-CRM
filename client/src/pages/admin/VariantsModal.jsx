// components/modals/VariantsModal.jsx
import React, { useState } from "react";
import { FiX, FiEdit, FiDollarSign, FiPackage, FiTrendingUp, FiPercent } from "react-icons/fi";
import { toast } from "react-toastify";
import ModalPortal from "../../components/ModalPortal";
import VariantCommissionModal from "./VariantCommissionModal";

const VariantsModal = ({ product, isOpen, onClose, onUpdatePrice, onUpdateCommission }) => {
    const [editingPrice, setEditingPrice] = useState(null);
    const [prices, setPrices] = useState({
        actual_price: "", // Admin price
        stockist_actual_price: "", // Stockist base price
        reseller_actual_price: "", // Reseller base price
        stockist_discount: "",
        stockist_gst: "",
        reseller_discount: "",
        reseller_gst: "",
    });
    const [commissionModalOpen, setCommissionModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);

    if (!isOpen || !product) return null;

    // Calculate final prices (stockist_price and reseller_price)
    const calculateFinalPrice = (basePrice, discount, gst) => {
        if (!basePrice || basePrice <= 0) return 0;
        
        const base = parseFloat(basePrice);
        const discountAmount = discount ? base * (parseFloat(discount) / 100) : 0;
        const priceAfterDiscount = base - discountAmount;
        const gstAmount = gst ? priceAfterDiscount * (parseFloat(gst) / 100) : 0;
        
        return (priceAfterDiscount + gstAmount).toFixed(2);
    };

    const finalStockistPrice = calculateFinalPrice(
        prices.stockist_actual_price,
        prices.stockist_discount,
        prices.stockist_gst
    );

    const finalResellerPrice = calculateFinalPrice(
        prices.reseller_actual_price,
        prices.reseller_discount,
        prices.reseller_gst
    );

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
                actual_price: variantPrice?.actual_price || "0.00",
                stockist_price: variantPrice?.stockist_price || "0.00", // Final price
                reseller_price: variantPrice?.reseller_price || "0.00", // Final price
                stockist_discount: variantPrice?.stockist_discount || "0",
                stockist_gst: variantPrice?.stockist_gst || "0",
                reseller_discount: variantPrice?.reseller_discount || "0",
                reseller_gst: variantPrice?.reseller_gst || "0",
                stockist_actual_price: variantPrice?.stockist_actual_price || "0.00", // Base price
                reseller_actual_price: variantPrice?.reseller_actual_price || "0.00", // Base price
                variant_data: variant
            });
        });
        
        return variants;
    };

    const variants = getVariantDetails();

    const handleSavePrice = (variant) => {
        // Validate base prices
        if (!prices.actual_price || prices.actual_price <= 0) {
            toast.error("Please enter a valid admin price");
            return;
        }
        if (!prices.stockist_actual_price || prices.stockist_actual_price <= 0) {
            toast.error("Please enter a valid stockist base price");
            return;
        }
        if (!prices.reseller_actual_price || prices.reseller_actual_price <= 0) {
            toast.error("Please enter a valid reseller base price");
            return;
        }

        // Validate discount and GST percentages
        if (prices.stockist_discount && (prices.stockist_discount < 0 || prices.stockist_discount > 100)) {
            toast.error("Stockist discount must be between 0 and 100%");
            return;
        }
        if (prices.reseller_discount && (prices.reseller_discount < 0 || prices.reseller_discount > 100)) {
            toast.error("Reseller discount must be between 0 and 100%");
            return;
        }
        if (prices.stockist_gst && (prices.stockist_gst < 0 || prices.stockist_gst > 100)) {
            toast.error("Stockist GST must be between 0 and 100%");
            return;
        }
        if (prices.reseller_gst && (prices.reseller_gst < 0 || prices.reseller_gst > 100)) {
            toast.error("Reseller GST must be between 0 and 100%");
            return;
        }

        onUpdatePrice(variant.id, {
            actual_price: parseFloat(prices.actual_price),
            stockist_actual_price: parseFloat(prices.stockist_actual_price),
            reseller_actual_price: parseFloat(prices.reseller_actual_price),
            stockist_discount: prices.stockist_discount ? parseFloat(prices.stockist_discount) : 0,
            stockist_gst: prices.stockist_gst ? parseFloat(prices.stockist_gst) : 0,
            reseller_discount: prices.reseller_discount ? parseFloat(prices.reseller_discount) : 0,
            reseller_gst: prices.reseller_gst ? parseFloat(prices.reseller_gst) : 0,
            stockist_price: parseFloat(finalStockistPrice), // Final calculated price
            reseller_price: parseFloat(finalResellerPrice) // Final calculated price
        });
        setEditingPrice(null);
        setPrices({
            actual_price: "",
            stockist_actual_price: "",
            reseller_actual_price: "",
            stockist_discount: "",
            stockist_gst: "",
            reseller_discount: "",
            reseller_gst: "",
        });
    };

    const openPriceEdit = (variant) => {
        setEditingPrice(variant.id);
        setPrices({
            actual_price: variant.actual_price || "",
            stockist_actual_price: variant.stockist_actual_price || "",
            reseller_actual_price: variant.reseller_actual_price || "",
            stockist_discount: variant.stockist_discount || "",
            stockist_gst: variant.stockist_gst || "",
            reseller_discount: variant.reseller_discount || "",
            reseller_gst: variant.reseller_gst || "",
        });
    };

    const openCommissionModal = (variant) => {
        setSelectedVariant(variant);
        setCommissionModalOpen(true);
    };

    const getVariantPriceDisplay = (variant) => {
        // For display, we show the stored final prices for stockist and reseller
        // and base prices for reference
        return {
            admin: `₹${variant.actual_price || '0'}`,
            stockist_final: `₹${variant.stockist_price || '0'}`, // Final price
            reseller_final: `₹${variant.reseller_price || '0'}`, // Final price
            stockist_base: `₹${variant.stockist_actual_price || '0'}`, // Base price
            reseller_base: `₹${variant.reseller_actual_price || '0'}`, // Base price
            stockist_discount: variant.stockist_discount ? `${variant.stockist_discount}%` : '0%',
            stockist_gst: variant.stockist_gst ? `${variant.stockist_gst}%` : '0%',
            reseller_discount: variant.reseller_discount ? `${variant.reseller_discount}%` : '0%',
            reseller_gst: variant.reseller_gst ? `${variant.reseller_gst}%` : '0%',
        };
    };

    const handlePriceChange = (field, value) => {
        setPrices(prev => ({
            ...prev,
            [field]: value
        }));
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
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                                                Stockist Final Price
                                                            </div>
                                                            <div className="font-bold text-xl text-green-700">
                                                                {pricesDisplay.stockist_final}
                                                            </div>
                                                            <div className="text-xs text-green-500">
                                                                Base: {pricesDisplay.stockist_base}
                                                            </div>
                                                            <div className="text-xs text-green-500">
                                                                Discount: {pricesDisplay.stockist_discount}
                                                            </div>
                                                            <div className="text-xs text-green-500">
                                                                GST: {pricesDisplay.stockist_gst}
                                                            </div>
                                                        </div>
                                                        <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                                                            <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">
                                                                Reseller Final Price
                                                            </div>
                                                            <div className="font-bold text-xl text-purple-700">
                                                                {pricesDisplay.reseller_final}
                                                            </div>
                                                            <div className="text-xs text-purple-500">
                                                                Base: {pricesDisplay.reseller_base}
                                                            </div>
                                                            <div className="text-xs text-purple-500">
                                                                Discount: {pricesDisplay.reseller_discount}
                                                            </div>
                                                            <div className="text-xs text-purple-500">
                                                                GST: {pricesDisplay.reseller_gst}
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
                                                        
                                                        {/* Base Prices */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700">Admin Price (₹)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={prices.actual_price}
                                                                    onChange={(e) => handlePriceChange('actual_price', e.target.value)}
                                                                    className="input input-bordered input-lg bg-white"
                                                                    placeholder="Enter admin price"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700">Stockist Base Price (₹)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={prices.stockist_actual_price}
                                                                    onChange={(e) => handlePriceChange('stockist_actual_price', e.target.value)}
                                                                    className="input input-bordered input-lg bg-white"
                                                                    placeholder="Enter stockist base price"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700">Reseller Base Price (₹)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={prices.reseller_actual_price}
                                                                    onChange={(e) => handlePriceChange('reseller_actual_price', e.target.value)}
                                                                    className="input input-bordered input-lg bg-white"
                                                                    placeholder="Enter reseller base price"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Stockist Discount & GST */}
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700 flex items-center gap-1">
                                                                        <FiPercent className="text-sm" />
                                                                        Stockist Discount (%)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="1"
                                                                    min="0"
                                                                    max="100"
                                                                    value={prices.stockist_discount}
                                                                    onChange={(e) => handlePriceChange('stockist_discount', e.target.value)}
                                                                    className="input input-bordered bg-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700 flex items-center gap-1">
                                                                        <FiPercent className="text-sm" />
                                                                        Stockist GST (%)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="1"
                                                                    min="0"
                                                                    max="100"
                                                                    value={prices.stockist_gst}
                                                                    onChange={(e) => handlePriceChange('stockist_gst', e.target.value)}
                                                                    className="input input-bordered bg-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-green-700">
                                                                        Final Stockist Price (₹)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="input input-bordered bg-gray-100 text-green-700 font-bold"
                                                                    value={finalStockistPrice}
                                                                    readOnly
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Reseller Discount & GST */}
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700 flex items-center gap-1">
                                                                        <FiPercent className="text-sm" />
                                                                        Reseller Discount (%)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="1"
                                                                    min="0"
                                                                    max="100"
                                                                    value={prices.reseller_discount}
                                                                    onChange={(e) => handlePriceChange('reseller_discount', e.target.value)}
                                                                    className="input input-bordered bg-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-gray-700 flex items-center gap-1">
                                                                        <FiPercent className="text-sm" />
                                                                        Reseller GST (%)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="1"
                                                                    min="0"
                                                                    max="100"
                                                                    value={prices.reseller_gst}
                                                                    onChange={(e) => handlePriceChange('reseller_gst', e.target.value)}
                                                                    className="input input-bordered bg-white"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label">
                                                                    <span className="label-text font-semibold text-purple-700">
                                                                        Final Reseller Price (₹)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="input input-bordered bg-gray-100 text-purple-700 font-bold"
                                                                    value={finalResellerPrice}
                                                                    readOnly
                                                                    disabled
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