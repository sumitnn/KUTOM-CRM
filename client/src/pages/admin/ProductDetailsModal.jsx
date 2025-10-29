// components/modals/ProductDetailsModal.jsx
import React from "react";
import { FiX, FiPackage, FiDollarSign, FiTrendingUp, FiInfo } from "react-icons/fi";
import ModalPortal from "../../components/ModalPortal";

const ProductDetailsModal = ({ product, isOpen, onClose }) => {
    if (!isOpen || !product) return null;

    // Get first image
    const getFirstImage = () => {
        const images = product.product_detail?.images || [];
        if (images.length > 0) {
            const defaultImg = images.find(img => img.is_default);
            const featuredImg = images.find(img => img.is_featured);
            return defaultImg?.image || featuredImg?.image || images[0].image;
        }
        return "/placeholder.png";
    };

    // Get total available stock
    const getTotalStock = () => {
        return product.inventories?.reduce((total, inventory) => 
            total + (inventory.total_quantity || 0), 0) || 0;
    };

    const totalStock = getTotalStock();
    const isLowStock = totalStock < 10;

    // Get variant prices
    const getVariantPrices = (variantId) => {
        const variant = product.variants_detail?.find(v => v.id === variantId);
        if (variant?.product_variant_prices?.length > 0) {
            const priceData = variant.product_variant_prices[0]; // Latest price
            return {
                admin: `₹${priceData.actual_price || '0'}`,
                stockist: `₹${priceData.stockist_price || '0'}`,
                reseller: `₹${priceData.reseller_price || '0'}`
            };
        }
        return {
            admin: "₹0",
            stockist: "₹0",
            reseller: "₹0"
        };
    };

    // Get variant commission
    const getVariantCommission = (variantId) => {
        return product.commission?.find(comm => comm.variant === variantId);
    };

    return (
        <ModalPortal>
            <div className="modal modal-open">
                <div className="modal-box max-w-7xl max-h-[95vh] overflow-y-auto p-0">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    SKU: {product.product_detail?.sku}
                                </p>
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
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Left Column - Images & Basic Info */}
                            <div className="space-y-6">
                                {/* Product Images */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                                        <img
                                            src={getFirstImage()}
                                            alt={product.product_detail?.name}
                                            className="w-full h-80 object-contain"
                                        />
                                    </div>
                                    {product.product_detail?.images && product.product_detail.images.length > 1 && (
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {product.product_detail.images.map((img, index) => (
                                                <img
                                                    key={img.id}
                                                    src={img.image}
                                                    alt={`${product.product_detail.name} ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Basic Information */}
                                <div className="card bg-base-100 shadow-sm border">
                                    <div className="card-body p-6">
                                        <h4 className="card-title text-lg flex items-center gap-2 mb-4">
                                            <FiInfo className="text-blue-500" />
                                            Basic Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="font-semibold text-gray-600">Brand</label>
                                                    <p className="mt-1">{product.product_detail?.brand_name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-600">Category</label>
                                                    <p className="mt-1">{product.product_detail?.category_name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-600">Subcategory</label>
                                                    <p className="mt-1">{product.product_detail?.subcategory_name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-600">Product Type</label>
                                                    <p className="mt-1">{product.product_detail?.product_type_display || "N/A"}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="font-semibold text-gray-600">Status</label>
                                                    <div className="mt-1">
                                                        <span className={`badge badge-lg ${
                                                            product.product_detail?.status === 'published' 
                                                                ? 'badge-success' 
                                                                : 'badge-warning'
                                                        }`}>
                                                            {product.product_detail?.status_display}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-600">Weight</label>
                                                    <p className="mt-1">
                                                        {product.product_detail?.weight} {product.product_detail?.weight_unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-600">Dimensions</label>
                                                    <p className="mt-1">{product.product_detail?.dimensions || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <label className="font-semibold text-gray-600">Total Variants</label>
                                                    <p className="mt-1">{product.product_detail?.variants?.length || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Variants, Pricing & Inventory */}
                            <div className="space-y-6">
                                {/* Product Title */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {product.product_detail?.name}
                                    </h2>
                                    <p className="text-gray-600 line-clamp-2">
                                        {product.product_detail?.short_description}
                                    </p>
                                </div>

                                {/* Stock Overview */}
                                <div className={`card border-l-4 ${
                                    isLowStock ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'
                                }`}>
                                    <div className="card-body p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FiPackage className={`text-xl ${
                                                    isLowStock ? 'text-red-600' : 'text-green-600'
                                                }`} />
                                                <div>
                                                    <h5 className="font-semibold">Stock Status</h5>
                                                    <p className="text-sm text-gray-600">
                                                        Total available quantity across all variants
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`badge badge-lg ${
                                                isLowStock ? 'badge-error' : 'badge-success'
                                            }`}>
                                                {isLowStock ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700">Total Units:</span>
                                                <span className={`text-lg font-bold ${
                                                    isLowStock ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                    {totalStock} units
                                                </span>
                                            </div>
                                            {isLowStock && (
                                                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                                    <p className="text-red-700 text-sm flex items-center gap-2">
                                                        <span>⚠️</span>
                                                        Stock is running low. Consider restocking.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Variants with Pricing & Commission */}
                                {product.variants_detail?.map((variant) => {
                                    const variantPrices = getVariantPrices(variant.id);
                                    const variantCommission = getVariantCommission(variant.id);
                                    const variantInventory = product.inventories?.find(inv => inv.variant === variant.id);

                                    return (
                                        <div key={variant.id} className="card bg-base-100 shadow-sm border">
                                            <div className="card-body p-6">
                                                {/* Variant Header */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h5 className="font-bold text-lg text-gray-900">
                                                            {variant.name}
                                                        </h5>
                                                        <p className="text-sm text-gray-500">
                                                            SKU: {variant.sku} | ID: {variant.id}
                                                        </p>
                                                    </div>
                                                    <div className={`badge badge-lg ${
                                                        variant.is_active ? 'badge-success' : 'badge-error'
                                                    }`}>
                                                        {variant.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                </div>

                                                {/* Pricing Information */}
                                                <div className="mb-4">
                                                    <h6 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <FiDollarSign className="text-green-500" />
                                                        Pricing Information
                                                    </h6>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                                                                Admin Price
                                                            </div>
                                                            <div className="font-bold text-lg text-blue-700">
                                                                {variantPrices.admin}
                                                            </div>
                                                        </div>
                                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                            <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">
                                                                Stockist Price
                                                            </div>
                                                            <div className="font-bold text-lg text-green-700">
                                                                {variantPrices.stockist}
                                                            </div>
                                                        </div>
                                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                            <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide">
                                                                Reseller Price
                                                            </div>
                                                            <div className="font-bold text-lg text-purple-700">
                                                                {variantPrices.reseller}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Commission Information */}
                                                {variantCommission && (
                                                    <div className="mb-4">
                                                        <h6 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                            <FiTrendingUp className="text-orange-500" />
                                                            Commission Details
                                                        </h6>
                                                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <label className="font-semibold text-orange-700 text-xs uppercase">
                                                                        Type
                                                                    </label>
                                                                    <p className="font-medium">{variantCommission.commission_type_display}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="font-semibold text-orange-700 text-xs uppercase">
                                                                        Reseller
                                                                    </label>
                                                                    <p className="font-medium">
                                                                        {variantCommission.reseller_commission_value} 
                                                                        {variantCommission.commission_type === 'percentage' ? '%' : '₹'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="font-semibold text-orange-700 text-xs uppercase">
                                                                        Stockist
                                                                    </label>
                                                                    <p className="font-medium">
                                                                        {variantCommission.stockist_commission_value}
                                                                        {variantCommission.commission_type === 'percentage' ? '%' : '₹'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="font-semibold text-orange-700 text-xs uppercase">
                                                                        Admin
                                                                    </label>
                                                                    <p className="font-medium">
                                                                        {variantCommission.admin_commission_value}
                                                                        {variantCommission.commission_type === 'percentage' ? '%' : '₹'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Inventory Details for Variant */}
                                                {variantInventory && (
                                                    <div>
                                                        <h6 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                            <FiPackage className="text-indigo-500" />
                                                            Inventory Details
                                                        </h6>
                                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <label className="font-semibold text-gray-600">Quantity</label>
                                                                    <p className={`font-bold ${
                                                                        variantInventory.total_quantity < 10 
                                                                            ? 'text-red-600' 
                                                                            : 'text-green-600'
                                                                    }`}>
                                                                        {variantInventory.total_quantity} units
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="font-semibold text-gray-600">Batch Number</label>
                                                                    <p className="font-medium">{variantInventory.batch_number}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="font-semibold text-gray-600">Expiry Date</label>
                                                                    <p className="font-medium">{variantInventory.expiry_date}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="font-semibold text-gray-600">Manufacture Date</label>
                                                                    <p className="font-medium">{variantInventory.manufacture_date}</p>
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
                        </div>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default ProductDetailsModal;