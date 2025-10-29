// components/modals/PriceEditModal.jsx
import React, { useState } from "react";
import { FiX, FiUser, FiUsers } from "react-icons/fi";
import { toast } from "react-toastify";
import ModalPortal from "../../components/ModalPortal";

const PriceEditModal = ({ product, isOpen, onClose, onSave }) => {
    const [prices, setPrices] = useState({
        admin_price: "",
        stockist_price: "",
        reseller_price: ""
    });

    React.useEffect(() => {
        if (product) {
            setPrices({
                admin_price: product.price || "",
                stockist_price: product.stockist_price || "",
                reseller_price: product.reseller_price || ""
            });
        }
    }, [product]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
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

        // Validate price hierarchy
        if (parseFloat(prices.admin_price) <= parseFloat(prices.stockist_price)) {
            toast.error("Admin price must be higher than stockist price");
            return;
        }
        if (parseFloat(prices.stockist_price) <= parseFloat(prices.reseller_price)) {
            toast.error("Stockist price must be higher than reseller price");
            return;
        }

        onSave({
            admin_price: parseFloat(prices.admin_price),
            stockist_price: parseFloat(prices.stockist_price),
            reseller_price: parseFloat(prices.reseller_price)
        });
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
                <div className="modal-box max-w-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Edit Prices - {product?.product_detail?.name}</h3>
                        <button onClick={onClose} className="btn btn-sm btn-circle">
                            <FiX />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <FiUser className="text-blue-600" />
                                    Admin Price (₹)
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input input-bordered"
                                value={prices.admin_price}
                                onChange={(e) => handlePriceChange('admin_price', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <FiUsers className="text-green-600" />
                                    Stockist Price (₹)
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input input-bordered"
                                value={prices.stockist_price}
                                onChange={(e) => handlePriceChange('stockist_price', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <FiUsers className="text-purple-600" />
                                    Reseller Price (₹)
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input input-bordered"
                                value={prices.reseller_price}
                                onChange={(e) => handlePriceChange('reseller_price', e.target.value)}
                                required
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">Price Hierarchy:</h4>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span>Admin Price:</span>
                                    <span className="font-bold">Highest</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Stockist Price:</span>
                                    <span className="font-bold">Middle</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Reseller Price:</span>
                                    <span className="font-bold">Lowest</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button type="button" onClick={onClose} className="btn btn-ghost">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Update Prices
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalPortal>
    );
};

export default PriceEditModal;